<?php

declare(strict_types=1);

namespace Aurel;

use DateTimeImmutable;

/**
 * How "no double booking" (QA-01) is enforced now that Google Calendar is gone.
 *
 * The JavaScript had to compensate after the fact: insert the event, list the
 * window again, and delete our own event if an older one had appeared
 * (utils/reserveSlot.js). Google Calendar has no conditional insert, so there
 * was no other way.
 *
 * MySQL does have one. A booking is cut into fixed 30 minute slots and each
 * slot is one row in `booking_slots`, whose `slot_start` column carries a
 * UNIQUE index. Two concurrent requests for overlapping times cannot both
 * commit: the second one gets error 1062 and the endpoint answers 409. No
 * second look, no compensation, no window in which both sides think they won.
 *
 * Slots are computed in UTC, so a DST change cannot shift or duplicate one.
 * A booking that does not land on the grid (10:05) reserves the slots it
 * touches (10:00 to 12:30 for 10:05–12:05): the team cannot be in two places,
 * so rounding outwards is the correct direction.
 */
final class Slots
{
    public const SLOT_MINUTES = 30;

    /**
     * The slot starts a booking occupies, as UTC "Y-m-d H:i:s" strings.
     *
     * @return list<string>
     */
    public static function forBooking(DateTimeImmutable $startsAt, float $durationHours): array
    {
        $slotSeconds = self::SLOT_MINUTES * 60;
        $startTs = $startsAt->getTimestamp();
        $endTs = $startTs + (int) round($durationHours * 3600);

        $first = intdiv($startTs, $slotSeconds) * $slotSeconds;
        // The slot that contains the last second of the booking.
        $last = intdiv(max($endTs - 1, $first), $slotSeconds) * $slotSeconds;

        $slots = [];
        for ($ts = $first; $ts <= $last; $ts += $slotSeconds) {
            $slots[] = gmdate('Y-m-d H:i:s', $ts);
        }

        return $slots;
    }

    public static function endOf(DateTimeImmutable $startsAt, float $durationHours): DateTimeImmutable
    {
        return $startsAt->modify('+' . (int) round($durationHours * 3600) . ' seconds');
    }
}
