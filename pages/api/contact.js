import nodemailer from "nodemailer";
import { escapeHtml, escapeHtmlMultiline, singleLine } from "../../utils/escapeHtml";
import { FROM, ADMIN_EMAIL, FOOTER, SIGNATURE, row, shell } from "../../utils/emailLayout";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const MAX_FIELD_LENGTH = 300;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_DETAIL_ROWS = 15;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

function customerEmail(data) {
  const inner = `
            <p style="font-size: 16px;">Hej${data.name ? ` <strong>${escapeHtml(data.name)}</strong>` : ""},</p>
            <p>Tack för att du kontaktar oss. Vi har tagit emot ditt meddelande och återkommer så snart som möjligt.</p>
            ${
              data.details.length
                ? `<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">${data.details
                    .map(([label, value]) => row(label, value))
                    .join("")}</table>`
                : ""
            }
            ${
              data.text
                ? `<p style="color: #6c757d; font-size: 14px; margin-bottom: 5px;">Ditt meddelande:</p>
            <blockquote style="margin: 0; padding: 12px 15px; background: #fff; border-left: 3px solid #34a783; border-radius: 4px;">${escapeHtmlMultiline(
              data.text
            )}</blockquote>`
                : ""
            }
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
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { errors, data } = validate(req.body || {});
  if (errors.length > 0) {
    console.warn("Contact validation failed:", errors.join(", "));
    return res.status(400).json({ message: "Vänligen fyll i alla uppgifter korrekt." });
  }

  try {
    await transporter.sendMail({
      from: FROM,
      to: data.email,
      subject: "Tack för ditt meddelande - Aurel Städ & Allservice",
      html: customerEmail(data),
    });

    await transporter.sendMail({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `Nytt meddelande - ${data.subject}`,
      html: adminEmail(data),
    });

    res.status(200).json({ message: "Tack! Vi återkommer så snart som möjligt." });
  } catch (error) {
    // Detail stays in the logs; the browser gets a safe message.
    console.error("Contact error:", error?.code || "unknown", error?.message);
    res.status(500).json({
      message:
        "Meddelandet kunde inte skickas. Vänligen försök igen eller ring oss på 076-045 02 28.",
    });
  }
}
