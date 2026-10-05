<?php

declare(strict_types=1);

namespace Aurel;

/**
 * Shared chrome for the transactional emails, so bookings and contact messages
 * look like they come from the same company. One-to-one port of
 * utils/emailLayout.js, including the signature, down to the whitespace, so a
 * customer cannot tell which backend sent the mail.
 */
final class EmailLayout
{
    private const CELL = 'padding: 10px 0; border-bottom: 1px solid #dee2e6;';
    private const LABEL = 'padding: 10px 0; border-bottom: 1px solid #dee2e6; color: #6c757d;';

    public const FROM_NAME = 'Aurel Städ & Allservice';
    public const FROM_ADDRESS = 'info@aurelservice.se';
    public const ADMIN_EMAIL = 'info@aurelservice.se';

    public const FOOTER = '<p style="color: #adb5bd; font-size: 12px; text-align: center; margin-top: 15px;">'
        . 'Aurel Städ &amp; Allservice AB — info@aurelservice.se</p>';

    public const SIGNATURE = "\n            <hr style=\"border: none; border-top: 1px solid #dee2e6; margin: 20px 0;\" />"
        . "\n            <p style=\"margin: 0; font-size: 14px;\">Med vänliga hälsningar,</p>"
        . "\n            <p style=\"margin: 5px 0 0; font-weight: bold;\">Aurel Städ &amp; Allservice AB</p>"
        . "\n            <p style=\"margin: 3px 0; font-size: 13px; color: #6c757d;\">Tel: 076-045 02 28 | "
        . 'info@aurelservice.se</p>';

    /**
     * Every value is escaped here, so callers can pass raw form input safely.
     *
     * @param mixed $value
     */
    public static function row(string $label, $value, bool $last = false, bool $bold = false, ?string $href = null): string
    {
        if ($value === null || $value === '') {
            return '';
        }
        $cellStyle = $last ? 'padding: 10px 0;' : self::CELL;
        $labelStyle = $last ? 'padding: 10px 0; color: #6c757d;' : self::LABEL;
        $safe = Escape::html($value);
        $content = $href !== null
            ? '<a href="' . Escape::html($href) . '" style="color: #34a783;">' . $safe . '</a>'
            : $safe;

        return "\n              <tr>"
            . "\n                <td style=\"" . $labelStyle . ' width: 130px;">' . Escape::html($label) . '</td>'
            . "\n                <td style=\"" . $cellStyle . ($bold ? ' font-weight: bold;' : '') . '">' . $content . '</td>'
            . "\n              </tr>";
    }

    public static function shell(string $heading, string $inner, string $footer = ''): string
    {
        return "\n        <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">"
            . "\n          <div style=\"background: linear-gradient(135deg, #2d9070, #34a783); padding: 25px 30px; "
            . "border-radius: 12px 12px 0 0;\">"
            . "\n            <h2 style=\"color: #fff; margin: 0; font-size: 22px;\">" . Escape::html($heading) . '</h2>'
            . "\n          </div>"
            . "\n          <div style=\"background: #f8f9fa; padding: 25px 30px; border-radius: 0 0 12px 12px; "
            . "border: 1px solid #e9ecef; border-top: none;\">"
            . "\n            " . $inner
            . "\n          </div>"
            . "\n          " . $footer
            . "\n        </div>"
            . "\n      ";
    }
}
