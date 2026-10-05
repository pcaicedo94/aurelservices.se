<?php

declare(strict_types=1);

namespace Aurel;

/**
 * One-to-one port of utils/escapeHtml.js, which stays the source of truth for
 * the escaping contract. Every user supplied value is escaped before it is
 * interpolated into email HTML, and every value that ends up in a mail header
 * or a one-line field goes through singleLine() first.
 */
final class Escape
{
    private const MAP = [
        '&' => '&amp;',
        '<' => '&lt;',
        '>' => '&gt;',
        '"' => '&quot;',
        "'" => '&#39;',
    ];

    /**
     * JavaScript's String(value) for the value kinds the forms can produce.
     * null/undefined become "", which is what the JS helpers do.
     *
     * @param mixed $value
     */
    public static function toText($value): string
    {
        if ($value === null) {
            return '';
        }
        if (is_bool($value)) {
            // String(true) === "true" in JS; PHP's cast would give "1".
            return $value ? 'true' : 'false';
        }
        if (is_array($value) || is_object($value)) {
            // The JS helpers are never called with these; refusing beats
            // emitting "Array" into an email.
            return '';
        }

        return (string) $value;
    }

    /**
     * Escapes a user supplied value for interpolation into email HTML.
     *
     * Deliberately not htmlspecialchars(): this mirrors the JS map exactly,
     * including ' => &#39; (htmlspecialchars emits &#039;), so the QA
     * expectations of scripts/qa-units.mjs hold for the PHP output too.
     *
     * @param mixed $value
     */
    public static function html($value): string
    {
        return strtr(self::toText($value), self::MAP);
    }

    /**
     * For free text where the author's line breaks are part of the message:
     * escape first, then turn the newlines into markup, so nothing user
     * supplied is ever interpreted as HTML.
     *
     * @param mixed $value
     */
    public static function htmlMultiline($value): string
    {
        return (string) preg_replace('/\r?\n/', '<br />', self::html($value));
    }

    /**
     * Removes line breaks so user input cannot inject extra mail headers
     * (Subject, To) or break one-line fields (calendar summary).
     *
     * @param mixed $value
     */
    public static function singleLine($value): string
    {
        $text = (string) preg_replace('/[\r\n]+/', ' ', self::toText($value));

        return trim($text);
    }

    /**
     * Mail headers must never carry a control character. PHPMailer refuses
     * most of them already; this is the belt to its braces, applied to every
     * subject and address we hand it.
     *
     * @param mixed $value
     */
    public static function header($value): string
    {
        $text = self::singleLine($value);

        // Strip the rest of C0/C7F too, not just CR/LF.
        return (string) preg_replace('/[\x00-\x1F\x7F]+/', ' ', $text);
    }
}
