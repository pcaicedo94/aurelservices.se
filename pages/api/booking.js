import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { escapeHtml, singleLine } from "../../utils/escapeHtml";
import {
  TIME_ZONE,
  stockholmToUtc,
  utcToStockholmWallClock,
  formatStockholm,
} from "../../utils/timeZone";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = '"Aurel Städ & Allservice" <info@aurelservice.se>';
const ADMIN_EMAIL = "info@aurelservice.se";
const MAX_FIELD_LENGTH = 300;
const MAX_HOURS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

function getEventDuration(body) {
  const hours = parseFloat(body.estimatedHours || body.hours || 2);
  if (!Number.isFinite(hours)) return 2;
  return Math.min(MAX_HOURS, Math.max(1, hours));
}

// Trims, drops line breaks and caps the length of every free text field so a
// single form value cannot bloat an email, a calendar entry or a DB row.
function cleanField(value) {
  return singleLine(value).slice(0, MAX_FIELD_LENGTH);
}

function validate(body) {
  const errors = [];

  const cleaningType = cleanField(body.cleaningType);
  const name = cleanField(body.name);
  const email = cleanField(body.email);
  const phone = cleanField(body.phone);
  const address = cleanField(body.address);

  if (!cleaningType) errors.push("cleaningType");
  if (!name) errors.push("name");
  if (!email || !EMAIL_PATTERN.test(email)) errors.push("email");
  if (!phone) errors.push("phone");
  if (!address) errors.push("address");

  const startsAt = stockholmToUtc(body.dateTime);
  if (!startsAt) {
    errors.push("dateTime");
  } else if (startsAt.getTime() < Date.now()) {
    errors.push("dateTime-past");
  }

  const totalPrice = Number(body.totalPrice);
  const priceIsValid = Number.isFinite(totalPrice) && totalPrice >= 0;

  return {
    errors,
    data: {
      cleaningType,
      name,
      email,
      phone,
      address,
      startsAt,
      totalPrice: priceIsValid ? totalPrice : null,
      durationHours: getEventDuration(body),
    },
  };
}

/* ---------------------------------- email --------------------------------- */

const CELL = "padding: 10px 0; border-bottom: 1px solid #dee2e6;";
const LABEL = `${CELL} color: #6c757d;`;

// Every value passed here is escaped, so form input can never inject markup.
function row(label, value, { last = false, bold = false, href = null } = {}) {
  if (value === null || value === undefined || value === "") return "";
  const cellStyle = last ? "padding: 10px 0;" : CELL;
  const labelStyle = last ? "padding: 10px 0; color: #6c757d;" : LABEL;
  const safe = escapeHtml(value);
  const content = href
    ? `<a href="${escapeHtml(href)}" style="color: #34a783;">${safe}</a>`
    : safe;
  return `
              <tr>
                <td style="${labelStyle} width: 130px;">${escapeHtml(label)}</td>
                <td style="${cellStyle}${bold ? " font-weight: bold;" : ""}">${content}</td>
              </tr>`;
}

function shell(heading, inner, footer = "") {
  return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2d9070, #34a783); padding: 25px 30px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #fff; margin: 0; font-size: 22px;">${escapeHtml(heading)}</h2>
          </div>
          <div style="background: #f8f9fa; padding: 25px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e9ecef; border-top: none;">
            ${inner}
          </div>
          ${footer}
        </div>
      `;
}

function customerEmail(data, when) {
  const inner = `
            <p style="font-size: 16px;">Hej <strong>${escapeHtml(data.name)}</strong>,</p>
            <p>Vi har mottagit din bokning för <strong>${escapeHtml(data.cleaningType)}</strong>. Här är en sammanfattning:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">${row("Datum/tid", when)}${row("Adress", data.address)}
              <tr>
                <td style="padding: 10px 0; color: #6c757d;">Uppskattat pris</td>
                <td style="padding: 10px 0; font-weight: bold; font-size: 18px; color: #2d9070;">${escapeHtml(data.totalPrice ?? "-")} kr</td>
              </tr>
            </table>
            <p>Vi återkommer med en bekräftelse inom kort.</p>
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;" />
            <p style="margin: 0; font-size: 14px;">Med vänliga hälsningar,</p>
            <p style="margin: 5px 0 0; font-weight: bold;">Aurel Städ &amp; Allservice AB</p>
            <p style="margin: 3px 0; font-size: 13px; color: #6c757d;">Tel: 076-045 02 28 | info@aurelservice.se</p>`;
  return shell("Tack för din bokning!", inner);
}

// A failed database write must never be silent: the booking is real (it is in
// the calendar and in this mail) but it is missing from the records, and only
// this banner would tell anyone.
function adminEmail(data, extras, when, dbFailed) {
  const warning = dbFailed
    ? `<p style="background: #fff3cd; border: 1px solid #ffe08a; border-radius: 8px; padding: 12px 15px; margin: 0 0 20px; color: #664d03; font-size: 14px;">
                <strong>OBS:</strong> bokningen kunde inte sparas i databasen. Den finns i kalendern och i detta mejl, men saknas i bokningslistan. Kontrollera Supabase.
              </p>`
    : "";
  const inner = `${warning}
            <table style="width: 100%; border-collapse: collapse;">${row("Tjänst", data.cleaningType, { bold: true })}${row("Kund", data.name, { bold: true })}${row("E-post", data.email, { href: `mailto:${data.email}` })}${row("Telefon", data.phone, { href: `tel:${data.phone}` })}${row("Adress", data.address)}${row("Datum/tid", when)}${row("Yta", extras.area ? `${extras.area} m²` : "")}${row("Frekvens", extras.frequency)}${row("Beräknad tid", extras.estimatedHours ? `${extras.estimatedHours} timmar` : "")}${row("Tillval", extras.extras)}${row("Rum", extras.rooms)}${row("Enheter", extras.numberOfUnits)}
              <tr>
                <td style="padding: 12px 0; color: #6c757d; font-size: 16px;">Pris</td>
                <td style="padding: 12px 0; font-weight: bold; font-size: 20px; color: #2d9070;">${escapeHtml(data.totalPrice ?? "-")} kr</td>
              </tr>
            </table>`;
  const footer = `<p style="color: #adb5bd; font-size: 12px; text-align: center; margin-top: 15px;">Aurel Städ &amp; Allservice AB — info@aurelservice.se</p>`;
  return shell("Ny bokning mottagen", inner, footer);
}

/* --------------------------------- handler -------------------------------- */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { errors, data } = validate(req.body || {});
  if (errors.length > 0) {
    console.warn("Booking validation failed:", errors.join(", "));
    const message = errors.includes("dateTime-past")
      ? "Den valda tiden har redan passerat. Vänligen välj en annan tid."
      : "Vänligen fyll i alla uppgifter korrekt.";
    return res.status(400).json({ message });
  }

  const extras = {
    area: cleanField(req.body.area),
    frequency: cleanField(req.body.frequency),
    estimatedHours: cleanField(req.body.estimatedHours),
    extras: cleanField(req.body.extras),
    rooms: cleanField(req.body.rooms),
    numberOfUnits: cleanField(req.body.numberOfUnits),
  };

  const endsAt = new Date(data.startsAt.getTime() + data.durationHours * 3600000);
  const when = formatStockholm(data.startsAt);

  try {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    // 1. Check availability. Google returns any event whose end is after
    // timeMin and whose start is before timeMax, so partial overlaps count.
    const existingEvents = await calendar.events.list({
      calendarId,
      timeMin: data.startsAt.toISOString(),
      timeMax: endsAt.toISOString(),
      singleEvents: true,
      showDeleted: false,
    });

    const blocking = (existingEvents.data.items || []).filter(
      (item) => item.status !== "cancelled" && item.transparency !== "transparent"
    );

    if (blocking.length > 0) {
      return res.status(409).json({
        message: "Tyvärr är den valda tiden inte tillgänglig. Vänligen välj en annan tid.",
      });
    }

    // 2. Create Google Calendar event
    const eventDescription = [
      `Telefon: ${data.phone}`,
      `E-post: ${data.email}`,
      `Pris: ${data.totalPrice ?? "-"} kr`,
      extras.area ? `Yta: ${extras.area} m²` : null,
      extras.frequency ? `Frekvens: ${extras.frequency}` : null,
      extras.extras ? `Tillval: ${extras.extras}` : null,
      extras.rooms ? `Rum: ${extras.rooms}` : null,
      extras.numberOfUnits ? `Enheter: ${extras.numberOfUnits}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const event = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `${data.cleaningType} - ${data.name}`,
        location: data.address,
        description: eventDescription,
        start: {
          dateTime: utcToStockholmWallClock(data.startsAt),
          timeZone: TIME_ZONE,
        },
        end: {
          dateTime: utcToStockholmWallClock(endsAt),
          timeZone: TIME_ZONE,
        },
      },
    });

    const eventId = event.data.id;

    // 3. Store booking in Supabase
    const { error: dbError } = await supabase.from("bookings").insert({
      cleaning_type: data.cleaningType,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      date_time: data.startsAt.toISOString(),
      total_price: data.totalPrice,
      details: req.body,
      event_id: eventId,
    });

    if (dbError) {
      console.error("Supabase insert error:", dbError.message || dbError);
    }

    // 4. Send confirmation email to customer
    await transporter.sendMail({
      from: FROM,
      to: data.email,
      subject: `Bokningsbekräftelse - ${data.cleaningType}`,
      html: customerEmail(data, when),
    });

    // 5. Send notification email to admin
    await transporter.sendMail({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `Ny bokning - ${data.cleaningType} - ${data.name}`,
      html: adminEmail(data, extras, when, Boolean(dbError)),
    });

    res.status(200).json({ message: "Bokning skapad! Vi skickar en bekräftelse till din e-post." });
  } catch (error) {
    // Full detail stays in the server logs; the client only gets a safe message.
    const errData = error?.response?.data?.error || error?.response?.data || {};
    console.error("Booking error:", errData.code || error?.code || "unknown", errData.message || error?.message);
    console.error("Full error details:", JSON.stringify(errData, null, 2));
    res.status(500).json({
      message:
        "Något gick fel när bokningen skulle skapas. Vänligen försök igen eller ring oss på 076-045 02 28.",
    });
  }
}
