<?php

declare(strict_types=1);

/**
 * GET /api/calendar.ics?token=...   (rewritten to this file by public/.htaccess)
 *
 * The .ics feed that replaces Google Calendar: the team subscribes once from
 * their phone and every new booking appears there. php/README.md has the
 * subscription steps for iPhone and Android.
 *
 * PROTECTION. This feed carries customer names, addresses, phone numbers and
 * email addresses, and a calendar subscription cannot send a password or a
 * cookie — the only credential a phone will carry is the URL itself. So:
 *   - a secret token in the query string is required (`calendar_token`, a long
 *     random string kept in the config file outside the web root);
 *   - the comparison is hash_equals(), not ==, so the answer time says nothing
 *     about how much of the token was right;
 *   - a missing or wrong token gets 404, not 403: an attacker scanning the
 *     site cannot tell the endpoint exists at all;
 *   - the answer is noindex, no-store and private, so neither a search engine
 *     nor a shared proxy keeps a copy.
 * Rotating the token (change it in the config, re-subscribe) revokes every
 * device at once.
 */

use Aurel\BookingStore;
use Aurel\Clock;
use Aurel\Db;
use Aurel\Http;
use Aurel\Ics;

/** @var \Aurel\Config $config */
$config = require __DIR__ . '/_boot.php';

if (!Http::isGet()) {
    Http::notFound();

    return;
}

$expected = $config->get('calendar_token');
$provided = is_string($_GET['token'] ?? null) ? (string) $_GET['token'] : '';

// An unconfigured token must never mean "no token required".
if ($expected === '' || $provided === '' || !hash_equals($expected, $provided)) {
    if ($expected === '') {
        error_log('Calendar feed requested but calendar_token is not configured');
    }
    Http::notFound();

    return;
}

try {
    $pdo = Db::connect($config);
    $bookings = (new BookingStore($pdo))->upcoming(Clock::now());
    $body = Ics::build($bookings, Clock::now());
} catch (Throwable $e) {
    error_log('Calendar feed error: ' . $e->getMessage());
    if (!headers_sent()) {
        http_response_code(503);
        header('Content-Type: text/plain; charset=utf-8');
        header('Retry-After: 300');
    }
    echo "Calendar temporarily unavailable\n";

    return;
}

if (!headers_sent()) {
    http_response_code(200);
    header('Content-Type: text/calendar; charset=utf-8; method=PUBLISH');
    header('Content-Disposition: inline; filename="aurel-bokningar.ics"');
    header('Content-Length: ' . strlen($body));
    header('X-Content-Type-Options: nosniff');
    header('X-Robots-Tag: noindex, nofollow, noarchive');
    header('Cache-Control: private, no-store, max-age=0');
    header('Referrer-Policy: no-referrer');
}

if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) === 'HEAD') {
    return;
}

echo $body;
