<?php

declare(strict_types=1);

/**
 * POST /api/booking  (rewritten to this file by public/.htaccess)
 *
 * The PHP replacement for pages/api/booking.js. Same contract with the
 * browser, so lib/booking/useBookingSubmit.js does not change a line:
 *   200 { message }  booking taken (and what a filled honeypot gets)
 *   400 { message }  rule violation or anti-spam rejection, Swedish message
 *   409 { message }  the slot is taken — never a 500
 *   429 { message }  per-IP limit, with Retry-After
 *   500 { message }  anything else; the real reason is only in the server log
 *
 * What changed, and why:
 *   - no Google Calendar. The client's token belonged to a personal account
 *     and the team has no shared calendar, so the booking lives in MySQL and
 *     the team subscribes to /api/calendar.ics from their phones.
 *   - no compensating "insert then look again" dance (utils/reserveSlot.js):
 *     the UNIQUE index on booking_slots.slot_start makes a double booking
 *     impossible at the database level, which is a guarantee the Google API
 *     could not give.
 *   - the database write happens BEFORE the mail, not after. In the JS a
 *     failed insert was only logged, which is how bookings kept succeeding
 *     while losing their record.
 *
 * The rules themselves are unchanged: Aurel\BookingRules is a one-to-one port
 * of utils/bookingRules.js, which stays the source of truth.
 */

use Aurel\AntiSpam;
use Aurel\BookingRules;
use Aurel\BookingStore;
use Aurel\Clock;
use Aurel\Db;
use Aurel\Http;
use Aurel\Mailer;
use Aurel\Messages;
use Aurel\RateLimiter;
use Aurel\SlotTakenException;

/** @var \Aurel\Config $config */
$config = require __DIR__ . '/_boot.php';

const SLOT_TAKEN_MESSAGE = 'Tyvärr är den valda tiden inte tillgänglig. Vänligen välj en annan tid.';
const SUCCESS_MESSAGE = 'Bokning skapad! Vi skickar en bekräftelse till din e-post.';
const SERVER_ERROR_MESSAGE = 'Något gick fel när bokningen skulle skapas. Vänligen försök igen eller ring oss '
    . 'på 076-045 02 28.';

if (!Http::isPost()) {
    Http::json(405, ['message' => 'Method not allowed'], ['Allow' => 'POST']);

    return;
}

$body = Http::jsonBody();
if ($body === null) {
    error_log('Booking rejected: unreadable or oversized body');
    Http::json(400, ['message' => AntiSpam::GENERIC_REJECTION_MESSAGE]);

    return;
}

$now = Clock::now();

// 1. Honeypot, fill time and, when configured, Turnstile.
$screening = AntiSpam::screen($body, $_SERVER, $config, Clock::nowMs());
if ($screening !== null) {
    error_log('Booking rejected as spam: ' . $screening['reason']);
    // A filled honeypot gets the normal answer, so the bot learns nothing.
    Http::json(
        $screening['status'],
        ['message' => $screening['status'] === 200 ? SUCCESS_MESSAGE : AntiSpam::GENERIC_REJECTION_MESSAGE]
    );

    return;
}

// 2. Required fields, a real price, weekday, start window, notice, minimum
//    hours and the maximum online area: see Aurel\BookingRules.
$validation = BookingRules::validateBooking($body, $now);
if ($validation['errors'] !== []) {
    error_log('Booking validation failed: ' . implode(', ', $validation['errors']));
    Http::json(400, ['message' => BookingRules::bookingErrorMessage($validation['errors'], $now)]);

    return;
}
$data = $validation['data'];

// 3. Only well-formed bookings count against the limit: they are the ones that
//    reach the database and send mail.
$pdo = Db::connectOptional($config);
$limiter = RateLimiter::create('booking', $pdo, $config->get('storage_dir'), $config->get('rate_limit_pepper'));
$limit = $limiter->hit(AntiSpam::clientIp($_SERVER, $config->trustedProxies()));
if (!$limit['allowed']) {
    error_log('Booking rate limited');
    Http::json(429, ['message' => AntiSpam::RATE_LIMIT_MESSAGE], ['Retry-After' => (string) $limit['retryAfterSeconds']]);

    return;
}

$details = BookingRules::collectDetails($body);
$when = Clock::formatStockholm($data['startsAt']);

try {
    if ($pdo === null) {
        // Without the database there is no way to guarantee the slot, and a
        // double booking costs the client a wasted trip. Refuse rather than
        // guess.
        throw new RuntimeException('MySQL is unavailable; refusing to take a booking that cannot be reserved');
    }

    $store = new BookingStore($pdo);

    // 4. Reserve: one transaction that writes the booking and claims every 30
    //    minute slot it covers. The UNIQUE index decides the race.
    try {
        $saved = $store->insert($data, BookingRules::detailsRecord($body), BookingRules::describe($data, $details));
    } catch (SlotTakenException $e) {
        // A retry of the very same booking (same start, same customer) is not
        // a conflict: the first attempt went through and only the answer was
        // lost. Telling them "that time is not available" about their own
        // booking would be nonsense.
        $own = $store->findOwnDuplicate($data['startsAt'], (string) $data['email']);
        if ($own !== null) {
            error_log('Booking retry matched booking ' . $own['id'] . '; answering success');
            Http::json(200, ['message' => SUCCESS_MESSAGE]);

            return;
        }
        error_log('Booking slot taken: ' . Clock::toSqlUtc($data['startsAt']));
        Http::json(409, ['message' => SLOT_TAKEN_MESSAGE]);

        return;
    }

    // 5. Mail. The office notice goes first: it is the one that must not be
    //    lost, and the booking is already safe in the database and in the .ics
    //    feed whatever happens next.
    $mailer = new Mailer($config);
    $failures = [];

    $adminSent = false;
    try {
        $mailer->send([
            'to' => $config->get('admin_email'),
            'replyTo' => (string) $data['email'],
            'subject' => 'Ny bokning - ' . $data['cleaningType'] . ' - ' . $data['name'],
            'html' => Messages::bookingAdmin($data, $details, $when),
        ]);
        $adminSent = true;
    } catch (Throwable $e) {
        $failures[] = 'admin: ' . $e->getMessage();
    }

    $customerSent = false;
    try {
        $mailer->send([
            'to' => (string) $data['email'],
            'subject' => 'Bokningsbekräftelse - ' . $data['cleaningType'],
            'html' => Messages::bookingCustomer($data, $when),
        ]);
        $customerSent = true;
    } catch (Throwable $e) {
        $failures[] = 'customer: ' . $e->getMessage();
    }

    if ($failures !== []) {
        error_log('Booking ' . $saved['id'] . ' mail failure — ' . implode(' | ', $failures));
    }
    $store->recordNotification($saved['id'], $adminSent, $customerSent, implode(' | ', $failures));

    // The office knowing about the booking is what makes it real. If that mail
    // failed the customer is told to call, even though the row is saved; the
    // other way round (only the confirmation failed) is not worth alarming
    // them over, and the office can see it in `mail_error`.
    if (!$adminSent) {
        Http::json(500, ['message' => SERVER_ERROR_MESSAGE]);

        return;
    }

    Http::json(200, ['message' => SUCCESS_MESSAGE]);
} catch (Throwable $e) {
    // Full detail stays in the server log; the client only gets a safe message.
    error_log('Booking error: ' . $e->getMessage());
    error_log('Booking error trace: ' . $e->getTraceAsString());
    Http::json(500, ['message' => SERVER_ERROR_MESSAGE]);
}
