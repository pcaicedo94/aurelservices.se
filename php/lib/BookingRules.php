<?php

declare(strict_types=1);

namespace Aurel;

use DateTimeImmutable;

/**
 * Booking rules enforced by /api/booking.
 *
 * SOURCE OF TRUTH: utils/bookingRules.js (server rules) and
 * lib/booking/rules.js (the same values applied by the calculator pages in the
 * browser). This file is a one-to-one port: no value here may be changed
 * without changing it there first. Rules still marked TODO(cliente Qnn) in the
 * JavaScript keep their marker here.
 *
 *   MIN_NOTICE_DAYS / MIN_NOTICE_TIME  utils/bookingRules.js
 *   BOOKABLE_WEEKDAYS                  utils/bookingRules.js  (TODO Q13)
 *   FIRST_START_MINUTE / LAST_START_MINUTE  utils/bookingRules.js (Q16)
 *   MIN_BILLABLE_HOURS / MAX_BOOKING_HOURS  utils/bookingRules.js (TODO Q14)
 *   MAX_ONLINE_AREA                    lib/booking/rules.js
 */
final class BookingRules
{
    /**
     * Earliest start: the day after tomorrow at 07:00 Stockholm time, the same
     * minimum the booking forms put on their date picker.
     */
    public const MIN_NOTICE_DAYS = 2;
    public const MIN_NOTICE_TIME = '07:00';

    /** TODO(cliente Q13): confirm that bookings are Monday to Friday only. 0 = Sunday ... 6 = Saturday. */
    public const BOOKABLE_WEEKDAYS = [1, 2, 3, 4, 5];

    /**
     * Q16 (client, confirmed): a booking may start from 07:00 to 15:00
     * INCLUSIVE. 15:00 is bookable, 15:01 is not. The forms apply the same
     * window.
     */
    public const FIRST_START_MINUTE = 7 * 60;
    public const LAST_START_MINUTE = 15 * 60;

    /**
     * TODO(cliente Q14): confirm the 2 hour billable minimum. A shorter
     * estimate is still accepted: it is booked and billed as 2 hours, never
     * rejected.
     */
    public const MIN_BILLABLE_HOURS = 2;
    public const MAX_BOOKING_HOURS = 12;

    /**
     * A size above this is not an ordinary home or office, so it is quoted
     * instead of priced online (lib/booking/rules.js MAX_ONLINE_AREA). The
     * browser already stops it; the server checks it too, because a request
     * does not have to come from our own form.
     */
    public const MAX_ONLINE_AREA = 1000;

    public const MAX_FIELD_LENGTH = 300;

    private const EMAIL_PATTERN = '/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/';
    private const PHONE = '076-045 02 28';

    /**
     * Trims, drops line breaks and caps the length of every free text field so
     * a single form value cannot bloat an email, a calendar entry or a DB row.
     *
     * @param mixed $value
     */
    public static function cleanField($value): string
    {
        return mb_substr(Escape::singleLine($value), 0, self::MAX_FIELD_LENGTH, 'UTF-8');
    }

    /* ------------------------------- values ------------------------------- */

    /**
     * A bookable price is a positive number. null, "", 0, negatives and text
     * such as "Offereras" mean the calculator could not price the job, and
     * that calls for a quote, not a booking.
     *
     * @param mixed $value
     */
    public static function parsePrice($value): ?float
    {
        if (is_int($value) || is_float($value)) {
            return is_finite((float) $value) && $value > 0 ? (float) $value : null;
        }
        if (!is_string($value)) {
            return null;
        }
        $trimmed = trim($value);
        if (!preg_match('/^\d+(\.\d+)?$/', $trimmed)) {
            return null;
        }
        $price = (float) $trimmed;

        return $price > 0 ? $price : null;
    }

    /**
     * Home cleaning sends `estimatedHours`, move cleaning `hours`, the other
     * forms neither.
     *
     * Mirrors the JS tri-state: null when the field is absent (JS undefined),
     * NAN when it is present but not a number (JS NaN), the number otherwise.
     *
     * @param array<string,mixed> $body
     */
    public static function parseHours(array $body): ?float
    {
        $raw = null;
        foreach (['estimatedHours', 'hours'] as $key) {
            $value = $body[$key] ?? null;
            if ($value !== null && trim(Escape::toText($value)) !== '') {
                $raw = $value;
                break;
            }
        }
        if ($raw === null) {
            return null;
        }
        if (is_int($raw) || is_float($raw)) {
            return is_finite((float) $raw) ? (float) $raw : NAN;
        }
        $text = trim(Escape::toText($raw));

        // Number(String) in JS: a fully numeric string, nothing else.
        return is_numeric($text) ? (float) $text : NAN;
    }

    /**
     * Hours reserved and recorded with the booking: the estimate raised to the
     * billable minimum (which is also what forms without an estimate get),
     * capped at MAX_BOOKING_HOURS.
     */
    public static function bookingDurationHours(?float $hours): float
    {
        if ($hours === null || is_nan($hours)) {
            return (float) self::MIN_BILLABLE_HOURS;
        }

        return (float) min(self::MAX_BOOKING_HOURS, max(self::MIN_BILLABLE_HOURS, $hours));
    }

    /**
     * True when the form's own estimate is below the billable minimum, so the
     * office can see that the minimum was applied.
     */
    public static function minimumHoursApplied(?float $hours): bool
    {
        return $hours !== null && !is_nan($hours) && $hours < self::MIN_BILLABLE_HOURS;
    }

    /**
     * The `area` field in m². null when the form sent none, NAN when it sent
     * something unreadable.
     *
     * @param array<string,mixed> $body
     */
    public static function parseArea(array $body): ?float
    {
        $raw = $body['area'] ?? null;
        if ($raw === null || trim(Escape::toText($raw)) === '') {
            return null;
        }
        if (is_int($raw) || is_float($raw)) {
            return is_finite((float) $raw) ? (float) $raw : NAN;
        }
        // The browser accepts a Swedish decimal comma (lib/booking/rules.js).
        $text = str_replace(',', '.', trim(Escape::toText($raw)));

        return is_numeric($text) ? (float) $text : NAN;
    }

    /* -------------------------------- rules ------------------------------- */

    public static function earliestBookableStart(DateTimeImmutable $now): DateTimeImmutable
    {
        $parts = Clock::stockholmParts($now);
        // Calendar arithmetic on the Stockholm date, not on the instant: two
        // days ahead must be two dates ahead even across a DST change.
        $target = (new DateTimeImmutable('now', Clock::utc()))
            ->setDate($parts['year'], $parts['month'], $parts['day'])
            ->setTime(0, 0)
            ->modify('+' . self::MIN_NOTICE_DAYS . ' day');

        $start = Clock::stockholmToUtc($target->format('Y-m-d') . 'T' . self::MIN_NOTICE_TIME);

        // stockholmToUtc only returns null for a malformed string, which the
        // line above cannot produce.
        return $start ?? $now;
    }

    /**
     * Violations of the calendar rules for a start instant, in Stockholm time.
     *
     * @return list<string>
     */
    public static function checkSchedule(DateTimeImmutable $startsAt, DateTimeImmutable $now): array
    {
        $errors = [];

        if ($startsAt->getTimestamp() < $now->getTimestamp()) {
            $errors[] = 'past';
        } elseif ($startsAt->getTimestamp() < self::earliestBookableStart($now)->getTimestamp()) {
            $errors[] = 'too-soon';
        }

        $parts = Clock::stockholmParts($startsAt);
        if (!in_array($parts['weekday'], self::BOOKABLE_WEEKDAYS, true)) {
            $errors[] = 'weekday';
        }

        $startMinute = $parts['hour'] * 60 + $parts['minute'];
        if ($startMinute < self::FIRST_START_MINUTE || $startMinute > self::LAST_START_MINUTE) {
            $errors[] = 'start-time';
        }

        return $errors;
    }

    /**
     * Only an unreadable estimate is an error. A short one is not: the minimum
     * is applied by bookingDurationHours instead (TODO cliente Q14).
     *
     * @return list<string>
     */
    public static function checkHours(?float $hours): array
    {
        return $hours !== null && is_nan($hours) ? ['hours'] : [];
    }

    /**
     * Unreadable or above MAX_ONLINE_AREA. A missing area is fine: several
     * forms (window cleaning, moving help) never ask for one.
     *
     * @return list<string>
     */
    public static function checkArea(?float $area): array
    {
        if ($area === null) {
            return [];
        }
        if (is_nan($area) || $area < 1) {
            return ['area'];
        }

        return $area > self::MAX_ONLINE_AREA ? ['area-too-large'] : [];
    }

    /**
     * @param array<string,mixed> $body
     * @return array{errors:list<string>,data:array<string,mixed>}
     */
    public static function validateBooking(array $body, DateTimeImmutable $now): array
    {
        $errors = [];

        $cleaningType = self::cleanField($body['cleaningType'] ?? null);
        $name = self::cleanField($body['name'] ?? null);
        $email = self::cleanField($body['email'] ?? null);
        $phone = self::cleanField($body['phone'] ?? null);
        $address = self::cleanField($body['address'] ?? null);

        if ($cleaningType === '') {
            $errors[] = 'cleaningType';
        }
        if ($name === '') {
            $errors[] = 'name';
        }
        if ($email === '' || !preg_match(self::EMAIL_PATTERN, $email)) {
            $errors[] = 'email';
        }
        if ($phone === '') {
            $errors[] = 'phone';
        }
        if ($address === '') {
            $errors[] = 'address';
        }

        $startsAt = Clock::stockholmToUtc(is_scalar($body['dateTime'] ?? null) ? (string) $body['dateTime'] : null);
        if ($startsAt !== null) {
            $errors = array_merge($errors, self::checkSchedule($startsAt, $now));
        } else {
            $errors[] = 'dateTime';
        }

        $hours = self::parseHours($body);
        $errors = array_merge($errors, self::checkHours($hours));

        $area = self::parseArea($body);
        $errors = array_merge($errors, self::checkArea($area));

        $totalPrice = self::parsePrice($body['totalPrice'] ?? null);
        if ($totalPrice === null) {
            $errors[] = 'price';
        }

        return [
            'errors' => $errors,
            'data' => [
                'cleaningType' => $cleaningType,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'address' => $address,
                'startsAt' => $startsAt,
                'totalPrice' => $totalPrice,
                'durationHours' => self::bookingDurationHours($hours),
            ],
        ];
    }

    private const FIELD_ERRORS = ['cleaningType', 'name', 'email', 'phone', 'address', 'dateTime', 'hours', 'area'];

    /**
     * One message for the customer, most fundamental problem first.
     *
     * @param list<string> $errors
     */
    public static function bookingErrorMessage(array $errors, DateTimeImmutable $now): string
    {
        $has = static fn (string $code): bool => in_array($code, $errors, true);

        foreach (self::FIELD_ERRORS as $code) {
            if ($has($code)) {
                return 'Vänligen fyll i alla uppgifter korrekt.';
            }
        }
        if ($has('past')) {
            return 'Den valda tiden har redan passerat. Vänligen välj en annan tid.';
        }
        if ($has('too-soon')) {
            return 'Tidigast bokningsbara tid är ' . Clock::formatStockholm(self::earliestBookableStart($now))
                . '. Vänligen välj en senare tid.';
        }
        if ($has('weekday')) {
            return 'Vi tar emot bokningar måndag till fredag. Vänligen välj en vardag.';
        }
        if ($has('start-time')) {
            return 'Vänligen välj en starttid mellan 07:00 och 15:00.';
        }
        if ($has('area-too-large')) {
            return 'Ytan är större än vi kan prissätta online. Begär gärna en offert så återkommer vi med ett pris, '
                . 'eller ring oss på ' . self::PHONE . '.';
        }
        if ($has('price')) {
            return 'Vi kunde inte räkna fram ett pris för den här bokningen. Begär gärna en offert så återkommer vi '
                . 'med ett pris, eller ring oss på ' . self::PHONE . '.';
        }

        return 'Vänligen fyll i alla uppgifter korrekt.';
    }

    /* ------------------------------- details ------------------------------ */

    private const CONTACT_PREFERENCES = ['call' => 'Bli uppringd', 'visit' => 'Få ett hembesök'];

    /**
     * What the booking forms send beyond the core fields, with the label shown
     * in the admin mail and the calendar event, in display order (QA-06).
     *
     * @return list<array{key:string,label:string,format:?callable}>
     */
    public static function detailFields(): array
    {
        return [
            ['key' => 'contactPreference', 'label' => 'Kontaktmetod',
                'format' => static fn (string $v): string => self::CONTACT_PREFERENCES[$v] ?? $v],
            ['key' => 'area', 'label' => 'Yta', 'format' => static fn (string $v): string => $v . ' m²'],
            ['key' => 'rooms', 'label' => 'Rum', 'format' => null],
            ['key' => 'numberOfUnits', 'label' => 'Enheter', 'format' => null],
            ['key' => 'frequency', 'label' => 'Frekvens', 'format' => null],
            ['key' => 'estimatedHours', 'label' => 'Beräknad tid',
                'format' => static fn (string $v): string => $v . ' timmar'],
            ['key' => 'hours', 'label' => 'Beräknad tid',
                'format' => static fn (string $v): string => $v . ' timmar'],
            ['key' => 'extras', 'label' => 'Tillval', 'format' => null],
            ['key' => 'addOns', 'label' => 'Tillägg', 'format' => null],
            ['key' => 'basePrice', 'label' => 'Grundpris', 'format' => static fn (string $v): string => $v . ' kr'],
            ['key' => 'hourlyRate', 'label' => 'Timpris', 'format' => static fn (string $v): string => $v . ' kr/tim'],
            ['key' => 'pricePerUnit', 'label' => 'Pris per enhet',
                'format' => static fn (string $v): string => $v . ' kr'],
        ];
    }

    private const HOURS_FIELDS = ['estimatedHours', 'hours'];

    /** Rendered on their own, so they are not repeated as details. */
    private const CORE_FIELDS = ['cleaningType', 'name', 'email', 'phone', 'address', 'dateTime', 'totalPrice'];

    private const MAX_EXTRA_FIELDS = 10;
    private const MAX_RECORD_FIELDS = 40;

    /** @param mixed $value */
    private static function textOf($value): string
    {
        if (is_string($value) || is_int($value) || is_float($value)) {
            return self::cleanField($value);
        }
        if (is_bool($value)) {
            return $value ? 'Ja' : '';
        }
        if (is_array($value)) {
            $scalars = array_filter($value, static fn ($v): bool => is_string($v) || is_int($v) || is_float($v));

            return self::cleanField(implode(', ', array_map(static fn ($v): string => (string) $v, $scalars)));
        }

        return '';
    }

    /**
     * [label, value] rows for every detail the form sent. Known fields get
     * their Swedish label; a field a form adds later still shows up under its
     * own key instead of being dropped. Values are plain text: escape them
     * when rendering.
     *
     * @param array<string,mixed> $body
     * @return list<array{0:string,1:string}>
     */
    public static function collectDetails(array $body): array
    {
        $rows = [];
        $known = [];

        $hours = self::parseHours($body);
        $minimumNoted = false;
        foreach (self::detailFields() as $field) {
            $known[$field['key']] = true;
            $value = self::textOf($body[$field['key']] ?? null);
            if ($value === '') {
                continue;
            }
            $rows[] = [$field['label'], $field['format'] === null ? $value : ($field['format'])($value)];
            // The estimate is shown as sent, followed by a note when the
            // billable minimum replaces it.
            if (
                in_array($field['key'], self::HOURS_FIELDS, true)
                && !$minimumNoted
                && self::minimumHoursApplied($hours)
            ) {
                $rows[] = ['Debitering', 'Debiteras minst ' . self::MIN_BILLABLE_HOURS . ' timmar'];
                $minimumNoted = true;
            }
        }

        $skipped = $known;
        foreach (array_merge(self::CORE_FIELDS, AntiSpam::FIELDS) as $key) {
            $skipped[$key] = true;
        }
        $others = array_slice(
            array_filter(array_keys($body), static fn ($key): bool => !isset($skipped[(string) $key])),
            0,
            self::MAX_EXTRA_FIELDS
        );
        foreach ($others as $key) {
            $value = self::textOf($body[$key]);
            if ($value !== '') {
                $rows[] = [self::cleanField($key), $value];
            }
        }

        return $rows;
    }

    /**
     * The `details` JSON column: every field the form sent, cleaned, under its
     * own key (numbers stay numbers), instead of the raw request body.
     *
     * @param array<string,mixed> $body
     * @return array<string,string|float|int>
     */
    public static function detailsRecord(array $body): array
    {
        $record = [];
        $ignored = array_fill_keys(AntiSpam::FIELDS, true);
        $keys = array_slice(
            array_filter(array_keys($body), static fn ($key): bool => !isset($ignored[(string) $key])),
            0,
            self::MAX_RECORD_FIELDS
        );
        foreach ($keys as $key) {
            $value = $body[$key];
            if ((is_int($value) || is_float($value)) && is_finite((float) $value)) {
                $record[self::cleanField($key)] = $value;
            } else {
                $text = self::textOf($value);
                if ($text !== '') {
                    $record[self::cleanField($key)] = $text;
                }
            }
        }
        // What was actually reserved, after the billable minimum. The form's
        // own estimate stays under its original key.
        $record['bookedHours'] = self::bookingDurationHours(self::parseHours($body));

        return $record;
    }

    /**
     * Plain text summary of a booking, for the .ics DESCRIPTION. The JS
     * equivalent (bookingEventDescription) HTML-escaped every value because
     * Google Calendar renders descriptions as HTML; an iCalendar DESCRIPTION
     * is plain text, where "&amp;" would be shown literally, so here the
     * values are only line-stripped and the RFC 5545 escaping is applied by
     * Ics::escapeText().
     *
     * @param array<string,mixed> $data
     * @param list<array{0:string,1:string}> $details
     */
    public static function describe(array $data, array $details): string
    {
        $rows = array_merge(
            [
                ['Telefon', (string) $data['phone']],
                ['E-post', (string) $data['email']],
                ['Pris', self::formatPrice((float) $data['totalPrice']) . ' kr'],
            ],
            $details
        );

        return implode("\n", array_map(
            static fn (array $row): string => Escape::singleLine($row[0]) . ': ' . Escape::singleLine($row[1]),
            $rows
        ));
    }

    /** 2650 instead of 2650.0, 2650.5 kept, so emails read like the JS ones. */
    public static function formatPrice(float $price): string
    {
        return $price === floor($price) ? (string) (int) $price : (string) $price;
    }
}
