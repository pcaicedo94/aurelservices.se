import { escapeHtml, singleLine } from "./escapeHtml.js";
import { stockholmToUtc, stockholmDateParts, formatStockholm } from "./timeZone.js";
import { ANTI_SPAM_FIELDS } from "./antiSpam.js";

// Booking rules enforced by /api/booking. Plain constants and pure functions,
// so the PHP port can copy them one to one; the calculator pages apply the
// same values in the browser.

// Earliest start: the day after tomorrow at 07:00 Stockholm time, the same
// minimum the booking forms put on their date picker.
export const MIN_NOTICE_DAYS = 2;
export const MIN_NOTICE_TIME = "07:00";

// TODO(cliente Q13): confirm that bookings are Monday to Friday only.
export const BOOKABLE_WEEKDAYS = [1, 2, 3, 4, 5]; // 0 = Sunday ... 6 = Saturday

// TODO(cliente Q16): confirm the start window. A booking may start from 07:00
// up to, but not including, 17:00 (the forms reject hour >= 17).
export const FIRST_START_MINUTE = 7 * 60;
export const START_BEFORE_MINUTE = 17 * 60;

// TODO(cliente Q14): confirm the 2 hour billable minimum.
export const MIN_BILLABLE_HOURS = 2;
export const MAX_BOOKING_HOURS = 12;

export const MAX_FIELD_LENGTH = 300;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = "076-045 02 28";

// Trims, drops line breaks and caps the length of every free text field so a
// single form value cannot bloat an email, a calendar entry or a DB row.
export function cleanField(value) {
  return singleLine(value).slice(0, MAX_FIELD_LENGTH);
}

/* --------------------------------- values --------------------------------- */

// A bookable price is a positive number. null, "", 0, negatives and text such
// as "Offereras" mean the calculator could not price the job, and that calls
// for a quote, not a booking.
export function parsePrice(value) {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const price = Number(trimmed);
  return price > 0 ? price : null;
}

// Home cleaning sends `estimatedHours`, move cleaning `hours`, the other forms
// neither. Undefined when absent, NaN when present but not a number.
export function parseHours(body) {
  const raw = [body.estimatedHours, body.hours].find(
    (value) => value !== undefined && value !== null && String(value).trim() !== ""
  );
  if (raw === undefined) return undefined;
  const hours = typeof raw === "number" ? raw : Number(String(raw).trim());
  return Number.isFinite(hours) ? hours : NaN;
}

// Calendar event length. Forms that send no estimate get the billable minimum.
export function bookingDurationHours(hours) {
  if (hours === undefined || !Number.isFinite(hours)) return MIN_BILLABLE_HOURS;
  return Math.min(MAX_BOOKING_HOURS, Math.max(MIN_BILLABLE_HOURS, hours));
}

/* ---------------------------------- rules --------------------------------- */

export function earliestBookableStart(now = new Date()) {
  const { year, month, day } = stockholmDateParts(now);
  const target = new Date(Date.UTC(year, month - 1, day + MIN_NOTICE_DAYS));
  return stockholmToUtc(`${target.toISOString().slice(0, 10)}T${MIN_NOTICE_TIME}`);
}

// Violations of the calendar rules for a start instant, in Stockholm time.
export function checkSchedule(startsAt, now = new Date()) {
  const errors = [];

  if (startsAt.getTime() < now.getTime()) {
    errors.push("past");
  } else if (startsAt.getTime() < earliestBookableStart(now).getTime()) {
    errors.push("too-soon");
  }

  const { weekday, hour, minute } = stockholmDateParts(startsAt);
  if (!BOOKABLE_WEEKDAYS.includes(weekday)) errors.push("weekday");

  const startMinute = hour * 60 + minute;
  if (startMinute < FIRST_START_MINUTE || startMinute >= START_BEFORE_MINUTE) {
    errors.push("start-time");
  }

  return errors;
}

export function checkHours(hours) {
  if (hours === undefined) return [];
  if (Number.isNaN(hours)) return ["hours"];
  return hours < MIN_BILLABLE_HOURS ? ["min-hours"] : [];
}

export function validateBooking(body, now = new Date()) {
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
  if (startsAt) {
    errors.push(...checkSchedule(startsAt, now));
  } else {
    errors.push("dateTime");
  }

  const hours = parseHours(body);
  errors.push(...checkHours(hours));

  const totalPrice = parsePrice(body.totalPrice);
  if (totalPrice === null) errors.push("price");

  return {
    errors,
    data: {
      cleaningType,
      name,
      email,
      phone,
      address,
      startsAt,
      totalPrice,
      durationHours: bookingDurationHours(hours),
    },
  };
}

const FIELD_ERRORS = ["cleaningType", "name", "email", "phone", "address", "dateTime", "hours"];

// One message for the customer, most fundamental problem first.
export function bookingErrorMessage(errors, now = new Date()) {
  const has = (code) => errors.includes(code);

  if (FIELD_ERRORS.some(has)) return "Vänligen fyll i alla uppgifter korrekt.";
  if (has("past")) return "Den valda tiden har redan passerat. Vänligen välj en annan tid.";
  if (has("too-soon")) {
    return `Tidigast bokningsbara tid är ${formatStockholm(earliestBookableStart(now))}. Vänligen välj en senare tid.`;
  }
  if (has("weekday")) return "Vi tar emot bokningar måndag till fredag. Vänligen välj en vardag.";
  if (has("start-time")) return "Vänligen välj en starttid mellan 07:00 och 17:00.";
  if (has("min-hours")) {
    return `Minsta bokningstid är ${MIN_BILLABLE_HOURS} timmar. Kontakta oss om du vill ha hjälp med ett mindre uppdrag.`;
  }
  if (has("price")) {
    return `Vi kunde inte räkna fram ett pris för den här bokningen. Begär gärna en offert så återkommer vi med ett pris, eller ring oss på ${PHONE}.`;
  }
  return "Vänligen fyll i alla uppgifter korrekt.";
}

/* --------------------------------- details -------------------------------- */

const CONTACT_PREFERENCES = { call: "Bli uppringd", visit: "Få ett hembesök" };

// What the booking forms send beyond the core fields, with the label shown in
// the admin mail and the calendar event, in display order (QA-06).
export const BOOKING_DETAIL_FIELDS = [
  { key: "contactPreference", label: "Kontaktmetod", format: (v) => CONTACT_PREFERENCES[v] || v },
  { key: "area", label: "Yta", format: (v) => `${v} m²` },
  { key: "rooms", label: "Rum" },
  { key: "numberOfUnits", label: "Enheter" },
  { key: "frequency", label: "Frekvens" },
  { key: "estimatedHours", label: "Beräknad tid", format: (v) => `${v} timmar` },
  { key: "hours", label: "Beräknad tid", format: (v) => `${v} timmar` },
  { key: "extras", label: "Tillval" },
  { key: "addOns", label: "Tillägg" },
  { key: "basePrice", label: "Grundpris", format: (v) => `${v} kr` },
  { key: "hourlyRate", label: "Timpris", format: (v) => `${v} kr/tim` },
  { key: "pricePerUnit", label: "Pris per enhet", format: (v) => `${v} kr` },
];

// Rendered on their own, so they are not repeated as details.
const CORE_FIELDS = ["cleaningType", "name", "email", "phone", "address", "dateTime", "totalPrice"];
// Form plumbing (honeypot, fill time, Turnstile token) that means nothing to
// the office and is not stored.
export const IGNORED_FIELDS = ANTI_SPAM_FIELDS;
const MAX_EXTRA_FIELDS = 10;
const MAX_RECORD_FIELDS = 40;

function textOf(value) {
  if (typeof value === "string" || typeof value === "number") return cleanField(value);
  if (typeof value === "boolean") return value ? "Ja" : "";
  if (Array.isArray(value)) {
    return cleanField(value.filter((v) => typeof v === "string" || typeof v === "number").join(", "));
  }
  return "";
}

// [label, value] rows for every detail the form sent. Known fields get their
// Swedish label; a field a form adds later still shows up under its own key
// instead of being dropped. Values are plain text: escape them when rendering.
export function collectBookingDetails(body) {
  const rows = [];
  const known = new Set(BOOKING_DETAIL_FIELDS.map((field) => field.key));

  for (const { key, label, format } of BOOKING_DETAIL_FIELDS) {
    const value = textOf(body[key]);
    if (value) rows.push([label, format ? format(value) : value]);
  }

  const skipped = new Set([...known, ...CORE_FIELDS, ...IGNORED_FIELDS]);
  const others = Object.keys(body)
    .filter((key) => !skipped.has(key))
    .slice(0, MAX_EXTRA_FIELDS);
  for (const key of others) {
    const value = textOf(body[key]);
    if (value) rows.push([cleanField(key), value]);
  }

  return rows;
}

// The `details` column: every field the form sent, cleaned, under its own key
// (numbers stay numbers), instead of the raw request body.
export function bookingDetailsRecord(body) {
  const record = {};
  const ignored = new Set(IGNORED_FIELDS);
  for (const key of Object.keys(body).filter((k) => !ignored.has(k)).slice(0, MAX_RECORD_FIELDS)) {
    const value = body[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      record[cleanField(key)] = value;
    } else {
      const text = textOf(value);
      if (text) record[cleanField(key)] = text;
    }
  }
  return record;
}

// Calendar descriptions may contain HTML, so every value is escaped.
export function bookingEventDescription(data, details) {
  return [
    ["Telefon", data.phone],
    ["E-post", data.email],
    ["Pris", `${data.totalPrice} kr`],
    ...details,
  ]
    .map(([label, value]) => `${escapeHtml(label)}: ${escapeHtml(value)}`)
    .join("\n");
}
