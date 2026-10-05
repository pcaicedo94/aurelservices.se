<?php

declare(strict_types=1);

namespace Aurel;

/**
 * The four emails, same content and same signature as today:
 * pages/api/booking.js (customerEmail, adminEmail) and pages/api/contact.js
 * (customerEmail, adminEmail).
 *
 * Pure string building, no transport: tests/test_messages.php renders these
 * without PHPMailer, MySQL or a network.
 */
final class Messages
{
    /* ------------------------------- booking ------------------------------ */

    /** @param array<string,mixed> $data */
    public static function bookingCustomer(array $data, string $when): string
    {
        $inner = "\n            <p style=\"font-size: 16px;\">Hej <strong>" . Escape::html($data['name'])
            . "</strong>,</p>\n            <p>Vi har mottagit din bokning för <strong>"
            . Escape::html($data['cleaningType']) . '</strong>. Här är en sammanfattning:</p>'
            . "\n            <table style=\"width: 100%; border-collapse: collapse; margin: 20px 0;\">"
            . EmailLayout::row('Datum/tid', $when)
            . EmailLayout::row('Adress', $data['address'])
            . "\n              <tr>"
            . "\n                <td style=\"padding: 10px 0; color: #6c757d;\">Uppskattat pris</td>"
            . "\n                <td style=\"padding: 10px 0; font-weight: bold; font-size: 18px; color: #2d9070;\">"
            . Escape::html(BookingRules::formatPrice((float) $data['totalPrice'])) . ' kr</td>'
            . "\n              </tr>"
            . "\n            </table>"
            . "\n            <p>Vi återkommer med en bekräftelse inom kort.</p>"
            . "\n            " . EmailLayout::SIGNATURE;

        return EmailLayout::shell('Tack för din bokning!', $inner);
    }

    /**
     * @param array<string,mixed> $data
     * @param list<array{0:string,1:string}> $details
     */
    public static function bookingAdmin(array $data, array $details, string $when): string
    {
        $rows = EmailLayout::row('Tjänst', $data['cleaningType'], false, true)
            . EmailLayout::row('Kund', $data['name'], false, true)
            . EmailLayout::row('E-post', $data['email'], false, false, 'mailto:' . $data['email'])
            . EmailLayout::row('Telefon', $data['phone'], false, false, 'tel:' . $data['phone'])
            . EmailLayout::row('Adress', $data['address'])
            . EmailLayout::row('Datum/tid', $when);
        // Everything else the form sent (contact preference, add-ons, rooms...).
        foreach ($details as [$label, $value]) {
            $rows .= EmailLayout::row($label, $value);
        }

        // No "could not be saved" banner here, unlike pages/api/booking.js: the
        // row is written before any mail goes out, so a booking that is mailed
        // is a booking that exists. See BookingStore.
        $inner = "\n            <table style=\"width: 100%; border-collapse: collapse;\">" . $rows
            . "\n              <tr>"
            . "\n                <td style=\"padding: 12px 0; color: #6c757d; font-size: 16px;\">Pris</td>"
            . "\n                <td style=\"padding: 12px 0; font-weight: bold; font-size: 20px; color: #2d9070;\">"
            . Escape::html(BookingRules::formatPrice((float) $data['totalPrice'])) . ' kr</td>'
            . "\n              </tr>"
            . "\n            </table>";

        return EmailLayout::shell('Ny bokning mottagen', $inner, EmailLayout::FOOTER);
    }

    /* ------------------------------- contact ------------------------------ */

    /**
     * This mail goes to whatever address was typed in, so it repeats none of
     * the sender's text (no message, no details): otherwise the form could be
     * used to deliver someone else's words from our address. Only a plausible
     * name stays.
     *
     * @param array<string,mixed> $data
     */
    public static function contactCustomer(array $data): string
    {
        $name = AntiSpam::greetingName($data['name'] ?? '');
        $greeting = $name === '' ? '' : ' <strong>' . Escape::html($name) . '</strong>';
        $inner = "\n            <p style=\"font-size: 16px;\">Hej" . $greeting . ",</p>"
            . "\n            <p>Tack för att du kontaktar oss. Vi har tagit emot ditt meddelande och återkommer så "
            . "snart som möjligt.</p>"
            . "\n            " . EmailLayout::SIGNATURE;

        return EmailLayout::shell('Tack för ditt meddelande!', $inner);
    }

    /** @param array<string,mixed> $data */
    public static function contactAdmin(array $data): string
    {
        $rows = EmailLayout::row('Namn', $data['name'], false, true)
            . EmailLayout::row('E-post', $data['email'], false, false, 'mailto:' . $data['email'])
            . EmailLayout::row('Telefon', $data['phone'], false, false, 'tel:' . $data['phone'])
            . EmailLayout::row('Ämne', $data['subject']);
        /** @var list<array{0:string,1:string}> $details */
        $details = $data['details'];
        foreach ($details as [$label, $value]) {
            $rows .= EmailLayout::row($label, $value);
        }

        $text = (string) $data['text'];
        $quote = $text === ''
            ? ''
            : "<p style=\"color: #6c757d; font-size: 14px; margin: 20px 0 5px;\">Meddelande:</p>"
                . "\n            <blockquote style=\"margin: 0; padding: 12px 15px; background: #fff; "
                . "border-left: 3px solid #34a783; border-radius: 4px;\">"
                . Escape::htmlMultiline($text) . '</blockquote>';

        $inner = "\n            <table style=\"width: 100%; border-collapse: collapse;\">" . $rows
            . "\n            </table>"
            . "\n            " . $quote;

        return EmailLayout::shell('Nytt meddelande från webbsidan', $inner, EmailLayout::FOOTER);
    }
}
