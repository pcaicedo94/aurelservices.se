<?php

declare(strict_types=1);

use Aurel\BookingRules;
use Aurel\Clock;
use Aurel\Tests\Check;

/**
 * The booking rules, ported from utils/bookingRules.js. Every value checked
 * here must stay identical to the JavaScript; if one of these fails, either
 * the port drifted or a rule was changed in only one of the two places.
 */

// A fixed "now" so the suite does not depend on the day it runs:
// Wednesday 1 July 2026, 09:00 Stockholm (07:00Z, summer time).
$now = new DateTimeImmutable('2026-07-01T07:00:00Z');

/** A booking body that passes every rule, for one-field-at-a-time tests. */
$valid = static function (array $overrides = []) use ($now): array {
    return array_merge([
        'cleaningType' => 'Hemstädning',
        'name' => 'Åsa Öberg',
        'email' => 'asa@example.se',
        'phone' => '070-123 45 67',
        'address' => 'Ängsvägen 3, Stockholm',
        'dateTime' => '2026-07-08T10:00',
        'estimatedHours' => 3,
        'totalPrice' => 2650,
    ], $overrides);
};

Check::section('BookingRules: the start window is 07:00 to 15:00 INCLUSIVE (Q16)');

$startAt = static function (string $wallClock) use ($now): array {
    return BookingRules::checkSchedule(Clock::stockholmToUtc($wallClock), $now);
};

Check::same('07:00 is bookable', $startAt('2026-07-08T07:00'), []);
Check::same('10:00 is bookable', $startAt('2026-07-08T10:00'), []);
Check::same('14:59 is bookable', $startAt('2026-07-08T14:59'), []);
Check::same('15:00 is bookable — the limit is inclusive', $startAt('2026-07-08T15:00'), []);
Check::same('15:01 is not', $startAt('2026-07-08T15:01'), ['start-time']);
Check::same('16:00 is not', $startAt('2026-07-08T16:00'), ['start-time']);
Check::same('06:59 is not', $startAt('2026-07-08T06:59'), ['start-time']);
Check::same('00:00 is not', $startAt('2026-07-08T00:00'), ['start-time']);

Check::section('BookingRules: the window holds across summer time');

// The same two wall clocks in January: different UTC instants, same verdict.
$winterNow = new DateTimeImmutable('2026-01-07T08:00:00Z');
Check::same(
    '15:00 in winter is bookable too',
    BookingRules::checkSchedule(Clock::stockholmToUtc('2026-01-14T15:00'), $winterNow),
    []
);
Check::same(
    '15:01 in winter is not',
    BookingRules::checkSchedule(Clock::stockholmToUtc('2026-01-14T15:01'), $winterNow),
    ['start-time']
);
// The naive reading of 15:00 as UTC would be 15:00Z; the correct one is 14:00Z
// in winter and 13:00Z in summer. If the window were ever checked on the UTC
// hour instead of the Stockholm one, one of these two would break.
Check::is('winter 15:00 is 14:00Z', Clock::stockholmToUtc('2026-01-14T15:00')?->format('H:i'), '14:00');
Check::is('summer 15:00 is 13:00Z', Clock::stockholmToUtc('2026-07-08T15:00')?->format('H:i'), '13:00');

Check::section('BookingRules: weekdays only (TODO cliente Q13)');

Check::same('Monday', $startAt('2026-07-06T10:00'), []);
Check::same('Friday', $startAt('2026-07-10T10:00'), []);
Check::same('Saturday', $startAt('2026-07-11T10:00'), ['weekday']);
Check::same('Sunday', $startAt('2026-07-12T10:00'), ['weekday']);
// A Friday night in UTC that is already Saturday in Stockholm.
Check::same('Friday 23:30 Stockholm is a Friday', $startAt('2026-07-10T23:30'), ['start-time']);

Check::section('BookingRules: notice, two days ahead at 07:00');

Check::is(
    'earliest bookable start from Wednesday 1 July 09:00 is Friday 3 July 07:00',
    Clock::toStockholmWallClock(BookingRules::earliestBookableStart($now)),
    '2026-07-03T07:00:00'
);
Check::same('the day after tomorrow at 07:00 is allowed', $startAt('2026-07-03T07:00'), []);
// 06:59 that day is both before the notice cut-off and before 07:00; the
// customer is shown the notice message, which is the more useful one.
Check::same('the day after tomorrow at 06:59 fails both ways', $startAt('2026-07-03T06:59'), ['too-soon', 'start-time']);
Check::same('tomorrow is too soon', $startAt('2026-07-02T10:00'), ['too-soon']);
Check::same('yesterday (a Tuesday) is simply in the past', $startAt('2026-06-30T10:00'), ['past']);
Check::same('and a past Saturday is both', $startAt('2026-06-27T10:00'), ['past', 'weekday']);

Check::section('BookingRules: price (only a positive number can be booked)');

Check::is('integer', BookingRules::parsePrice(2650), 2650.0);
Check::is('numeric string', BookingRules::parsePrice('2650'), 2650.0);
Check::is('decimal string', BookingRules::parsePrice('2650.50'), 2650.5);
Check::is('"Offereras" is not a price', BookingRules::parsePrice('Offereras'), null);
Check::is('zero', BookingRules::parsePrice(0), null);
Check::is('negative', BookingRules::parsePrice(-5), null);
Check::is('empty string', BookingRules::parsePrice(''), null);
Check::is('null', BookingRules::parsePrice(null), null);
Check::is('"2650 kr"', BookingRules::parsePrice('2650 kr'), null);
Check::is('"1e3" is not accepted', BookingRules::parsePrice('1e3'), null);

Check::section('BookingRules: the 2 hour billable minimum (TODO cliente Q14)');

Check::is('no estimate at all means 2 hours', BookingRules::bookingDurationHours(null), 2.0);
Check::is('1 hour is billed as 2', BookingRules::bookingDurationHours(1.0), 2.0);
Check::is('1.5 hours is billed as 2', BookingRules::bookingDurationHours(1.5), 2.0);
Check::is('exactly 2 stays 2', BookingRules::bookingDurationHours(2.0), 2.0);
Check::is('3.5 stays 3.5', BookingRules::bookingDurationHours(3.5), 3.5);
Check::is('20 is capped at 12', BookingRules::bookingDurationHours(20.0), 12.0);
Check::is('unreadable means 2', BookingRules::bookingDurationHours(NAN), 2.0);
Check::true('1 hour: the minimum is noted', BookingRules::minimumHoursApplied(1.0));
Check::false('2 hours: nothing to note', BookingRules::minimumHoursApplied(2.0));
Check::false('no estimate: nothing to note', BookingRules::minimumHoursApplied(null));

// A short estimate is accepted, never rejected.
$short = BookingRules::validateBooking($valid(['estimatedHours' => 1]), $now);
Check::same('a 1 hour booking is accepted', $short['errors'], []);
Check::is('and reserved as 2 hours', $short['data']['durationHours'], 2.0);

Check::section('BookingRules: hours that cannot be read');

Check::is('absent', BookingRules::parseHours([]), null);
Check::is('empty string is absent', BookingRules::parseHours(['hours' => '']), null);
Check::is('numeric string', BookingRules::parseHours(['hours' => '3.5']), 3.5);
Check::true('text is NaN', is_nan(BookingRules::parseHours(['hours' => 'tre']) ?? 0.0));
Check::same('and NaN is an error', BookingRules::checkHours(NAN), ['hours']);
Check::same('absent is not an error', BookingRules::checkHours(null), []);

Check::section('BookingRules: maximum online area (lib/booking/rules.js MAX_ONLINE_AREA)');

Check::is('MAX_ONLINE_AREA is 1000', BookingRules::MAX_ONLINE_AREA, 1000);
Check::same('no area is fine', BookingRules::checkArea(null), []);
Check::same('80 m² is fine', BookingRules::checkArea(80.0), []);
Check::same('1000 m² is the limit, inclusive', BookingRules::checkArea(1000.0), []);
Check::same('1001 m² goes to a quote', BookingRules::checkArea(1001.0), ['area-too-large']);
Check::same('0 m² is not a size', BookingRules::checkArea(0.0), ['area']);
Check::same('unreadable area', BookingRules::checkArea(NAN), ['area']);
Check::is('Swedish decimal comma', BookingRules::parseArea(['area' => '82,5']), 82.5);

$tooLarge = BookingRules::validateBooking($valid(['area' => 5000]), $now);
Check::same('a 5000 m² booking is refused by the server too', $tooLarge['errors'], ['area-too-large']);
Check::contains(
    'and the customer is pointed at a quote',
    BookingRules::bookingErrorMessage($tooLarge['errors'], $now),
    'Begär gärna en offert'
);

Check::section('BookingRules: validateBooking, required fields');

Check::same('a complete booking has no errors', BookingRules::validateBooking($valid(), $now)['errors'], []);
Check::same('missing name', BookingRules::validateBooking($valid(['name' => '']), $now)['errors'], ['name']);
Check::same('missing address', BookingRules::validateBooking($valid(['address' => '  ']), $now)['errors'], ['address']);
Check::same('bad email', BookingRules::validateBooking($valid(['email' => 'asa@example']), $now)['errors'], ['email']);
Check::same('no email', BookingRules::validateBooking($valid(['email' => '']), $now)['errors'], ['email']);
Check::same('no date', BookingRules::validateBooking($valid(['dateTime' => '']), $now)['errors'], ['dateTime']);
Check::same('no price', BookingRules::validateBooking($valid(['totalPrice' => 'Offereras']), $now)['errors'], ['price']);

Check::is(
    'fields are trimmed, line-stripped and capped at 300 characters',
    mb_strlen(BookingRules::validateBooking($valid(['name' => str_repeat('a', 500)]), $now)['data']['name']),
    300
);
Check::notContains(
    'a newline in a field never survives',
    BookingRules::validateBooking($valid(['name' => "Åsa\r\nBcc: spam@example.com"]), $now)['data']['name'],
    "\n"
);

Check::section('BookingRules: the customer-facing message, worst problem first');

Check::is(
    'a missing field beats everything',
    BookingRules::bookingErrorMessage(['name', 'weekday', 'price'], $now),
    'Vänligen fyll i alla uppgifter korrekt.'
);
Check::is(
    'past',
    BookingRules::bookingErrorMessage(['past'], $now),
    'Den valda tiden har redan passerat. Vänligen välj en annan tid.'
);
Check::contains('too soon names the earliest time', BookingRules::bookingErrorMessage(['too-soon'], $now), '3 juli 2026 kl. 07:00');
Check::is(
    'weekday',
    BookingRules::bookingErrorMessage(['weekday'], $now),
    'Vi tar emot bokningar måndag till fredag. Vänligen välj en vardag.'
);
Check::is(
    'start time',
    BookingRules::bookingErrorMessage(['start-time'], $now),
    'Vänligen välj en starttid mellan 07:00 och 15:00.'
);
Check::contains('price asks for a quote', BookingRules::bookingErrorMessage(['price'], $now), 'Begär gärna en offert');
Check::contains('every message carries the phone number', BookingRules::bookingErrorMessage(['price'], $now), '076-045 02 28');

Check::section('BookingRules: the detail rows the office sees (QA-06)');

$details = BookingRules::collectDetails([
    'cleaningType' => 'Hemstädning',
    'name' => 'Åsa',
    'contactPreference' => 'call',
    'area' => 82,
    'rooms' => 3,
    'estimatedHours' => 1,
    'extras' => ['Ugn', 'Kyl'],
    'basePrice' => 1200,
    'company_website' => 'spam',
    'formStartedAt' => 1750000000000,
    'nyttFalt' => 'okänt värde',
]);
Check::same('known fields keep their Swedish label and order, plus the minimum note', $details, [
    ['Kontaktmetod', 'Bli uppringd'],
    ['Yta', '82 m²'],
    ['Rum', '3'],
    ['Beräknad tid', '1 timmar'],
    ['Debitering', 'Debiteras minst 2 timmar'],
    ['Tillval', 'Ugn, Kyl'],
    ['Grundpris', '1200 kr'],
    ['nyttFalt', 'okänt värde'],
]);

$record = BookingRules::detailsRecord(['area' => 82, 'extras' => ['Ugn'], 'company_website' => '', 'estimatedHours' => 1]);
Check::is('the JSON record keeps numbers as numbers', $record['area'], 82);
Check::is('and records what was actually reserved', $record['bookedHours'], 2.0);
Check::false('anti-spam plumbing is never stored', array_key_exists('company_website', $record));

Check::section('BookingRules: the .ics description is plain text');

$description = BookingRules::describe(
    ['phone' => '070-1 & 2', 'email' => 'a@b.se', 'totalPrice' => 2650.0],
    [['Tillval', 'Ugn & Kyl']]
);
Check::contains('an ampersand stays an ampersand, not &amp;', $description, 'Ugn & Kyl');
Check::notContains('nothing is HTML-escaped here', $description, '&amp;');
Check::contains('the price has no trailing .0', $description, 'Pris: 2650 kr');
