<?php

declare(strict_types=1);

namespace Aurel;

/**
 * Shared chrome for the transactional emails, so bookings and contact messages
 * look like they come from the same company. One-to-one port of
 * utils/emailLayout.js, down to the whitespace, so a customer cannot tell
 * which backend sent the mail. tests/test_email_layout.php renders both and
 * compares them byte for byte; if you change one file, change the other.
 *
 * The structure follows the Aluri transactional template
 * (AluriWebPage/src/lib/email/plantilla.ts): a full HTML document, nested
 * presentation tables instead of divs, a hidden preheader, a 600px card and a
 * footer band. See utils/emailLayout.js for why divs had to go (Outlook) and
 * why the header band is light here while Aluri's is black (the Aurel logo is
 * green type on transparency).
 */
final class EmailLayout
{
    /** Brand green. Backgrounds, rules and borders only: on white it is 2.9:1. */
    private const BRAND = '#34a783';
    /** Links and figures: 4.6:1 on white, so it passes WCAG AA for body text. */
    private const BRAND_TEXT = '#1f7a5c';
    private const INK = '#212529';
    private const BODY = '#495057';
    private const MUTED = '#6c757d';
    private const LINE = '#e9ecef';
    private const PAGE_BG = '#f1f5f4';
    private const PANEL_BG = '#f8f9fa';

    /** No webfont: Gmail and Outlook drop them, so the system stack is the design. */
    private const FONT = '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif';

    private const CELL = 'padding: 12px 0; border-bottom: 1px solid #e9ecef;';
    private const LABEL = 'padding: 12px 0; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 14px;';

    /**
     * The logo is attached inline by Mailer, never linked: see utils/emailLogo.js
     * for why. php/assets/logo-email.png is the same 400x157 file the Node
     * mailer carries as base64; both come from scripts/build-email-logo.mjs.
     * Both dimensions go on the tag so Outlook reserves the space.
     */
    public const LOGO_CID = 'aurel-logo';
    public const LOGO_WIDTH = 200;
    public const LOGO_HEIGHT = 79;

    public const FROM_NAME = 'Aurel Städ & Allservice';
    public const FROM_ADDRESS = 'info@aurelservice.se';
    public const ADMIN_EMAIL = 'info@aurelservice.se';

    public const SIGNATURE = "\n            <hr style=\"border: none; border-top: 1px solid #e9ecef; margin: 28px 0 20px;\" />"
        . "\n            <p style=\"margin: 0; font-size: 14px; color: #495057;\">Med vänliga hälsningar,</p>"
        . "\n            <p style=\"margin: 6px 0 0; font-weight: bold; color: #212529;\">Aurel Städ &amp; Allservice AB</p>"
        . "\n            <p style=\"margin: 4px 0 0; font-size: 13px; color: #6c757d;\">Tel: 076-045 02 28 | "
        . 'info@aurelservice.se</p>';

    /**
     * The details table that row() and priceRow() fill. It is a constant
     * rather than markup each caller writes, because a details table that
     * forgets role="presentation" is read out as a data table by a screen
     * reader. TABLE_OPEN_SPACED is the same table with room under it, for the
     * mails where a paragraph follows.
     */
    private const TABLE_ATTRS = 'role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"';
    public const TABLE_OPEN = "\n            <table " . self::TABLE_ATTRS
        . ' style="width: 100%; border-collapse: collapse;">';
    public const TABLE_OPEN_SPACED = "\n            <table " . self::TABLE_ATTRS
        . ' style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">';
    public const TABLE_CLOSE = "\n            </table>";

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
        $cellStyle = $last ? 'padding: 12px 0;' : self::CELL;
        $labelStyle = $last ? 'padding: 12px 0; color: ' . self::MUTED . '; font-size: 14px;' : self::LABEL;
        $safe = Escape::html($value);
        $content = $href !== null
            ? '<a href="' . Escape::html($href) . '" style="color: ' . self::BRAND_TEXT . ';">' . $safe . '</a>'
            : $safe;
        $weight = $bold ? ' font-weight: bold;' : '';

        return "\n              <tr>"
            . "\n                <td style=\"" . $labelStyle . ' width: 140px;">' . Escape::html($label) . '</td>'
            . "\n                <td style=\"" . $cellStyle . ' color: ' . self::INK . '; font-size: 15px;' . $weight
            . '">' . $content . '</td>'
            . "\n              </tr>";
    }

    /**
     * The last row of a details table: the figure the reader is looking for. It
     * keeps its own markup because it is the one value that should not look
     * like the rows above it.
     *
     * @param mixed $value
     */
    public static function priceRow(string $label, $value): string
    {
        return "\n              <tr>"
            . "\n                <td style=\"padding: 16px 0 0; color: " . self::MUTED . '; font-size: 15px;">'
            . Escape::html($label) . '</td>'
            . "\n                <td style=\"padding: 16px 0 0; font-weight: bold; font-size: 20px; color: "
            . self::BRAND_TEXT . ';">' . Escape::html($value) . ' kr</td>'
            . "\n              </tr>";
    }

    /**
     * Good news, at the top of the body: the booking exists, the message
     * arrived. Pale green behind dark text, never green text — see BRAND_TEXT.
     * `$title` is plain text and is escaped here; `$text` is HTML, so anything
     * the customer typed must already have gone through Escape::html().
     */
    public static function highlight(string $title, string $text = ''): string
    {
        $second = $text === ''
            ? ''
            : "\n                  <p style=\"margin: 8px 0 0; font-size: 15px; line-height: 1.6; color: "
                . self::BODY . ';">' . $text . '</p>';

        return "\n            <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin: 0 0 24px;\">"
            . "\n              <tr>"
            . "\n                <td style=\"padding: 18px 20px; background-color: #e8f7f1; border-left: 4px solid "
            . self::BRAND . '; border-radius: 10px;">'
            . "\n                  <p style=\"margin: 0; font-size: 18px; line-height: 1.35; font-weight: bold; color: "
            . self::INK . ';">' . Escape::html($title) . '</p>' . $second
            . "\n                </td>"
            . "\n              </tr>"
            . "\n            </table>";
    }

    /**
     * Something the reader has to act on. Amber, because it has to read as a
     * warning and not as the brand. `$html` is HTML, like highlight()'s text.
     */
    public static function notice(string $html): string
    {
        return "\n            <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin: 0 0 24px;\">"
            . "\n              <tr>"
            . "\n                <td style=\"padding: 16px 18px; background-color: #fef3c7; border-left: 4px solid #f0b429; border-radius: 10px;\">"
            . "\n                  <p style=\"margin: 0; font-size: 14px; line-height: 1.6; color: #78350f;\">" . $html . '</p>'
            . "\n                </td>"
            . "\n              </tr>"
            . "\n            </table>";
    }

    /** A body paragraph. `$html` is HTML: user input goes through Escape::html() first. */
    public static function paragraph(string $html): string
    {
        return "\n            <p style=\"margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: "
            . self::BODY . ';">' . $html . '</p>';
    }

    /**
     * `$heading` and `$preheader` are plain text and are escaped here;
     * `$inner` is HTML built by the caller.
     *
     * The preheader is the line the inbox shows next to the subject. Without
     * one, Gmail pulls the first words of the body, which here would be
     * "Hej Åsa" — true and useless. It is hidden inside the body itself.
     *
     * The footer is part of the shell rather than something callers pass in:
     * it carries the company name and the two ways to reach us, and every mail
     * we send should end with them.
     */
    public static function shell(string $heading, string $inner, string $preheader = ''): string
    {
        $title = Escape::html($heading);
        $preheaderHtml = $preheader === ''
            ? ''
            : "\n<div style=\"display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:"
                . self::PAGE_BG . ';">' . Escape::html($preheader) . '</div>';

        $font = self::FONT;
        $pageBg = self::PAGE_BG;
        $panelBg = self::PANEL_BG;
        $brand = self::BRAND;
        $brandText = self::BRAND_TEXT;
        $ink = self::INK;
        $muted = self::MUTED;
        $line = self::LINE;
        $cid = self::LOGO_CID;
        $w = self::LOGO_WIDTH;
        $h = self::LOGO_HEIGHT;

        return <<<HTML
<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{$title}</title>
</head>
<body style="margin:0;padding:0;background-color:{$pageBg};font-family:{$font};color:{$ink};">{$preheaderHtml}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:{$pageBg};">
<tr><td align="center" style="padding: 32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden;">

<tr><td style="padding: 32px 40px 26px; background-color: #ffffff; border-bottom: 3px solid {$brand}; text-align: center;">
<img src="cid:{$cid}" alt="Aurel Städ &amp; Allservice AB" width="{$w}" height="{$h}" style="display: block; margin: 0 auto; width: {$w}px; height: {$h}px; max-width: 100%; border: 0; outline: none; text-decoration: none;" />
</td></tr>

<tr><td style="padding: 36px 40px;">
<h1 style="margin: 0 0 24px; font-size: 22px; font-weight: 600; line-height: 1.3; color: {$ink};">{$title}</h1>
            {$inner}
</td></tr>

<tr><td style="padding: 22px 40px; background-color: {$panelBg}; border-top: 1px solid {$line}; text-align: center;">
<p style="margin: 0; font-size: 12px; line-height: 1.6; color: {$muted};">Aurel Städ &amp; Allservice AB — <a href="mailto:info@aurelservice.se" style="color: {$brandText};">info@aurelservice.se</a> — 076-045 02 28</p>
<p style="margin: 6px 0 0; font-size: 11px; color: #adb5bd;">Städning i Stockholm med omnejd</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>
HTML;
    }
}
