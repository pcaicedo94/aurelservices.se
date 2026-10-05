<?php

declare(strict_types=1);

namespace Aurel;

use DateTimeImmutable;
use PDO;
use PDOException;
use Throwable;

/**
 * Reads and writes the `bookings` table (php/sql/schema.sql).
 *
 * Order of operations changed from the JavaScript on purpose. There, the
 * calendar was written first and the database second, and a failed insert was
 * only logged — which is how every booking since March 2026 silently lost its
 * record (see scripts/supabase-bookings-migration.sql). Here the database write
 * IS the reservation: it either succeeds, or there is no booking and the caller
 * answers 409 or 500. Nothing can be half-booked, so the admin mail no longer
 * needs its "could not be saved" warning banner.
 */
final class BookingStore
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * Inserts the booking and claims its slots in one transaction.
     *
     * @param array<string,mixed> $data   from BookingRules::validateBooking()
     * @param array<string,mixed> $record from BookingRules::detailsRecord()
     * @return array{id:int,uid:string}
     *
     * @throws SlotTakenException when the slot is already occupied by another booking.
     */
    public function insert(array $data, array $record, string $description): array
    {
        /** @var DateTimeImmutable $startsAt */
        $startsAt = $data['startsAt'];
        $durationHours = (float) $data['durationHours'];
        $endsAt = Slots::endOf($startsAt, $durationHours);
        $slots = Slots::forBooking($startsAt, $durationHours);

        // Stable, collision-free identity for the .ics UID. Generated here so
        // the UID never changes for a booking, however often it is edited.
        $uid = self::newUid();

        $this->pdo->beginTransaction();
        try {
            $insert = $this->pdo->prepare(
                'INSERT INTO bookings
                    (uid, cleaning_type, name, email, phone, address,
                     date_time, ends_at, duration_hours, total_price, details, description)
                 VALUES
                    (:uid, :cleaning_type, :name, :email, :phone, :address,
                     :date_time, :ends_at, :duration_hours, :total_price, :details, :description)'
            );
            $insert->execute([
                ':uid' => $uid,
                ':cleaning_type' => (string) $data['cleaningType'],
                ':name' => (string) $data['name'],
                ':email' => (string) $data['email'],
                ':phone' => (string) $data['phone'],
                ':address' => (string) $data['address'],
                ':date_time' => Clock::toSqlUtc($startsAt),
                ':ends_at' => Clock::toSqlUtc($endsAt),
                ':duration_hours' => number_format($durationHours, 2, '.', ''),
                ':total_price' => number_format((float) $data['totalPrice'], 2, '.', ''),
                ':details' => (string) json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                ':description' => $description,
            ]);
            $id = (int) $this->pdo->lastInsertId();

            $claim = $this->pdo->prepare(
                'INSERT INTO booking_slots (booking_id, slot_start) VALUES (:booking_id, :slot_start)'
            );
            foreach ($slots as $slot) {
                $claim->execute([':booking_id' => $id, ':slot_start' => $slot]);
            }

            $this->pdo->commit();
        } catch (PDOException $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            // 1062 inside this transaction can only come from
            // booking_slots.slot_start: `uid` is 32 random hex characters.
            if (Db::isDuplicateKey($e)) {
                throw new SlotTakenException('Slot already booked: ' . Clock::toSqlUtc($startsAt), 0, $e);
            }
            throw $e;
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }

        return ['id' => $id, 'uid' => $uid];
    }

    /**
     * The booking already holding this start time, if its customer is the same
     * person. A retry after a timeout then gets the normal success answer
     * instead of a puzzling "the time is not available" about their own
     * booking.
     *
     * @return array<string,mixed>|null
     */
    public function findOwnDuplicate(DateTimeImmutable $startsAt, string $email): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, uid FROM bookings
              WHERE date_time = :date_time AND email = :email AND status = \'confirmed\'
              ORDER BY id DESC LIMIT 1'
        );
        $statement->execute([':date_time' => Clock::toSqlUtc($startsAt), ':email' => $email]);
        $row = $statement->fetch(PDO::FETCH_ASSOC);

        return $row === false ? null : $row;
    }

    /** Records what happened to the two notification mails, for the office. */
    public function recordNotification(int $id, bool $adminSent, bool $customerSent, string $error): void
    {
        try {
            $statement = $this->pdo->prepare(
                'UPDATE bookings
                    SET notified_at = CASE WHEN :admin_sent = 1 THEN UTC_TIMESTAMP() ELSE notified_at END,
                        mail_error  = :error
                  WHERE id = :id'
            );
            $statement->execute([
                ':admin_sent' => $adminSent ? 1 : 0,
                ':error' => $error === '' ? null : mb_substr($error, 0, 500, 'UTF-8'),
                ':id' => $id,
            ]);
            unset($customerSent);
        } catch (Throwable $e) {
            // Bookkeeping only: never fail a saved booking over it.
            error_log('Could not record the mail status of booking ' . $id . ': ' . $e->getMessage());
        }
    }

    /**
     * The bookings the .ics feed publishes: everything that has not finished
     * yet, counted from the start of today in Stockholm so the current day
     * stays visible on a phone.
     *
     * @return list<array<string,mixed>>
     */
    public function upcoming(DateTimeImmutable $now, int $limit = 1000): array
    {
        $parts = Clock::stockholmParts($now);
        $dayStart = Clock::stockholmToUtc(sprintf('%04d-%02d-%02dT00:00', $parts['year'], $parts['month'], $parts['day']));

        $statement = $this->pdo->prepare(
            'SELECT id, uid, cleaning_type, name, email, phone, address,
                    date_time, ends_at, duration_hours, total_price, description,
                    sequence, status, created_at, updated_at
               FROM bookings
              WHERE ends_at >= :from
              ORDER BY date_time ASC
              LIMIT :row_limit'
        );
        // Bound, not interpolated: MySQL 8 takes a real placeholder in LIMIT,
        // so no value in this file ever reaches SQL as text.
        $statement->bindValue(':from', Clock::toSqlUtc($dayStart ?? $now), PDO::PARAM_STR);
        $statement->bindValue(':row_limit', $limit, PDO::PARAM_INT);
        $statement->execute();

        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }

    /** 32 hex characters: the local part of the iCalendar UID. */
    public static function newUid(): string
    {
        return bin2hex(random_bytes(16));
    }
}
