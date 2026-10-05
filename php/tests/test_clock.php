<?php

declare(strict_types=1);

use Aurel\Clock;
use Aurel\Tests\Check;

/**
 * Europe/Stockholm, summer time included.
 *
 * This is the bug utils/timeZone.js was written for: a server reading
 * "2026-09-01T10:00" as its own local time checks availability for a different
 * window than the one it books, and two customers end up on the same slot. The
 * PHP side has a real tz database, but the guarantee still has to be pinned.
 */

Check::section('Clock: Stockholm wall clock -> UTC (winter, CET +01:00)');

$winter = Clock::stockholmToUtc('2026-01-15T10:00');
Check::is('10:00 in January is 09:00Z', $winter?->format('Y-m-d\TH:i:s\Z'), '2026-01-15T09:00:00Z');
Check::is('offset is +01:00', $winter?->setTimezone(Clock::stockholm())->format('P'), '+01:00');
Check::is('07:00 in January is 06:00Z', Clock::stockholmToUtc('2026-01-15T07:00')?->format('H:i'), '06:00');
Check::is('15:00 in January is 14:00Z', Clock::stockholmToUtc('2026-01-15T15:00')?->format('H:i'), '14:00');

Check::section('Clock: Stockholm wall clock -> UTC (summer, CEST +02:00)');

$summer = Clock::stockholmToUtc('2026-07-15T10:00');
Check::is('10:00 in July is 08:00Z', $summer?->format('Y-m-d\TH:i:s\Z'), '2026-07-15T08:00:00Z');
Check::is('offset is +02:00', $summer?->setTimezone(Clock::stockholm())->format('P'), '+02:00');
Check::is('07:00 in July is 05:00Z', Clock::stockholmToUtc('2026-07-15T07:00')?->format('H:i'), '05:00');
Check::is('15:00 in July is 13:00Z', Clock::stockholmToUtc('2026-07-15T15:00')?->format('H:i'), '13:00');

// The same wall clock one hour apart in UTC is exactly the double booking the
// JS fix was about: if the server ignored the zone, both would be 10:00Z.
Check::is(
    'the same wall clock is a different instant in winter and summer',
    ($winter?->getTimestamp() ?? 0) % 86400 === ($summer?->getTimestamp() ?? 0) % 86400,
    false
);

Check::section('Clock: around the DST switches');

// 2026: summer time starts Sunday 29 March, ends Sunday 25 October.
Check::is('Friday 27 March 10:00 is still CET', Clock::stockholmToUtc('2026-03-27T10:00')?->format('H:i'), '09:00');
Check::is('Monday 30 March 10:00 is CEST', Clock::stockholmToUtc('2026-03-30T10:00')?->format('H:i'), '08:00');
Check::is('Friday 23 October 10:00 is still CEST', Clock::stockholmToUtc('2026-10-23T10:00')?->format('H:i'), '08:00');
Check::is('Monday 26 October 10:00 is CET', Clock::stockholmToUtc('2026-10-26T10:00')?->format('H:i'), '09:00');

// A booking that spans the autumn switch lasts one real hour more than the
// wall clock suggests. Both switches fall on a Sunday, which is not bookable
// (BOOKABLE_WEEKDAYS), so this can never happen through the form — pinned so
// that a future weekend rule does not break it silently.
$beforeSwitch = Clock::stockholmToUtc('2026-10-25T02:00');
Check::is('02:00 on the switch day resolves to a real instant', $beforeSwitch !== null, true);

Check::section('Clock: round trip and parts');

Check::is('wall clock round trip, winter', Clock::toStockholmWallClock($winter), '2026-01-15T10:00:00');
Check::is('wall clock round trip, summer', Clock::toStockholmWallClock($summer), '2026-07-15T10:00:00');

$parts = Clock::stockholmParts($summer);
Check::is('parts: year', $parts['year'], 2026);
Check::is('parts: month', $parts['month'], 7);
Check::is('parts: day', $parts['day'], 15);
Check::is('parts: hour is the Stockholm hour, not the UTC one', $parts['hour'], 10);
Check::is('parts: minute', $parts['minute'], 0);
// 15 July 2026 is a Wednesday.
Check::is('parts: weekday follows Date#getUTCDay (0 = Sunday)', $parts['weekday'], 3);

// Just before midnight UTC is already the next day in Stockholm: the weekday
// rule must use the Stockholm date.
$lateEvening = new DateTimeImmutable('2026-07-17T23:30:00Z');
Check::is('23:30Z on a Friday is Saturday in Stockholm', Clock::stockholmParts($lateEvening)['weekday'], 6);

Check::section('Clock: rejecting what is not a date');

Check::is('empty string', Clock::stockholmToUtc(''), null);
Check::is('null', Clock::stockholmToUtc(null), null);
Check::is('no time', Clock::stockholmToUtc('2026-07-15'), null);
Check::is('31 February', Clock::stockholmToUtc('2026-02-31T10:00'), null);
Check::is('hour 25', Clock::stockholmToUtc('2026-07-15T25:00'), null);
Check::is('minute 61', Clock::stockholmToUtc('2026-07-15T10:61'), null);
Check::is('text', Clock::stockholmToUtc('imorgon kl 10'), null);
Check::is('space instead of T is accepted', Clock::stockholmToUtc('2026-07-15 10:00')?->format('H:i'), '08:00');
Check::is('seconds are accepted', Clock::stockholmToUtc('2026-07-15T10:00:30')?->format('H:i:s'), '08:00:30');

Check::section('Clock: Swedish formatting (matches Intl sv-SE long/short)');

// Pinned against what Node prints today:
//   new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm",
//     dateStyle: "long", timeStyle: "short" }).format(date)
Check::is(
    'winter instant',
    Clock::formatStockholm(new DateTimeImmutable('2026-01-15T09:00:00Z')),
    '15 januari 2026 kl. 10:00'
);
Check::is(
    'summer instant',
    Clock::formatStockholm(new DateTimeImmutable('2026-07-15T08:00:00Z')),
    '15 juli 2026 kl. 10:00'
);
Check::is(
    'no leading zero on the day',
    Clock::formatStockholm(new DateTimeImmutable('2026-12-01T14:00:00Z')),
    '1 december 2026 kl. 15:00'
);
Check::is(
    'march, across the switch',
    Clock::formatStockholm(new DateTimeImmutable('2026-03-29T01:30:00Z')),
    '29 mars 2026 kl. 03:30'
);

Check::section('Clock: SQL and iCalendar shapes');

Check::is('SQL value is UTC', Clock::toSqlUtc($summer), '2026-07-15 08:00:00');
Check::is('iCalendar value is UTC with Z', Clock::toIcsUtc($summer), '20260715T080000Z');
Check::is('SQL round trip', Clock::fromSqlUtc('2026-07-15 08:00:00')?->getTimestamp(), $summer->getTimestamp());
