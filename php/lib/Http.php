<?php

declare(strict_types=1);

namespace Aurel;

/**
 * Request reading and JSON answers.
 *
 * The browser code is not touched by this port: components/Contact/ContactForm
 * posts with axios, QuoteModal and lib/booking/useBookingSubmit with fetch, all
 * three with Content-Type: application/json and a JSON body, and all three read
 * `message` out of the answer. So that is exactly what these endpoints speak.
 *
 * The one rule that matters for safety: the client never sees an internal
 * detail. Every failure answers with one of the Swedish messages the JS used,
 * and the real reason goes to error_log().
 */
final class Http
{
    /** 256 KB is far more than any of our forms needs. */
    public const MAX_BODY_BYTES = 262144;

    /**
     * The decoded request body, or null when it is unreadable or too big.
     *
     * @return array<string,mixed>|null
     */
    public static function jsonBody(): ?array
    {
        $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
        if ($length > self::MAX_BODY_BYTES) {
            return null;
        }

        $raw = file_get_contents('php://input', false, null, 0, self::MAX_BODY_BYTES + 1);
        if ($raw === false || strlen($raw) > self::MAX_BODY_BYTES) {
            return null;
        }
        if (trim($raw) === '') {
            // A form posted the old-fashioned way still works.
            return is_array($_POST) ? $_POST : [];
        }

        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        return is_array($_POST) && $_POST !== [] ? $_POST : [];
    }

    /** @param array<string,mixed> $payload */
    public static function json(int $status, array $payload, array $headers = []): void
    {
        if (!headers_sent()) {
            http_response_code($status);
            header('Content-Type: application/json; charset=utf-8');
            header('X-Content-Type-Options: nosniff');
            header('Cache-Control: no-store');
            foreach ($headers as $name => $value) {
                header($name . ': ' . $value);
            }
        }
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public static function notFound(): void
    {
        if (!headers_sent()) {
            http_response_code(404);
            header('Content-Type: text/plain; charset=utf-8');
            header('X-Content-Type-Options: nosniff');
            header('Cache-Control: no-store');
        }
        echo "404 Not Found\n";
    }

    public static function isPost(): bool
    {
        return strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) === 'POST';
    }

    public static function isGet(): bool
    {
        $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? ''));

        return $method === 'GET' || $method === 'HEAD';
    }
}
