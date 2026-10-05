<?php

declare(strict_types=1);

/**
 * POST /api/contact  (rewritten to this file by public/.htaccess)
 *
 * The PHP replacement for pages/api/contact.js. Mails the office and sends the
 * sender a confirmation; same validation, same two mails, same Swedish
 * messages, so components/Contact/ContactForm.js and
 * components/Common/QuoteModal.js do not change.
 *
 * No database is needed here, and a MySQL outage must not take the contact
 * form down with it: the rate limiter falls back to files when the connection
 * is not there (see Aurel\RateLimiter).
 */

use Aurel\AntiSpam;
use Aurel\Clock;
use Aurel\Db;
use Aurel\Escape;
use Aurel\Http;
use Aurel\Mailer;
use Aurel\Messages;
use Aurel\RateLimiter;

/** @var \Aurel\Config $config */
$config = require __DIR__ . '/_boot.php';

const MAX_FIELD_LENGTH = 300;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_DETAIL_ROWS = 15;
const EMAIL_PATTERN = '/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/';
const SUCCESS_MESSAGE = 'Tack! Vi återkommer så snart som möjligt.';
const INVALID_MESSAGE = 'Vänligen fyll i alla uppgifter korrekt.';
const SERVER_ERROR_MESSAGE = 'Meddelandet kunde inte skickas. Vänligen försök igen eller ring oss '
    . 'på 076-045 02 28.';

/** @param mixed $value */
function contact_clean_field($value): string
{
    return mb_substr(Escape::singleLine($value), 0, MAX_FIELD_LENGTH, 'UTF-8');
}

/** The message body keeps its line breaks; only the length is capped. @param mixed $value */
function contact_clean_message($value): string
{
    if ($value === null) {
        return '';
    }

    return mb_substr(trim(Escape::toText($value)), 0, MAX_MESSAGE_LENGTH, 'UTF-8');
}

/**
 * @param array<string,mixed> $body
 * @return array{errors:list<string>,data:array<string,mixed>}
 */
function contact_validate(array $body): array
{
    $errors = [];

    $name = contact_clean_field($body['name'] ?? null);
    $email = contact_clean_field($body['email'] ?? null);
    // The forms historically named this field `number`; accept both.
    $phone = contact_clean_field($body['phone'] ?? ($body['number'] ?? null));
    $subject = contact_clean_field($body['subject'] ?? null);
    if ($subject === '') {
        $subject = 'Meddelande från webbsidan';
    }
    $text = contact_clean_message($body['text'] ?? null);

    if ($email === '' || !preg_match(EMAIL_PATTERN, $email)) {
        $errors[] = 'email';
    }

    $details = [];
    $rawDetails = $body['details'] ?? null;
    if (is_array($rawDetails)) {
        foreach (array_slice($rawDetails, 0, MAX_DETAIL_ROWS, true) as $label => $value) {
            $cleanLabel = contact_clean_field($label);
            $cleanValue = contact_clean_field($value);
            if ($cleanLabel !== '' && $cleanValue !== '') {
                $details[] = [$cleanLabel, $cleanValue];
            }
        }
    }

    // The quote form on the home page sends structured details and asks for
    // neither a name nor a message, so those two are only required when no
    // details came with the request.
    if ($name === '' && $details === []) {
        $errors[] = 'name';
    }
    if ($text === '' && $details === []) {
        $errors[] = 'text';
    }

    return [
        'errors' => $errors,
        'data' => compact('name', 'email', 'phone', 'subject', 'text', 'details'),
    ];
}

if (!Http::isPost()) {
    Http::json(405, ['message' => 'Method not allowed'], ['Allow' => 'POST']);

    return;
}

$body = Http::jsonBody();
if ($body === null) {
    error_log('Contact rejected: unreadable or oversized body');
    Http::json(400, ['message' => AntiSpam::GENERIC_REJECTION_MESSAGE]);

    return;
}

// Honeypot, fill time and, when configured, Turnstile.
$screening = AntiSpam::screen($body, $_SERVER, $config, Clock::nowMs());
if ($screening !== null) {
    error_log('Contact rejected as spam: ' . $screening['reason']);
    // A filled honeypot gets the normal answer, so the bot learns nothing.
    Http::json(
        $screening['status'],
        ['message' => $screening['status'] === 200 ? SUCCESS_MESSAGE : AntiSpam::GENERIC_REJECTION_MESSAGE]
    );

    return;
}

$validation = contact_validate($body);
if ($validation['errors'] !== []) {
    error_log('Contact validation failed: ' . implode(', ', $validation['errors']));
    Http::json(400, ['message' => INVALID_MESSAGE]);

    return;
}
$data = $validation['data'];

// Only well-formed messages count: they are the ones that send mail.
$limiter = RateLimiter::create(
    'contact',
    Db::connectOptional($config),
    $config->get('storage_dir'),
    $config->get('rate_limit_pepper')
);
$limit = $limiter->hit(AntiSpam::clientIp($_SERVER, $config->trustedProxies()));
if (!$limit['allowed']) {
    error_log('Contact rate limited');
    Http::json(429, ['message' => AntiSpam::RATE_LIMIT_MESSAGE], ['Retry-After' => (string) $limit['retryAfterSeconds']]);

    return;
}

try {
    $mailer = new Mailer($config);

    // The office notice first: it carries the actual message.
    $mailer->send([
        'to' => $config->get('admin_email'),
        'replyTo' => (string) $data['email'],
        'subject' => 'Nytt meddelande - ' . $data['subject'],
        'html' => Messages::contactAdmin($data),
    ]);

    $mailer->send([
        'to' => (string) $data['email'],
        'subject' => 'Tack för ditt meddelande - Aurel Städ & Allservice',
        'html' => Messages::contactCustomer($data),
    ]);

    Http::json(200, ['message' => SUCCESS_MESSAGE]);
} catch (Throwable $e) {
    // Detail stays in the log; the browser gets a safe message.
    error_log('Contact error: ' . $e->getMessage());
    Http::json(500, ['message' => SERVER_ERROR_MESSAGE]);
}
