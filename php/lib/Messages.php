<?php

declare(strict_types=1);

namespace Aurel;

/**
 * The four emails, same content and same markup as
 * pages/api/booking.js (customerEmail, adminEmail) and pages/api/contact.js
 * (customerEmail, adminEmail).
 *
 * Each method mirrors its JavaScript twin line for line, concatenating the
 * EmailLayout helpers rather than writing markup inline: the helpers already
 * carry their own newline and indent, so the two backends produce the same
 * bytes. tests/test_email_layout.php proves it.
 *
 * Pure string building, no transport: tests/test_messages.php renders these
 * without PHPMailer, MySQL or a network.
 */
final class Messages
{
    /* ------------------------------- booking ------------------------------ */

    /**
     * The date and time are the one thing the customer comes back to this mail
     * for, weeks later, so they get the highlight band instead of a row in the
     * table. Everything else stays in the table under it.
     *
     * @param array<string,mixed> $data
     */
    public static function bookingCustomer(array $data, string $when): string
    {
        $price = BookingRules::formatPrice((float) $data['totalPrice']);

        $inner = EmailLayout::paragraph('Hej <strong>' . Escape::html($data['name']) . '</strong>,')
            . EmailLayout::paragraph(
                'Vi har mottagit din bokning för <strong>' . Escape::html($data['cleaningType'])
                . '</strong>. Här är en sammanfattning:'
            )
            . EmailLayout::highlight($when)
            . EmailLayout::TABLE_OPEN_SPACED
            . EmailLayout::row('Adress', $data['address'])
            . EmailLayout::priceRow('Uppskattat pris', $price)
            . EmailLayout::TABLE_CLOSE
            . EmailLayout::paragraph('Vi återkommer med en bekräftelse inom kort.')
            . EmailLayout::SIGNATURE;

        return EmailLayout::shell(
            'Tack för din bokning!',
            $inner,
            $data['cleaningType'] . ' — ' . $when
        );
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

        // No "could not be saved" warning here, unlike pages/api/booking.js: the
        // row is written before any mail goes out, so a booking that is mailed
        // is a booking that exists. See BookingStore.
        $price = BookingRules::formatPrice((float) $data['totalPrice']);
        $inner = EmailLayout::TABLE_OPEN
            . $rows
            . EmailLayout::priceRow('Pris', $price)
            . EmailLayout::TABLE_CLOSE;

        return EmailLayout::shell(
            'Ny bokning mottagen',
            $inner,
            $data['name'] . ' — ' . $data['cleaningType'] . ' ' . $when
        );
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

        $inner = EmailLayout::paragraph('Hej' . $greeting . ',')
            // Q90, confirmed by the client on 2026-10-15: always within 24 hours.
            . EmailLayout::paragraph(
                'Tack för att du kontaktar oss. Vi har tagit emot ditt meddelande och du får svar '
                . 'inom 24 timmar.'
            )
            . EmailLayout::SIGNATURE;

        return EmailLayout::shell(
            'Tack för ditt meddelande!',
            $inner,
            'Vi har tagit emot ditt meddelande. Du får svar inom 24 timmar.'
        );
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
        $message = $text === ''
            ? ''
            : "\n            <p style=\"margin: 24px 0 8px; color: #6c757d; font-size: 13px; "
                . "text-transform: uppercase; letter-spacing: 0.04em;\">Meddelande</p>"
                . "\n            <blockquote style=\"margin: 0; padding: 16px 18px; "
                . "background-color: #f8f9fa; border-left: 4px solid #34a783; border-radius: 10px; "
                . "font-size: 15px; line-height: 1.6; color: #212529;\">"
                . Escape::htmlMultiline($text) . '</blockquote>';

        $inner = EmailLayout::TABLE_OPEN . $rows . EmailLayout::TABLE_CLOSE . $message;

        $who = ($data['name'] ?? '') !== '' ? $data['name'] : $data['email'];

        return EmailLayout::shell(
            'Nytt meddelande från webbsidan',
            $inner,
            $data['subject'] . ' — ' . $who
        );
    }
}
