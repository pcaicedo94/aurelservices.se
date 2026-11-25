// Explicit .js extensions: Next resolves them either way, but plain Node does
// not, and scripts/qa-email.mjs loads this module without Next.
import { escapeHtml } from "./escapeHtml.js";
import { LOGO_CID, LOGO_WIDTH, LOGO_HEIGHT } from "./emailLogo.js";

// Shared chrome for the transactional emails, so bookings and contact messages
// look like they come from the same company.
//
// The structure follows the Aluri transactional template
// (AluriWebPage/src/lib/email/plantilla.ts): a full HTML document, nested
// presentation tables instead of divs, a hidden preheader, a 600px card and a
// footer band. Divs were the old approach here and they do not survive
// Outlook, which renders mail with Word: it ignores border-radius, drops
// linear-gradient entirely — the old green heading band could come out
// transparent — and does not centre a max-width div. Tables with explicit
// width attributes are the only layout every mail client agrees on.
//
// What is NOT copied from Aluri is the black header band. The Aurel logo is
// green type on transparency, so it needs a light background; Aluri's logo is
// drawn for black. Here the brand shows up as the green rule under the logo
// and in the accents instead.
//
// Colours: #34a783 is the brand green, but on white it only reaches 2.9:1 and
// fails WCAG AA for body text, so text and links use #1f7a5c (4.6:1) and the
// pale green is kept for backgrounds. Same reasoning as the Aluri template.

const BRAND = "#34a783"; // backgrounds, rules and borders only
const BRAND_TEXT = "#1f7a5c"; // links and figures: readable on white
const INK = "#212529";
const BODY = "#495057";
const MUTED = "#6c757d";
const LINE = "#e9ecef";
const PAGE_BG = "#f1f5f4";
const PANEL_BG = "#f8f9fa";

// No webfont: Gmail and Outlook drop them and fall back to the system stack
// anyway, so the stack is the design.
const FONT = "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif";

const CELL = `padding: 12px 0; border-bottom: 1px solid ${LINE};`;
const LABEL = `${CELL} color: ${MUTED}; font-size: 14px;`;

export const FROM = '"Aurel Städ & Allservice" <info@aurelservice.se>';
export const ADMIN_EMAIL = "info@aurelservice.se";

// The details table that row() and priceRow() fill. It is a constant rather
// than markup each caller writes, because a details table that forgets
// role="presentation" is read out as a data table by a screen reader.
// TABLE_OPEN_SPACED is the same table with room under it, for the mails where
// a paragraph follows.
const TABLE_ATTRS =
  'role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"';
export const TABLE_OPEN = `
            <table ${TABLE_ATTRS} style="width: 100%; border-collapse: collapse;">`;
export const TABLE_OPEN_SPACED = `
            <table ${TABLE_ATTRS} style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">`;
export const TABLE_CLOSE = `
            </table>`;

// Every value is escaped here, so callers can pass raw form input safely.
export function row(label, value, { last = false, bold = false, href = null } = {}) {
  if (value === null || value === undefined || value === "") return "";
  const cellStyle = last ? "padding: 12px 0;" : CELL;
  const labelStyle = last ? `padding: 12px 0; color: ${MUTED}; font-size: 14px;` : LABEL;
  const safe = escapeHtml(value);
  const content = href
    ? `<a href="${escapeHtml(href)}" style="color: ${BRAND_TEXT};">${safe}</a>`
    : safe;
  const weight = bold ? " font-weight: bold;" : "";
  return `
              <tr>
                <td style="${labelStyle} width: 140px;">${escapeHtml(label)}</td>
                <td style="${cellStyle} color: ${INK}; font-size: 15px;${weight}">${content}</td>
              </tr>`;
}

// The last row of a details table: the figure the reader is looking for. It
// keeps its own markup because it is the one value that should not look like
// the rows above it.
export function priceRow(label, value) {
  return `
              <tr>
                <td style="padding: 16px 0 0; color: ${MUTED}; font-size: 15px;">${escapeHtml(label)}</td>
                <td style="padding: 16px 0 0; font-weight: bold; font-size: 20px; color: ${BRAND_TEXT};">${escapeHtml(value)} kr</td>
              </tr>`;
}

// Good news, at the top of the body: the booking exists, the message arrived.
// Pale green behind dark text, never green text — see the colour note above.
// `title` is plain text and is escaped here; `text` is HTML, so anything the
// customer typed must already have gone through escapeHtml().
export function highlight(title, text = "") {
  const second = text
    ? `
                  <p style="margin: 8px 0 0; font-size: 15px; line-height: 1.6; color: ${BODY};">${text}</p>`
    : "";
  return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px;">
              <tr>
                <td style="padding: 18px 20px; background-color: #e8f7f1; border-left: 4px solid ${BRAND}; border-radius: 10px;">
                  <p style="margin: 0; font-size: 18px; line-height: 1.35; font-weight: bold; color: ${INK};">${escapeHtml(title)}</p>${second}
                </td>
              </tr>
            </table>`;
}

// Something the reader has to act on. Amber, because it has to read as a
// warning and not as the brand. `html` is HTML, like `highlight`'s text.
export function notice(html) {
  return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px;">
              <tr>
                <td style="padding: 16px 18px; background-color: #fef3c7; border-left: 4px solid #f0b429; border-radius: 10px;">
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #78350f;">${html}</p>
                </td>
              </tr>
            </table>`;
}

// A body paragraph. `html` is HTML: user input goes through escapeHtml() first.
export function paragraph(html) {
  return `
            <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: ${BODY};">${html}</p>`;
}

export const SIGNATURE = `
            <hr style="border: none; border-top: 1px solid ${LINE}; margin: 28px 0 20px;" />
            <p style="margin: 0; font-size: 14px; color: ${BODY};">Med vänliga hälsningar,</p>
            <p style="margin: 6px 0 0; font-weight: bold; color: ${INK};">Aurel Städ &amp; Allservice AB</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: ${MUTED};">Tel: 076-045 02 28 | info@aurelservice.se</p>`;

// `heading` and `preheader` are plain text and are escaped here. `inner` is
// HTML built by the caller.
//
// The preheader is the line the inbox shows next to the subject. Without one,
// Gmail pulls the first words of the body, which here would be "Hej Åsa" —
// true and useless. It is hidden inside the body itself.
//
// The footer is part of the shell rather than something callers pass in: it
// carries the company name and the two ways to reach us, and every mail we
// send should end with them.
export function shell(heading, inner, preheader = "") {
  const title = escapeHtml(heading);
  const preheaderHtml = preheader
    ? `
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${PAGE_BG};">${escapeHtml(preheader)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};font-family:${FONT};color:${INK};">${preheaderHtml}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAGE_BG};">
<tr><td align="center" style="padding: 32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden;">

<tr><td style="padding: 32px 40px 26px; background-color: #ffffff; border-bottom: 3px solid ${BRAND}; text-align: center;">
<img src="cid:${LOGO_CID}" alt="Aurel Städ &amp; Allservice AB" width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" style="display: block; margin: 0 auto; width: ${LOGO_WIDTH}px; height: ${LOGO_HEIGHT}px; max-width: 100%; border: 0; outline: none; text-decoration: none;" />
</td></tr>

<tr><td style="padding: 36px 40px;">
<h1 style="margin: 0 0 24px; font-size: 22px; font-weight: 600; line-height: 1.3; color: ${INK};">${title}</h1>
            ${inner}
</td></tr>

<tr><td style="padding: 22px 40px; background-color: ${PANEL_BG}; border-top: 1px solid ${LINE}; text-align: center;">
<p style="margin: 0; font-size: 12px; line-height: 1.6; color: ${MUTED};">Aurel Städ &amp; Allservice AB — <a href="mailto:info@aurelservice.se" style="color: ${BRAND_TEXT};">info@aurelservice.se</a> — 076-045 02 28</p>
<p style="margin: 6px 0 0; font-size: 11px; color: #adb5bd;">Städning i Stockholm med omnejd</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
