<?php

declare(strict_types=1);

namespace Aurel;

use DateTimeImmutable;
use DateTimeZone;

/**
 * Europe/Stockholm conversions. Port of utils/timeZone.js.
 *
 * Why this file exists at all: the booking forms submit a naive wall clock
 * string ("2026-09-01T10:00"). A server running in UTC that reads that string
 * as its own local time checks availability for a different window than the
 * one it books — that was the double booking bug fixed in utils/timeZone.js.
 *
 * The JS had to reconstruct the offset by hand (two passes over
 * Intl.DateTimeFormat). PHP has a real tz database, so DateTimeZone does the
 * same job exactly, summer time included: 10:00 in January is 09:00Z (CET,
 * +01:00) and 10:00 in July is 08:00Z (CEST, +02:00). tests/test_clock.php
 * pins both.
 */
final class Clock
{
    public const TIME_ZONE = 'Europe/Stockholm';

    private static ?DateTimeZone $stockholm = null;
    private static ?DateTimeZone $utc = null;

    public static function stockholm(): DateTimeZone
    {
        return self::$stockholm ??= new DateTimeZone(self::TIME_ZONE);
    }

    public static function utc(): DateTimeZone
    {
        return self::$utc ??= new DateTimeZone('UTC');
    }

    /** Current instant, always in UTC. */
    public static function now(): DateTimeImmutable
    {
        return new DateTimeImmutable('now', self::utc());
    }

    /** Milliseconds since the epoch, to compare with the form's formStartedAt. */
    public static function nowMs(): int
    {
        return (int) round(microtime(true) * 1000);
    }

    /**
     * Turns the naive wall clock string the booking form produces into the
     * real UTC instant it represents in Europe/Stockholm. Null when the string
     * is not a well formed, existing calendar date and time.
     *
     * Accepts the same shapes as the JS: "Y-m-dTH:i", "Y-m-d H:i" and an
     * optional ":ss".
     */
    public static function stockholmToUtc(?string $wallClock): ?DateTimeImmutable
    {
        $text = trim((string) $wallClock);
        if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/', $text, $m)) {
            return null;
        }

        [, $year, $month, $day, $hour, $minute] = array_map('intval', $m);
        $second = isset($m[6]) ? (int) $m[6] : 0;

        // "2026-02-31T10:00" parses but is not a date. The JS relied on
        // Date.UTC rolling over; here we refuse it outright, which is what the
        // browser rule in lib/booking/rules.js does too.
        if (!checkdate($month, $day, $year) || $hour > 23 || $minute > 59 || $second > 59) {
            return null;
        }

        $local = DateTimeImmutable::createFromFormat(
            'Y-m-d H:i:s',
            sprintf('%04d-%02d-%02d %02d:%02d:%02d', $year, $month, $day, $hour, $minute, $second),
            self::stockholm()
        );
        if ($local === false) {
            return null;
        }

        return $local->setTimezone(self::utc());
    }

    /**
     * The naive Stockholm wall clock of an instant, "Y-m-dTH:i:s". Used for
     * display and for the Stockholm day boundaries of the .ics feed.
     */
    public static function toStockholmWallClock(DateTimeImmutable $instant): string
    {
        return $instant->setTimezone(self::stockholm())->format('Y-m-d\TH:i:s');
    }

    /**
     * Calendar fields of an instant as seen in Stockholm. `weekday` follows
     * JavaScript's Date#getUTCDay: 0 = Sunday ... 6 = Saturday.
     *
     * @return array{year:int,month:int,day:int,hour:int,minute:int,weekday:int}
     */
    public static function stockholmParts(DateTimeImmutable $instant): array
    {
        $local = $instant->setTimezone(self::stockholm());

        return [
            'year' => (int) $local->format('Y'),
            'month' => (int) $local->format('n'),
            'day' => (int) $local->format('j'),
            'hour' => (int) $local->format('G'),
            'minute' => (int) $local->format('i'),
            'weekday' => (int) $local->format('w'),
        ];
    }

    private const SWEDISH_MONTHS = [
        1 => 'januari', 'februari', 'mars', 'april', 'maj', 'juni',
        'juli', 'augusti', 'september', 'oktober', 'november', 'december',
    ];

    /**
     * Human readable Swedish date/time for the emails, always in Stockholm
     * time: "1 september 2026 kl. 10:00".
     *
     * Written out by hand rather than with IntlDateFormatter so the output is
     * identical whether or not the `intl` extension is enabled on the server.
     * It matches Intl.DateTimeFormat("sv-SE", { dateStyle: "long", timeStyle:
     * "short" }) byte for byte; tests/test_clock.php pins the strings.
     */
    public static function formatStockholm(DateTimeImmutable $instant): string
    {
        $local = $instant->setTimezone(self::stockholm());

        return sprintf(
            '%d %s %d kl. %s',
            (int) $local->format('j'),
            self::SWEDISH_MONTHS[(int) $local->format('n')],
            (int) $local->format('Y'),
            $local->format('H:i')
        );
    }

    /** "YYYYMMDDTHHMMSSZ", the UTC form RFC 5545 wants for DTSTART/DTEND. */
    public static function toIcsUtc(DateTimeImmutable $instant): string
    {
        return $instant->setTimezone(self::utc())->format('Ymd\THis\Z');
    }

    /** "Y-m-d H:i:s" in UTC: what every DATETIME column in php/sql/schema.sql holds. */
    public static function toSqlUtc(DateTimeImmutable $instant): string
    {
        return $instant->setTimezone(self::utc())->format('Y-m-d H:i:s');
    }

    /** Reads a UTC "Y-m-d H:i:s" back out of MySQL. */
    public static function fromSqlUtc(string $value): ?DateTimeImmutable
    {
        $parsed = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', trim($value), self::utc());

        return $parsed === false ? null : $parsed;
    }
}
