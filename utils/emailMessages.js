// The four transactional emails, as pure string builders.
//
// They live here rather than inside pages/api/*.js for two reasons: it mirrors
// php/lib/Messages.php, the implementation that actually runs in production,
// so the two sides can be read side by side; and it lets
// scripts/qa-email.mjs render them without a server and compare them with the
// PHP output byte for byte. Mail that looks different depending on which
// backend answered is a bug a customer can see.
//
// Each function here concatenates the EmailLayout helpers instead of writing
// markup inline. The helpers already carry their own newline and indent, so
// concatenation is what keeps the two backends producing identical bytes.
import { escapeHtml, escapeHtmlMultiline } from "./escapeHtml.js";
import { greetingName } from "./antiSpam.js";
import {
  SIGNATURE,
  TABLE_OPEN,
  TABLE_OPEN_SPACED,
  TABLE_CLOSE,
  row,
  priceRow,
  highlight,
  notice,
  paragraph,
  shell,
} from "./emailLayout.js";

/* --------------------------------- booking -------------------------------- */

// The client's "förfrågan mottagen" text (Textosweb.docx, 2026-11-26): the
// website sends a free, non-binding request, and Aurel answers with an offer.
// The wished-for date gets the highlight band; the preliminary price stays in
// the table under it.
export function bookingCustomer(data, when) {
  const inner =
    paragraph(`Hej <strong>${escapeHtml(data.name)}</strong>!`) +
    paragraph("Tack för din förfrågan och för ditt intresse för Aurel Städ &amp; Allservice AB!") +
    paragraph(
      `Vi har tagit emot dina uppgifter för <strong>${escapeHtml(data.cleaningType)}</strong> och kommer nu att gå igenom dina önskemål för att kunna erbjuda dig en städlösning som passar just ditt hem.`
    ) +
    highlight(when) +
    TABLE_OPEN_SPACED +
    row("Adress", data.address) +
    priceRow("Preliminärt pris efter RUT", data.totalPrice) +
    TABLE_CLOSE +
    paragraph("Vi återkommer via e-post med ett prisförslag och information om tillgängliga tider.") +
    paragraph(
      "Observera att din förfrågan är kostnadsfri och inte innebär någon bindande bokning. Ett eventuellt resetillägg anges separat i prisförslaget."
    ) +
    paragraph("Har du frågor under tiden är du varmt välkommen att kontakta oss.") +
    SIGNATURE;

  return shell("Tack för din förfrågan!", inner, `${data.cleaningType} — ${when}`);
}

// A failed database write must never be silent: the booking is real (it is in
// the calendar and in this mail) but it is missing from the records, and only
// this banner would tell anyone. The PHP side has no equivalent on purpose —
// there the row is written before any mail goes out.
export function bookingAdmin(data, details, when, dbFailed = false) {
  const warning = dbFailed
    ? notice(
        "<strong>OBS:</strong> bokningen kunde inte sparas i databasen. Den finns i kalendern och i detta mejl, men saknas i bokningslistan. Kontrollera Supabase."
      )
    : "";

  const rows = [
    row("Tjänst", data.cleaningType, { bold: true }),
    row("Kund", data.name, { bold: true }),
    row("E-post", data.email, { href: `mailto:${data.email}` }),
    row("Telefon", data.phone, { href: `tel:${data.phone}` }),
    row("Adress", data.address),
    row("Datum/tid", when),
    // Everything else the form sent (contact preference, add-ons, rooms...).
    ...details.map(([label, value]) => row(label, value)),
  ].join("");

  const inner =
    warning + TABLE_OPEN + rows + priceRow("Pris", data.totalPrice) + TABLE_CLOSE;

  return shell(
    "Ny bokningsförfrågan",
    inner,
    `${data.name} — ${data.cleaningType} ${when}`
  );
}

/* --------------------------------- contact -------------------------------- */

// This mail goes to whatever address was typed in, so it repeats none of the
// sender's text (no message, no details): otherwise the form could be used to
// deliver someone else's words from our address. Only a plausible name stays.
export function contactCustomer(data) {
  const name = greetingName(data.name);
  const inner =
    paragraph(`Hej${name ? ` <strong>${escapeHtml(name)}</strong>` : ""},`) +
    // Q90, confirmed by the client on 2026-10-15: always within 24 hours.
    paragraph(
      "Tack för att du kontaktar oss. Vi har tagit emot ditt meddelande och du får svar inom 24 timmar."
    ) +
    SIGNATURE;

  return shell(
    "Tack för ditt meddelande!",
    inner,
    "Vi har tagit emot ditt meddelande. Du får svar inom 24 timmar."
  );
}

export function contactAdmin(data) {
  const rows =
    row("Namn", data.name, { bold: true }) +
    row("E-post", data.email, { href: `mailto:${data.email}` }) +
    row("Telefon", data.phone, { href: `tel:${data.phone}` }) +
    row("Ämne", data.subject) +
    data.details.map(([label, value]) => row(label, value)).join("");

  const message = data.text
    ? `
            <p style="margin: 24px 0 8px; color: #6c757d; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em;">Meddelande</p>
            <blockquote style="margin: 0; padding: 16px 18px; background-color: #f8f9fa; border-left: 4px solid #34a783; border-radius: 10px; font-size: 15px; line-height: 1.6; color: #212529;">${escapeHtmlMultiline(
              data.text
            )}</blockquote>`
    : "";

  const inner = TABLE_OPEN + rows + TABLE_CLOSE + message;

  return shell(
    "Nytt meddelande från webbsidan",
    inner,
    `${data.subject} — ${data.name || data.email}`
  );
}
