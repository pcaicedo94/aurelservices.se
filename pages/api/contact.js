// Contact endpoint: mails the office and sends the sender a confirmation.
// Anti-spam (honeypot, fill time, per-IP limit) runs first: utils/antiSpam.js.
//
// Test mode: with APP_TEST_MODE=1 mail is rendered by nodemailer's
// jsonTransport and never sent; `x-test-scenario: mail-error` forces the
// failure path. See utils/testMode.js.
import { escapeHtml, escapeHtmlMultiline, singleLine } from "../../utils/escapeHtml";
import { FROM, ADMIN_EMAIL, FOOTER, SIGNATURE, row, shell } from "../../utils/emailLayout";
import { startTestTrace, respond } from "../../utils/testMode";
import { createMailer } from "../../utils/mailer";
import {
  screenSubmission,
  createRateLimiter,
  rateLimitKey,
  greetingName,
  RATE_LIMIT,
  GENERIC_REJECTION_MESSAGE,
  RATE_LIMIT_MESSAGE,
} from "../../utils/antiSpam";

const MAX_FIELD_LENGTH = 300;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_DETAIL_ROWS = 15;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SUCCESS_MESSAGE = "Tack! Vi återkommer så snart som möjligt.";

// 5 messages per 10 minutes per IP. Kept in memory, so on serverless hosting
// it is per instance; the PHP version keeps the counters in the database.
const limiter = createRateLimiter(RATE_LIMIT);

function cleanField(value) {
  return singleLine(value).slice(0, MAX_FIELD_LENGTH);
}

// The message body keeps its line breaks; only the length is capped.
function cleanMessage(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, MAX_MESSAGE_LENGTH);
}

function validate(body) {
  const errors = [];

  const name = cleanField(body.name);
  const email = cleanField(body.email);
  // The forms historically named this field `number`; accept both.
  const phone = cleanField(body.phone ?? body.number);
  const subject = cleanField(body.subject) || "Meddelande från webbsidan";
  const text = cleanMessage(body.text);

  if (!email || !EMAIL_PATTERN.test(email)) errors.push("email");

  // The quote form on the home page sends structured details and asks for
  // neither a name nor a message, so those two are only required when no
  // details came with the request.
  const details = Object.entries(body.details || {})
    .slice(0, MAX_DETAIL_ROWS)
    .map(([label, value]) => [cleanField(label), cleanField(value)])
    .filter(([label, value]) => label && value);

  if (!name && details.length === 0) errors.push("name");
  if (!text && details.length === 0) errors.push("text");

  return { errors, data: { name, email, phone, subject, text, details } };
}

// This mail goes to whatever address was typed in, so it repeats none of the
// sender's text (no message, no details): otherwise the form could be used to
// deliver someone else's words from our address. Only a plausible name stays.
function customerEmail(data) {
  const name = greetingName(data.name);
  const inner = `
            <p style="font-size: 16px;">Hej${name ? ` <strong>${escapeHtml(name)}</strong>` : ""},</p>
            <p>Tack för att du kontaktar oss. Vi har tagit emot ditt meddelande och återkommer så snart som möjligt.</p>
            ${SIGNATURE}`;
  return shell("Tack för ditt meddelande!", inner);
}

function adminEmail(data) {
  const inner = `
            <table style="width: 100%; border-collapse: collapse;">${row("Namn", data.name, {
              bold: true,
            })}${row("E-post", data.email, { href: `mailto:${data.email}` })}${row("Telefon", data.phone, {
    href: `tel:${data.phone}`,
  })}${row("Ämne", data.subject)}${data.details.map(([label, value]) => row(label, value)).join("")}
            </table>
            ${
              data.text
                ? `<p style="color: #6c757d; font-size: 14px; margin: 20px 0 5px;">Meddelande:</p>
            <blockquote style="margin: 0; padding: 12px 15px; background: #fff; border-left: 3px solid #34a783; border-radius: 4px;">${escapeHtmlMultiline(
              data.text
            )}</blockquote>`
                : ""
            }`;
  return shell("Nytt meddelande från webbsidan", inner, FOOTER);
}

export default async function handler(req, res) {
  // Null unless APP_TEST_MODE=1; then mail is only simulated.
  const trace = startTestTrace(req);
  const reply = (status, body) => respond(res, status, body, trace);

  if (req.method !== "POST") {
    return reply(405, { message: "Method not allowed" });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};

  // Honeypot, fill time and, when configured, Turnstile.
  const screening = await screenSubmission(req, body, { testMode: Boolean(trace) });
  if (screening) {
    console.warn("Contact rejected as spam:", screening.reason);
    if (trace) trace.spam = screening.reason;
    // A filled honeypot gets the normal answer, so the bot learns nothing.
    return screening.status === 200
      ? reply(200, { message: SUCCESS_MESSAGE })
      : reply(400, { message: GENERIC_REJECTION_MESSAGE });
  }

  const { errors, data } = validate(body);
  if (errors.length > 0) {
    console.warn("Contact validation failed:", errors.join(", "));
    return reply(400, { message: "Vänligen fyll i alla uppgifter korrekt." });
  }

  // Only well-formed messages count: they are the ones that send mail.
  const limit = limiter.hit(rateLimitKey(req, { testMode: Boolean(trace) }));
  if (!limit.allowed) {
    console.warn("Contact rate limited");
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return reply(429, { message: RATE_LIMIT_MESSAGE });
  }

  try {
    const mailer = createMailer({ trace });

    await mailer.send({
      from: FROM,
      to: data.email,
      subject: "Tack för ditt meddelande - Aurel Städ & Allservice",
      html: customerEmail(data),
    });

    await mailer.send({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `Nytt meddelande - ${data.subject}`,
      html: adminEmail(data),
    });

    return reply(200, { message: SUCCESS_MESSAGE });
  } catch (error) {
    // Detail stays in the logs; the browser gets a safe message.
    console.error("Contact error:", error?.code || "unknown", error?.message);
    return reply(500, {
      message:
        "Meddelandet kunde inte skickas. Vänligen försök igen eller ring oss på 076-045 02 28.",
    });
  }
}
