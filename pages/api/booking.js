// Booking endpoint: enforces the booking rules, reserves the calendar slot,
// stores the booking in Supabase and mails the customer and the office.
// Anti-spam (honeypot, fill time, per-IP limit) runs first: utils/antiSpam.js.
//
// Test mode: with APP_TEST_MODE=1 nothing is sent, created or stored. Mail is
// rendered by nodemailer's jsonTransport, calendar writes and Supabase inserts
// are simulated, and only the availability check reads the real calendar.
// `x-test-scenario: conflict|race|calendar-error|mail-error` forces a path.
// See utils/testMode.js.
import { escapeHtml } from "../../utils/escapeHtml";
import { FROM, ADMIN_EMAIL, FOOTER, SIGNATURE, row, shell } from "../../utils/emailLayout";
import { TIME_ZONE, utcToStockholmWallClock, formatStockholm } from "../../utils/timeZone";
import { startTestTrace, respond } from "../../utils/testMode";
import { createMailer } from "../../utils/mailer";
import { createCalendarGateway, createBookingStore } from "../../utils/bookingServices";
import {
  validateBooking,
  bookingErrorMessage,
  collectBookingDetails,
  bookingDetailsRecord,
  bookingEventDescription,
} from "../../utils/bookingRules";
import { reserveSlot } from "../../utils/reserveSlot";
import {
  screenSubmission,
  createRateLimiter,
  rateLimitKey,
  RATE_LIMIT,
  GENERIC_REJECTION_MESSAGE,
  RATE_LIMIT_MESSAGE,
} from "../../utils/antiSpam";

const SLOT_TAKEN_MESSAGE = "Tyvärr är den valda tiden inte tillgänglig. Vänligen välj en annan tid.";
const SUCCESS_MESSAGE = "Bokning skapad! Vi skickar en bekräftelse till din e-post.";

// 5 bookings per 10 minutes per IP. Kept in memory, so on serverless hosting
// it is per instance; the PHP version keeps the counters in the database.
const limiter = createRateLimiter(RATE_LIMIT);

/* ---------------------------------- email --------------------------------- */

function customerEmail(data, when) {
  const inner = `
            <p style="font-size: 16px;">Hej <strong>${escapeHtml(data.name)}</strong>,</p>
            <p>Vi har mottagit din bokning för <strong>${escapeHtml(data.cleaningType)}</strong>. Här är en sammanfattning:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">${row("Datum/tid", when)}${row("Adress", data.address)}
              <tr>
                <td style="padding: 10px 0; color: #6c757d;">Uppskattat pris</td>
                <td style="padding: 10px 0; font-weight: bold; font-size: 18px; color: #2d9070;">${escapeHtml(data.totalPrice)} kr</td>
              </tr>
            </table>
            <p>Vi återkommer med en bekräftelse inom kort.</p>
            ${SIGNATURE}`;
  return shell("Tack för din bokning!", inner);
}

// A failed database write must never be silent: the booking is real (it is in
// the calendar and in this mail) but it is missing from the records, and only
// this banner would tell anyone.
function adminEmail(data, details, when, dbFailed) {
  const warning = dbFailed
    ? `<p style="background: #fff3cd; border: 1px solid #ffe08a; border-radius: 8px; padding: 12px 15px; margin: 0 0 20px; color: #664d03; font-size: 14px;">
                <strong>OBS:</strong> bokningen kunde inte sparas i databasen. Den finns i kalendern och i detta mejl, men saknas i bokningslistan. Kontrollera Supabase.
              </p>`
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
  const inner = `${warning}
            <table style="width: 100%; border-collapse: collapse;">${rows}
              <tr>
                <td style="padding: 12px 0; color: #6c757d; font-size: 16px;">Pris</td>
                <td style="padding: 12px 0; font-weight: bold; font-size: 20px; color: #2d9070;">${escapeHtml(data.totalPrice)} kr</td>
              </tr>
            </table>`;
  return shell("Ny bokning mottagen", inner, FOOTER);
}

/* --------------------------------- handler -------------------------------- */

export default async function handler(req, res) {
  // Null unless APP_TEST_MODE=1; then every side effect below is simulated.
  const trace = startTestTrace(req);
  const reply = (status, body) => respond(res, status, body, trace);

  if (req.method !== "POST") {
    return reply(405, { message: "Method not allowed" });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};

  // Honeypot, fill time and, when configured, Turnstile.
  const screening = await screenSubmission(req, body, { testMode: Boolean(trace) });
  if (screening) {
    console.warn("Booking rejected as spam:", screening.reason);
    if (trace) trace.spam = screening.reason;
    // A filled honeypot gets the normal answer, so the bot learns nothing.
    return screening.status === 200
      ? reply(200, { message: SUCCESS_MESSAGE })
      : reply(400, { message: GENERIC_REJECTION_MESSAGE });
  }

  // Required fields, a real price, weekday, start window, notice and minimum
  // hours: see utils/bookingRules.js.
  const { errors, data } = validateBooking(body);
  if (errors.length > 0) {
    console.warn("Booking validation failed:", errors.join(", "));
    return reply(400, { message: bookingErrorMessage(errors) });
  }

  // Only well-formed bookings count: they are the ones that reach the
  // calendar and send mail.
  const limit = limiter.hit(rateLimitKey(req, { testMode: Boolean(trace) }));
  if (!limit.allowed) {
    console.warn("Booking rate limited");
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return reply(429, { message: RATE_LIMIT_MESSAGE });
  }

  const details = collectBookingDetails(body);
  const endsAt = new Date(data.startsAt.getTime() + data.durationHours * 3600000);
  const when = formatStockholm(data.startsAt);

  try {
    const calendar = createCalendarGateway({ trace });
    const store = createBookingStore({ trace });
    const mailer = createMailer({ trace });

    // 1. Reserve the slot: availability check, insert, and a second look that
    // removes our event again if a concurrent booking was created first.
    const reservation = await reserveSlot(calendar, {
      window: { timeMin: data.startsAt.toISOString(), timeMax: endsAt.toISOString() },
      event: {
        summary: `${data.cleaningType} - ${data.name}`,
        location: data.address,
        description: bookingEventDescription(data, details),
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

    if (!reservation.reserved) {
      if (reservation.reason === "race") {
        console.warn(
          "Booking lost a race for its slot and was withdrawn:",
          reservation.eventId,
          "older event:",
          reservation.conflictId
        );
      }
      return reply(409, { message: SLOT_TAKEN_MESSAGE });
    }

    // 2. Store booking in Supabase
    const { error: dbError } = await store.insert({
      cleaning_type: data.cleaningType,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      date_time: data.startsAt.toISOString(),
      total_price: data.totalPrice,
      details: bookingDetailsRecord(body),
      event_id: reservation.event.id,
    });

    if (dbError) {
      console.error("Supabase insert error:", dbError.message || dbError);
    }

    // 3. Send confirmation email to customer
    await mailer.send({
      from: FROM,
      to: data.email,
      subject: `Bokningsbekräftelse - ${data.cleaningType}`,
      html: customerEmail(data, when),
    });

    // 4. Send notification email to admin
    await mailer.send({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `Ny bokning - ${data.cleaningType} - ${data.name}`,
      html: adminEmail(data, details, when, Boolean(dbError)),
    });

    return reply(200, { message: SUCCESS_MESSAGE });
  } catch (error) {
    // Full detail stays in the server logs; the client only gets a safe message.
    const errData = error?.response?.data?.error || error?.response?.data || {};
    console.error("Booking error:", errData.code || error?.code || "unknown", errData.message || error?.message);
    console.error("Full error details:", JSON.stringify(errData, null, 2));
    return reply(500, {
      message:
        "Något gick fel när bokningen skulle skapas. Vänligen försök igen eller ring oss på 076-045 02 28.",
    });
  }
}
