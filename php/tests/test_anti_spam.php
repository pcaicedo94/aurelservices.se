<?php

declare(strict_types=1);

use Aurel\AntiSpam;
use Aurel\Config;
use Aurel\RateLimiter;
use Aurel\Tests\Check;

/**
 * Honeypot, fill time, per-IP limit and what a confirmation mail may repeat.
 * Port of the antiSpam sections of scripts/qa-units.mjs.
 */

$config = new Config();
$now = 1750000000000; // fixed "now" in milliseconds

Check::section('AntiSpam: honeypot (company_website)');

Check::is('the field name matches utils/formGuard.js', AntiSpam::HONEYPOT_FIELD, 'company_website');
Check::false('empty honeypot is a person', AntiSpam::isHoneypotFilled(['company_website' => '']));
Check::false('absent honeypot is a person', AntiSpam::isHoneypotFilled([]));
Check::false('whitespace only is a person', AntiSpam::isHoneypotFilled(['company_website' => '   ']));
Check::true('any content is a bot', AntiSpam::isHoneypotFilled(['company_website' => 'http://spam']));
Check::true('even a single character', AntiSpam::isHoneypotFilled(['company_website' => 'x']));

$screened = AntiSpam::screen(['company_website' => 'spam'], [], $config, $now);
Check::is('a filled honeypot is answered 200, so the bot learns nothing', $screened['status'] ?? 0, 200);
Check::is('and the reason is logged as honeypot', $screened['reason'] ?? '', 'honeypot');

Check::section('AntiSpam: fill time (formStartedAt, minimum 3 s)');

Check::is('MIN_FILL_MS matches utils/antiSpam.js', AntiSpam::MIN_FILL_MS, 3000);
Check::is('absent timestamp passes', AntiSpam::checkFillTime([], $now), 'ok');
Check::is('empty timestamp passes', AntiSpam::checkFillTime(['formStartedAt' => ''], $now), 'ok');
Check::is('instant submission is a bot', AntiSpam::checkFillTime(['formStartedAt' => $now], $now), 'too-fast');
Check::is('1 s is a bot', AntiSpam::checkFillTime(['formStartedAt' => $now - 1000], $now), 'too-fast');
Check::is('2.999 s is a bot', AntiSpam::checkFillTime(['formStartedAt' => $now - 2999], $now), 'too-fast');
Check::is('exactly 3 s passes', AntiSpam::checkFillTime(['formStartedAt' => $now - 3000], $now), 'ok');
Check::is('30 s passes', AntiSpam::checkFillTime(['formStartedAt' => $now - 30000], $now), 'ok');
Check::is('a numeric string works too', AntiSpam::checkFillTime(['formStartedAt' => (string) ($now - 5000)], $now), 'ok');
Check::is('text is invalid', AntiSpam::checkFillTime(['formStartedAt' => 'nyss'], $now), 'invalid');
Check::is('zero is invalid', AntiSpam::checkFillTime(['formStartedAt' => 0], $now), 'invalid');
Check::is('negative is invalid', AntiSpam::checkFillTime(['formStartedAt' => -1], $now), 'invalid');
// A visitor's clock running ahead gives a negative elapsed time; that says
// nothing about bots, so it passes.
Check::is('a clock ahead of the server passes', AntiSpam::checkFillTime(['formStartedAt' => $now + 60000], $now), 'ok');

$tooFast = AntiSpam::screen(['formStartedAt' => $now], [], $config, $now);
Check::is('too fast is answered 400', $tooFast['status'] ?? 0, 400);

Check::section('AntiSpam: a clean submission is let through');

Check::is('nothing to object to', AntiSpam::screen(['formStartedAt' => $now - 10000], [], $config, $now), null);
Check::false('Turnstile is dormant while its keys are unset', AntiSpam::turnstileEnabled($config));

Check::section('AntiSpam: which address the limit counts');

Check::is('REMOTE_ADDR is the default', AntiSpam::clientIp(['REMOTE_ADDR' => '203.0.113.9']), '203.0.113.9');
Check::is(
    'X-Forwarded-For from an untrusted peer is ignored — otherwise anyone could walk around the limit',
    AntiSpam::clientIp(['REMOTE_ADDR' => '203.0.113.9', 'HTTP_X_FORWARDED_FOR' => '1.2.3.4']),
    '203.0.113.9'
);
Check::is(
    'and honoured only from a configured proxy',
    AntiSpam::clientIp(['REMOTE_ADDR' => '10.0.0.1', 'HTTP_X_FORWARDED_FOR' => '1.2.3.4, 10.0.0.1'], ['10.0.0.1']),
    '1.2.3.4'
);
Check::is('no address at all', AntiSpam::clientIp([]), 'unknown');

Check::section('RateLimiter: 5 submissions per 10 minutes per IP');

Check::is('the limit matches utils/antiSpam.js', AntiSpam::RATE_LIMIT, 5);
Check::is('and so does the window', AntiSpam::RATE_WINDOW_SECONDS, 600);

// No database in this suite: exercise the file backend, which is the fallback
// the endpoints use when MySQL is unreachable.
$dir = sys_get_temp_dir() . '/aurel-tests-' . bin2hex(random_bytes(4));
@mkdir($dir, 0700, true);
$limiter = RateLimiter::create('test', null, $dir, 'pepper');

$allowed = 0;
for ($i = 0; $i < 5; $i++) {
    if ($limiter->hit('203.0.113.9', $now)['allowed']) {
        $allowed++;
    }
}
Check::is('the first five are allowed', $allowed, 5);

$sixth = $limiter->hit('203.0.113.9', $now);
Check::false('the sixth is refused', $sixth['allowed']);
Check::is('and Retry-After is the rest of the window', $sixth['retryAfterSeconds'], 600);

Check::true('a different address has its own budget', $limiter->hit('198.51.100.7', $now)['allowed']);
Check::true(
    'and the budget comes back once the window has passed',
    $limiter->hit('203.0.113.9', $now + 600001)['allowed']
);

$otherScope = RateLimiter::create('other', null, $dir, 'pepper');
Check::true('each endpoint counts separately', $otherScope->hit('203.0.113.9', $now)['allowed']);

// The stored file must not be a log of visitor addresses.
$files = glob($dir . '/ratelimit/*.json') ?: [];
$leaks = false;
foreach ($files as $file) {
    if (str_contains($file, '203.0.113.9') || str_contains((string) file_get_contents($file), '203.0.113.9')) {
        $leaks = true;
    }
}
Check::false('the address is hashed, never stored in clear', $leaks);

foreach ($files as $file) {
    @unlink($file);
}
@rmdir($dir . '/ratelimit');
@rmdir($dir);

Check::section('AntiSpam: what a confirmation may repeat');

Check::is('ordinary name kept', AntiSpam::greetingName('Åsa Öberg'), 'Åsa Öberg');
Check::is('link dropped', AntiSpam::greetingName('Köp på https://spam.example'), '');
Check::is('domain dropped', AntiSpam::greetingName('billigt.se'), '');
Check::is('e-mail address dropped', AntiSpam::greetingName('mail me@spam.example'), '');
Check::is('long text dropped', AntiSpam::greetingName(str_repeat('A', 41)), '');
Check::is('40 characters still fit', AntiSpam::greetingName(str_repeat('A', 40)), str_repeat('A', 40));
Check::is('empty stays empty', AntiSpam::greetingName(''), '');
