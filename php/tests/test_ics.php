<?php

declare(strict_types=1);

use Aurel\Clock;
use Aurel\Ics;
use Aurel\Slots;
use Aurel\Tests\Check;

/**
 * The .ics feed that replaces Google Calendar: RFC 5545 shape, UTC instants,
 * stable UIDs and the escaping a phone needs to show Swedish text correctly.
 */

$now = new DateTimeImmutable('2026-07-01T07:00:00Z');

/** @return array<string,mixed> */
$booking = static function (array $overrides = []): array {
    return array_merge([
        'id' => 1,
        'uid' => '0123456789abcdef0123456789abcdef',
        'cleaning_type' => 'Hemstädning',
        'name' => 'Åsa Öberg',
        'email' => 'asa@example.se',
        'phone' => '070-123 45 67',
        'address' => 'Ängsvägen 3, 112 34 Stockholm',
        // 8 July 2026 10:00 Stockholm (CEST) = 08:00Z
        'date_time' => '2026-07-08 08:00:00',
        'ends_at' => '2026-07-08 11:00:00',
        'duration_hours' => '3.00',
        'total_price' => '2650.00',
        'description' => "Telefon: 070-123 45 67\nE-post: asa@example.se\nPris: 2650 kr",
        'sequence' => 0,
        'status' => 'confirmed',
        'created_at' => '2026-07-01 06:00:00',
        'updated_at' => '2026-07-01 06:00:00',
    ], $overrides);
};

$feed = Ics::build([$booking()], $now);
$lines = explode("\r\n", $feed);

Check::section('Ics: the calendar envelope');

Check::is('first line', $lines[0], 'BEGIN:VCALENDAR');
Check::contains('VERSION:2.0', $feed, "VERSION:2.0\r\n");
Check::contains('PRODID', $feed, 'PRODID:-//Aurel Stad & Allservice AB//Bokningar//SV');
Check::contains('CALSCALE', $feed, "CALSCALE:GREGORIAN\r\n");
Check::contains('METHOD', $feed, "METHOD:PUBLISH\r\n");
Check::true('ends with END:VCALENDAR', str_ends_with($feed, "END:VCALENDAR\r\n"));
Check::is('every line ends with CRLF, none with a bare LF', preg_match('/(?<!\r)\n/', $feed), 0);

Check::section('Ics: the time zone is declared');

Check::contains('X-WR-TIMEZONE names Europe/Stockholm', $feed, "X-WR-TIMEZONE:Europe/Stockholm\r\n");
Check::contains('a VTIMEZONE component is present', $feed, "BEGIN:VTIMEZONE\r\nTZID:Europe/Stockholm\r\n");
Check::contains('with the summer time rule', $feed, 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU');
Check::contains('and the standard time rule', $feed, 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU');
Check::contains('CEST is +0200', $feed, "TZOFFSETTO:+0200\r\n");
Check::contains('CET is +0100', $feed, "TZOFFSETTO:+0100\r\n");

Check::section('Ics: the event, with DTSTART/DTEND in UTC');

Check::contains('BEGIN:VEVENT', $feed, "BEGIN:VEVENT\r\n");
Check::contains('END:VEVENT', $feed, "END:VEVENT\r\n");
// 10:00 Stockholm in July is 08:00Z. A phone reading this shows 10:00.
Check::contains('DTSTART is the UTC instant', $feed, "DTSTART:20260708T080000Z\r\n");
Check::contains('DTEND is start plus the reserved hours', $feed, "DTEND:20260708T110000Z\r\n");
Check::contains('DTSTAMP is present', $feed, "DTSTAMP:20260701T070000Z\r\n");
Check::contains('CREATED', $feed, "CREATED:20260701T060000Z\r\n");
Check::contains('LAST-MODIFIED', $feed, "LAST-MODIFIED:20260701T060000Z\r\n");
Check::contains('STATUS', $feed, "STATUS:CONFIRMED\r\n");
Check::contains('TRANSP marks the slot as busy', $feed, "TRANSP:OPAQUE\r\n");

$winterFeed = Ics::build([$booking([
    'date_time' => '2026-01-14 09:00:00',   // 10:00 Stockholm, CET
    'ends_at' => '2026-01-14 12:00:00',
])], $now);
Check::contains('the same wall clock in winter is 09:00Z', $winterFeed, "DTSTART:20260114T090000Z\r\n");
Check::is(
    'and both really are 10:00 in Stockholm',
    Clock::toStockholmWallClock(new DateTimeImmutable('2026-01-14T09:00:00Z'))
        === Clock::toStockholmWallClock(new DateTimeImmutable('2026-07-08T08:00:00Z')),
    false
);
Check::is(
    'winter event shows 10:00 locally',
    substr(Clock::toStockholmWallClock(new DateTimeImmutable('2026-01-14T09:00:00Z')), -8),
    '10:00:00'
);
Check::is(
    'summer event shows 10:00 locally too',
    substr(Clock::toStockholmWallClock(new DateTimeImmutable('2026-07-08T08:00:00Z')), -8),
    '10:00:00'
);

Check::section('Ics: UID is stable, SEQUENCE marks the revision');

Check::contains('UID is the booking uid plus our domain', $feed, 'UID:0123456789abcdef0123456789abcdef@aurelservice.se');
Check::contains('a fresh booking is SEQUENCE:0', $feed, "SEQUENCE:0\r\n");

$edited = Ics::build([$booking(['sequence' => 3, 'date_time' => '2026-07-08 10:00:00'])], $now);
Check::contains('an edited booking carries the higher SEQUENCE', $edited, "SEQUENCE:3\r\n");
Check::contains(
    'and keeps the same UID, so the phone updates instead of duplicating',
    $edited,
    'UID:0123456789abcdef0123456789abcdef@aurelservice.se'
);
Check::contains('a cancelled booking says so', Ics::build([$booking(['status' => 'cancelled'])], $now), "STATUS:CANCELLED\r\n");

Check::section('Ics: text escaping (RFC 5545 §3.3.11)');

Check::is('backslash', Ics::escapeText('a\\b'), 'a\\\\b');
Check::is('semicolon', Ics::escapeText('a;b'), 'a\\;b');
Check::is('comma', Ics::escapeText('Ängsvägen 3, Stockholm'), 'Ängsvägen 3\\, Stockholm');
Check::is('newline becomes \\n', Ics::escapeText("rad 1\nrad 2"), 'rad 1\\nrad 2');
Check::is('CRLF becomes one \\n', Ics::escapeText("rad 1\r\nrad 2"), 'rad 1\\nrad 2');
Check::is('backslashes are escaped before the rest, not after', Ics::escapeText('a\\,b'), 'a\\\\\\,b');

Check::contains('the address comma is escaped in the feed', $feed, 'LOCATION:Ängsvägen 3\\, 112 34 Stockholm');
Check::contains('the description newlines are escaped', $feed, 'DESCRIPTION:Telefon: 070-123 45 67\\nE-post:');

// A value that tries to end the event early must not be able to.
$injected = Ics::build([$booking(['name' => "Åsa\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nSUMMARY:fake"])], $now);
Check::is('a value cannot forge a second VEVENT', substr_count($injected, "\r\nBEGIN:VEVENT\r\n"), 1);
Check::is('nor close the first one early', substr_count($injected, "\r\nEND:VEVENT\r\n"), 1);

Check::section('Ics: line folding (RFC 5545 §3.1)');

$long = Ics::fold('SUMMARY:' . str_repeat('a', 200));
$foldedLines = explode("\r\n", $long);
$tooLong = array_filter($foldedLines, static fn (string $l): bool => strlen($l) > 75);
Check::is('no folded line is over 75 octets', count($tooLong), 0);
Check::true('continuations start with a space', str_starts_with($foldedLines[1], ' '));
Check::is(
    'unfolding gives the original back',
    implode('', array_map(
        static fn (int $i, string $l): string => $i === 0 ? $l : substr($l, 1),
        array_keys($foldedLines),
        $foldedLines
    )),
    'SUMMARY:' . str_repeat('a', 200)
);
Check::is('a short line is left alone', Ics::fold('SUMMARY:Hemstädning'), 'SUMMARY:Hemstädning');

// Folding counts octets, but must never split a UTF-8 character in half: a
// broken sequence shows up as a replacement character on the phone.
$swedish = Ics::fold('SUMMARY:' . str_repeat('ä', 100));
$valid = true;
foreach (explode("\r\n", $swedish) as $line) {
    if (mb_check_encoding($line, 'UTF-8') === false) {
        $valid = false;
    }
}
Check::true('folding never splits a multi-byte character', $valid);
Check::is(
    'and the unfolded text is intact',
    mb_substr_count(str_replace("\r\n ", '', $swedish), 'ä'),
    100
);

Check::section('Ics: an empty calendar is still valid');

$empty = Ics::build([], $now);
Check::true('it begins correctly', str_starts_with($empty, "BEGIN:VCALENDAR\r\n"));
Check::true('it ends correctly', str_ends_with($empty, "END:VCALENDAR\r\n"));
Check::notContains('and holds no event', $empty, 'BEGIN:VEVENT');

Check::section('Slots: the 30 minute grid that makes a double booking impossible');

$start = Clock::stockholmToUtc('2026-07-08T10:00');
Check::same('a 2 hour booking claims four slots', Slots::forBooking($start, 2.0), [
    '2026-07-08 08:00:00',
    '2026-07-08 08:30:00',
    '2026-07-08 09:00:00',
    '2026-07-08 09:30:00',
]);
Check::same('a 30 minute booking claims one', Slots::forBooking($start, 0.5), ['2026-07-08 08:00:00']);
Check::is('a 12 hour booking claims 24', count(Slots::forBooking($start, 12.0)), 24);

// Overlap is what the UNIQUE index catches: two bookings that share a slot
// cannot both be inserted.
$second = Clock::stockholmToUtc('2026-07-08T11:00');
$overlap = array_intersect(Slots::forBooking($start, 2.0), Slots::forBooking($second, 2.0));
Check::is('10:00-12:00 and 11:00-13:00 share slots, so the second one is refused', count($overlap), 2);

$after = Clock::stockholmToUtc('2026-07-08T12:00');
Check::is(
    '10:00-12:00 and 12:00-14:00 touch without overlapping, so both fit',
    count(array_intersect(Slots::forBooking($start, 2.0), Slots::forBooking($after, 2.0))),
    0
);

// Off-grid starts round outwards: the team cannot be in two places.
$offGrid = Clock::stockholmToUtc('2026-07-08T10:05');
Check::same('10:05 for 2 h occupies 10:00 through 12:30', Slots::forBooking($offGrid, 2.0), [
    '2026-07-08 08:00:00',
    '2026-07-08 08:30:00',
    '2026-07-08 09:00:00',
    '2026-07-08 09:30:00',
    '2026-07-08 10:00:00',
]);

// Slots live in UTC, so summer time cannot shift or duplicate one.
$winterStart = Clock::stockholmToUtc('2026-01-14T10:00');
Check::same('the same wall clock in winter claims different UTC slots', Slots::forBooking($winterStart, 1.0), [
    '2026-01-14 09:00:00',
    '2026-01-14 09:30:00',
]);
Check::is(
    'a winter booking and a summer booking never collide by accident',
    count(array_intersect(Slots::forBooking($winterStart, 2.0), Slots::forBooking($start, 2.0))),
    0
);
Check::is(
    'and the slot count does not change with the season',
    count(Slots::forBooking($winterStart, 3.0)),
    count(Slots::forBooking($start, 3.0))
);
