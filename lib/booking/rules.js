// Booking rules shared by the calculator pages: which dates, times and values
// can be booked online. Rules marked TODO(cliente Qnn) are provisional until
// the client answers the open question with that number.
import { formatDateTime, joinSwedish } from "./format";

// TODO(cliente Q16): confirm the service window. As before, a booking may start
// from 07:00 up to, but not including, 17:00.
export const FIRST_START_HOUR = 7;
export const LAST_START_HOUR = 17;

// Earliest online booking: two days ahead at the first start hour.
export const LEAD_DAYS = 2;

// TODO(cliente Q14): minimum billable time for services priced per hour
// (hemstädning, kontorsstädning). The page text already promises it.
export const MIN_BILLABLE_HOURS = 2;

// A size above this is not an ordinary home or office, so it is quoted instead
// of priced online.
export const MAX_ONLINE_AREA = 1000;

// Shown in the contact form when the calculator has switched to a quote.
export const QUOTE_ONLY_HINT = "Priset behöver offereras – använd ”Begär offert” i summeringen.";

const pad = (n) => String(n).padStart(2, "0");

// Naive local wall clock, the same shape a datetime-local input produces.
export function earliestBookable(now = new Date()) {
  const d = new Date(now.getTime());
  d.setDate(d.getDate() + LEAD_DAYS);
  d.setHours(FIRST_START_HOUR, 0, 0, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d{1,3})?)?$/;

export function parseWallClock(value) {
  const match = WALL_CLOCK.exec(String(value || "").trim());
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1, 6).map(Number);
  // Calendar arithmetic in UTC: the weekday of a date does not depend on the
  // visitor's time zone.
  const calendarDay = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarDay.getUTCMonth() !== month - 1 ||
    calendarDay.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }
  return {
    year,
    month,
    day,
    hour,
    minute,
    weekday: calendarDay.getUTCDay(),
    key: `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`,
  };
}

// Returns { status, message }. Only status "ok" can be booked.
export function checkDateTime(value, earliest = earliestBookable()) {
  if (!value) return { status: "empty" };

  const parts = parseWallClock(value);
  if (!parts) {
    return { status: "invalid", message: "Ange ett giltigt datum och en giltig tid." };
  }

  // Same-format wall clocks compare correctly as strings. This also rejects
  // any date in the past.
  if (earliest && parts.key < earliest) {
    return {
      status: "tooSoon",
      message: `Välj en tid från och med ${formatDateTime(earliest)}. Vi behöver minst två dagars framförhållning.`,
    };
  }

  // TODO(cliente Q13): the 2026 price list has no weekend rate, so weekends are
  // not bookable online (they used to be priced at 0 kr).
  if (parts.weekday === 0 || parts.weekday === 6) {
    return { status: "weekend", message: "Helgbokning? Kontakta oss" };
  }

  if (parts.hour < FIRST_START_HOUR || parts.hour >= LAST_START_HOUR) {
    return { status: "hours", message: "Välj en starttid mellan 07:00 och 17:00." };
  }

  return { status: "ok", parts };
}

// Size in m²: at least 1, numbers only; above `max` it goes to a quote.
export function parseArea(raw, { max = MAX_ONLINE_AREA } = {}) {
  const text = String(raw ?? "").trim();
  if (!text) return { status: "empty" };

  const value = Number(text.replace(",", "."));
  if (!Number.isFinite(value)) {
    return { status: "invalid", message: "Ange storleken som ett tal i kvadratmeter." };
  }
  if (value < 1) {
    return { status: "invalid", message: "Storleken måste vara minst 1 m²." };
  }
  if (value > max) {
    return { status: "quote", value };
  }
  return { status: "ok", value };
}

// Whole numbers within a range (walls, site huts). An empty field can stand for
// a default value, e.g. zero walls.
export function parseCount(raw, { min = 0, max = Infinity, emptyValue = null } = {}) {
  const text = String(raw ?? "").trim();
  if (!text) {
    return emptyValue === null ? { status: "empty" } : { status: "ok", value: emptyValue };
  }
  const value = Number(text);
  if (!Number.isInteger(value) || value < min || value > max) {
    return { status: "invalid" };
  }
  return { status: "ok", value };
}

export function billableHours(hours) {
  return Math.max(MIN_BILLABLE_HOURS, hours);
}

// Explains why the booking button is disabled. Takes [{ label, status }] in
// the order the fields appear: empty fields are listed first, then the ones
// holding a value that cannot be booked.
export function bookingHint(fields) {
  const missing = fields.filter((f) => f.status === "empty").map((f) => f.label);
  if (missing.length) return `Fyll i ${joinSwedish(missing)}.`;

  const invalid = fields.filter((f) => f.status !== "ok").map((f) => f.label);
  if (invalid.length) return `Kontrollera ${joinSwedish(invalid)}.`;

  return "";
}
