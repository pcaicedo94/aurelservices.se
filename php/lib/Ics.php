<?php

declare(strict_types=1);

namespace Aurel;

use DateTimeImmutable;

/**
 * The iCalendar feed (RFC 5545) that replaces Google Calendar.
 *
 * The client's team works by the day and has no shared calendar, and the
 * Google token in use belonged to a personal account. So instead of writing
 * into somebody's calendar, the bookings are published as a read-only feed the
 * team subscribes to from their phones. php/README.md has the two-tap
 * instructions for iPhone and Android.
 *
 * What RFC 5545 asks for and this builder does:
 *   - CRLF line endings, and lines folded at 75 octets with a leading space on
 *     the continuation (never splitting a UTF-8 sequence);
 *   - VERSION:2.0 and PRODID on the VCALENDAR;
 *   - DTSTART/DTEND as UTC "YYYYMMDDTHHMMSSZ" values, with Europe/Stockholm
 *     declared both as a VTIMEZONE component and as X-WR-TIMEZONE, so a phone
 *     that reads the feed shows Swedish wall clock times;
 *   - a UID that is stable for the life of a booking (the `uid` column, fixed
 *     at insert time), so an edited booking updates the existing entry instead
 *     of adding a second one;
 *   - SEQUENCE, incremented whenever a booking is modified, which is what tells
 *     the subscriber that this version supersedes the one it already has;
 *   - DTSTAMP and LAST-MODIFIED, and STATUS CONFIRMED/CANCELLED.
 */
final class Ics
{
    public const PRODID = '-//Aurel Stad & Allservice AB//Bokningar//SV';
    public const CALENDAR_NAME = 'Aurel – bokningar';

    /** Everything after the UID local part; keeps UIDs globally unique. */
    public const UID_DOMAIN = 'aurelservice.se';

    /**
     * RFC 5545 §3.3.11 TEXT escaping: backslash, semicolon, comma and newline.
     * The order matters — backslashes first, or the escapes get escaped.
     */
    public static function escapeText(string $value): string
    {
        $value = str_replace("\r\n", "\n", $value);

        return str_replace(
            ['\\', ';', ',', "\n", "\r"],
            ['\\\\', '\\;', '\\,', '\\n', '\\n'],
            $value
        );
    }

    /**
     * RFC 5545 §3.1 content line folding: no line over 75 octets, continuation
     * lines start with one space. Counted in OCTETS, not characters, and never
     * splitting a multi-byte sequence — "Städning" must not come back as a
     * replacement character on the phone.
     */
    public static function fold(string $line): string
    {
        if (strlen($line) <= 75) {
            return $line;
        }

        $out = '';
        $current = '';
        $limit = 75;
        $length = strlen($line);
        for ($i = 0; $i < $length; $i++) {
            $byte = $line[$i];
            // Start of a UTF-8 sequence? Find how long it is, so the whole
            // character moves to the next line together.
            $charLength = 1;
            $ord = ord($byte);
            if ($ord >= 0xF0) {
                $charLength = 4;
            } elseif ($ord >= 0xE0) {
                $charLength = 3;
            } elseif ($ord >= 0xC0) {
                $charLength = 2;
            } elseif ($ord >= 0x80) {
                // Continuation byte reached on its own: already consumed below.
                $charLength = 1;
            }
            $char = substr($line, $i, $charLength);
            $i += $charLength - 1;

            if (strlen($current) + strlen($char) > $limit) {
                $out .= $current . "\r\n";
                $current = ' ';
                $limit = 75;
            }
            $current .= $char;
        }

        return $out . $current;
    }

    /** @param list<string> $lines */
    private static function join(array $lines): string
    {
        return implode('', array_map(static fn (string $line): string => self::fold($line) . "\r\n", $lines));
    }

    /**
     * Static VTIMEZONE for Europe/Stockholm. The EU rule has been stable since
     * 1996 (last Sunday of March / October at 01:00 UTC) and RRULE says so, so
     * this block does not need regenerating.
     *
     * @return list<string>
     */
    private static function vtimezone(): array
    {
        return [
            'BEGIN:VTIMEZONE',
            'TZID:Europe/Stockholm',
            'X-LIC-LOCATION:Europe/Stockholm',
            'BEGIN:DAYLIGHT',
            'TZOFFSETFROM:+0100',
            'TZOFFSETTO:+0200',
            'TZNAME:CEST',
            'DTSTART:19700329T020000',
            'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
            'END:DAYLIGHT',
            'BEGIN:STANDARD',
            'TZOFFSETFROM:+0200',
            'TZOFFSETTO:+0100',
            'TZNAME:CET',
            'DTSTART:19701025T030000',
            'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
            'END:STANDARD',
            'END:VTIMEZONE',
        ];
    }

    /**
     * @param list<array<string,mixed>> $bookings rows from BookingStore::upcoming()
     */
    public static function build(array $bookings, DateTimeImmutable $now): string
    {
        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:' . self::PRODID,
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:' . self::escapeText(self::CALENDAR_NAME),
            'X-WR-TIMEZONE:' . Clock::TIME_ZONE,
            // Hint for subscribers; both spellings are in the wild.
            'REFRESH-INTERVAL;VALUE=DURATION:PT30M',
            'X-PUBLISHED-TTL:PT30M',
        ];
        $lines = array_merge($lines, self::vtimezone());

        foreach ($bookings as $booking) {
            $lines = array_merge($lines, self::event($booking, $now));
        }

        $lines[] = 'END:VCALENDAR';

        return self::join($lines);
    }

    /**
     * @param array<string,mixed> $booking
     * @return list<string>
     */
    private static function event(array $booking, DateTimeImmutable $now): array
    {
        $startsAt = Clock::fromSqlUtc((string) $booking['date_time']) ?? $now;
        $endsAt = Clock::fromSqlUtc((string) ($booking['ends_at'] ?? '')) ?? $startsAt;
        $created = Clock::fromSqlUtc((string) ($booking['created_at'] ?? '')) ?? $now;
        $updated = Clock::fromSqlUtc((string) ($booking['updated_at'] ?? '')) ?? $created;

        $summary = Escape::singleLine($booking['cleaning_type']) . ' - ' . Escape::singleLine($booking['name']);
        $status = ((string) ($booking['status'] ?? 'confirmed')) === 'cancelled' ? 'CANCELLED' : 'CONFIRMED';

        $lines = [
            'BEGIN:VEVENT',
            // Stable per booking, fixed when the row is inserted: an edit
            // updates the entry on the phone, it does not create a second one.
            'UID:' . (string) $booking['uid'] . '@' . self::UID_DOMAIN,
            'DTSTAMP:' . Clock::toIcsUtc($now),
            'DTSTART:' . Clock::toIcsUtc($startsAt),
            'DTEND:' . Clock::toIcsUtc($endsAt),
            'SEQUENCE:' . (int) ($booking['sequence'] ?? 0),
            'STATUS:' . $status,
            'TRANSP:OPAQUE',
            'CREATED:' . Clock::toIcsUtc($created),
            'LAST-MODIFIED:' . Clock::toIcsUtc($updated),
            'SUMMARY:' . self::escapeText($summary),
        ];

        $location = Escape::singleLine($booking['address'] ?? '');
        if ($location !== '') {
            $lines[] = 'LOCATION:' . self::escapeText($location);
        }

        $description = (string) ($booking['description'] ?? '');
        if ($description !== '') {
            $lines[] = 'DESCRIPTION:' . self::escapeText($description);
        }

        $lines[] = 'END:VEVENT';

        return $lines;
    }
}
