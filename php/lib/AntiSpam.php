<?php

declare(strict_types=1);

namespace Aurel;

/**
 * Anti-spam checks shared by /api/booking.php and /api/contact.php.
 * Port of utils/antiSpam.js, which stays the source of truth.
 *
 * Contract with the forms (utils/formGuard.js, unchanged — the browser code is
 * not touched by this port):
 *   company_website  honeypot. Any content means a bot: answer 200 as if all
 *                    went well, and send or store nothing.
 *   formStartedAt    browser Date.now() when the form was shown. Submitting
 *                    less than 3 s later gets a generic 400. Forms that do not
 *                    send it yet are let through.
 * Plus a per-IP limit (RateLimiter, counters in MySQL) and, only when both of
 * its keys are configured, Cloudflare Turnstile.
 */
final class AntiSpam
{
    public const HONEYPOT_FIELD = 'company_website';
    public const STARTED_AT_FIELD = 'formStartedAt';
    public const TURNSTILE_FIELD = 'cf-turnstile-response';

    /** Form plumbing: never shown to the office or stored with a booking. */
    public const FIELDS = [self::HONEYPOT_FIELD, self::STARTED_AT_FIELD, self::TURNSTILE_FIELD];

    public const MIN_FILL_MS = 3000;
    public const RATE_LIMIT = 5;
    public const RATE_WINDOW_SECONDS = 600;

    public const GENERIC_REJECTION_MESSAGE = 'Vänligen kontrollera uppgifterna och försök igen.';
    public const RATE_LIMIT_MESSAGE = 'Du har skickat för många förfrågningar. Vänta en stund och försök igen, '
        . 'eller ring oss på 076-045 02 28.';

    /** @param array<string,mixed> $body */
    public static function isHoneypotFilled(array $body): bool
    {
        $value = $body[self::HONEYPOT_FIELD] ?? null;
        if ($value === null) {
            return false;
        }

        return trim(Escape::toText($value)) !== '';
    }

    /**
     * "ok", "too-fast" or "invalid". A missing timestamp is "ok" so that forms
     * not sending one yet keep working; a present but unusable one is
     * "invalid".
     *
     * @param array<string,mixed> $body
     */
    public static function checkFillTime(array $body, int $nowMs): string
    {
        $raw = $body[self::STARTED_AT_FIELD] ?? null;
        if ($raw === null || (is_string($raw) && $raw === '')) {
            return 'ok';
        }

        if (is_int($raw) || is_float($raw)) {
            $startedAt = (float) $raw;
        } else {
            $text = trim(Escape::toText($raw));
            $startedAt = is_numeric($text) ? (float) $text : NAN;
        }
        if (is_nan($startedAt) || !is_finite($startedAt) || $startedAt <= 0) {
            return 'invalid';
        }

        // The timestamp comes from the visitor's clock. A clock ahead of the
        // server gives a negative value, which says nothing about bots, so it
        // passes.
        $elapsed = $nowMs - $startedAt;

        return $elapsed >= 0 && $elapsed < self::MIN_FILL_MS ? 'too-fast' : 'ok';
    }

    /**
     * The client address. Apache fills REMOTE_ADDR itself and it cannot be
     * forged by the client, so it is the only source trusted by default.
     * X-Forwarded-For is read only when the config names the proxies that are
     * allowed to set it, because otherwise any visitor could hand us any
     * address and walk around the per-IP limit.
     *
     * @param array<string,mixed> $server
     * @param list<string> $trustedProxies
     */
    public static function clientIp(array $server, array $trustedProxies = []): string
    {
        $remote = trim(Escape::toText($server['REMOTE_ADDR'] ?? ''));

        if ($trustedProxies !== [] && in_array($remote, $trustedProxies, true)) {
            $forwarded = trim(explode(',', Escape::toText($server['HTTP_X_FORWARDED_FOR'] ?? ''))[0]);
            if ($forwarded !== '') {
                return $forwarded;
            }
        }

        return $remote !== '' ? $remote : 'unknown';
    }

    /** Optional: enforced only when both keys are configured (neither is today). */
    public static function turnstileEnabled(Config $config): bool
    {
        return $config->get('turnstile_secret_key') !== '' && $config->get('turnstile_site_key') !== '';
    }

    /**
     * Cloudflare's siteverify. Returns false on any doubt, including a network
     * failure, which is the safe direction for a check that is only ever
     * enabled on purpose.
     */
    public static function verifyTurnstile(?string $token, string $ip, string $secret): bool
    {
        if ($token === null || $token === '' || $secret === '') {
            return false;
        }
        $payload = http_build_query(['secret' => $secret, 'response' => $token, 'remoteip' => $ip]);
        $context = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $payload,
            'timeout' => 5,
            'ignore_errors' => true,
        ]]);
        $raw = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, $context);
        if ($raw === false) {
            error_log('Turnstile verification failed: request error');

            return false;
        }
        $result = json_decode($raw, true);

        return is_array($result) && ($result['success'] ?? false) === true;
    }

    /**
     * The checks that run before validation. Returns null when the request may
     * continue, or ['status' => int, 'reason' => string] to answer with: 200
     * for the honeypot (the caller replies with its normal success message),
     * 400 otherwise.
     *
     * @param array<string,mixed> $body
     * @param array<string,mixed> $server
     * @return array{status:int,reason:string}|null
     */
    public static function screen(array $body, array $server, Config $config, int $nowMs): ?array
    {
        if (self::isHoneypotFilled($body)) {
            return ['status' => 200, 'reason' => 'honeypot'];
        }

        $fill = self::checkFillTime($body, $nowMs);
        if ($fill !== 'ok') {
            return ['status' => 400, 'reason' => $fill];
        }

        if (self::turnstileEnabled($config)) {
            $token = $body[self::TURNSTILE_FIELD] ?? null;
            $verified = self::verifyTurnstile(
                $token === null ? null : Escape::toText($token),
                self::clientIp($server, $config->trustedProxies()),
                $config->get('turnstile_secret_key')
            );
            if (!$verified) {
                return ['status' => 400, 'reason' => 'turnstile'];
            }
        }

        return null;
    }

    private const MAX_GREETING_NAME = 40;

    /**
     * A confirmation goes to whatever address was typed in, so it must not
     * carry a stranger's text. The name is the one thing it still repeats, and
     * only when it is short and looks nothing like a link or an address.
     *
     * @param mixed $name
     */
    public static function greetingName($name): string
    {
        $value = trim(Escape::toText($name));
        if ($value === '' || mb_strlen($value, 'UTF-8') > self::MAX_GREETING_NAME) {
            return '';
        }
        if (preg_match('#https?:|www\.|://|@|\.(com|se|nu|net|org|info|io|biz|ru|xyz)\b#i', $value)) {
            return '';
        }

        return $value;
    }
}
