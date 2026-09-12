// Swedish display formatting for the booking calculators. Prices are shown in
// whole kronor ("1 234 kr") and dates in words ("måndag 14 september 2026 kl. 10:00"),
// never as raw numbers with a decimal point or as ISO strings.

const LOCALE = "sv-SE";

export const NOT_SET = "Ej angiven";
export const NO_PRICE = "–";

const kronorFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });

// The wall clock is rebuilt as a UTC date and formatted in UTC, so the weekday
// and date never shift with the visitor's (or the server's) time zone.
const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

// Rounds to whole kronor; used for both the summary and the booking payload so
// the customer is never sent a different figure than the one on screen.
export function roundKronor(amount) {
  return isNumber(amount) ? Math.round(amount) : null;
}

export function formatPrice(amount) {
  return isNumber(amount) ? `${kronorFormatter.format(Math.round(amount))} kr` : NO_PRICE;
}

export function formatNumber(value) {
  return isNumber(value) ? decimalFormatter.format(value) : "";
}

export function formatHours(hours) {
  if (!isNumber(hours)) return NO_PRICE;
  return `${decimalFormatter.format(hours)} ${hours === 1 ? "timme" : "timmar"}`;
}

export function formatArea(area) {
  return isNumber(area) ? `${decimalFormatter.format(area)} m²` : "";
}

// "2026-09-14T10:00" -> "måndag 14 september 2026 kl. 10:00"
export function formatDateTime(wallClock) {
  const match = WALL_CLOCK.exec(String(wallClock || ""));
  if (!match) return "";
  const [, year, month, day, hour, minute] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(date.getTime())) return "";
  return `${dateFormatter.format(date)} kl. ${hour}:${minute}`;
}

// Summary line for a size parsed with parseArea().
export function describeArea(result) {
  if (result.status === "empty") return NOT_SET;
  if (result.status === "invalid") return "Ogiltig storlek";
  return formatArea(result.value);
}

// Summary line for the date returned by useBookingDate().
export function describeDate(date) {
  if (date.check.status === "empty") return NOT_SET;
  return date.isValid ? formatDateTime(date.dateTime) : "Ej bokningsbar tid";
}

// ["storlek", "frekvens", "datum"] -> "storlek, frekvens och datum"
export function joinSwedish(items) {
  const list = items.filter(Boolean);
  if (list.length <= 1) return list.join("");
  return `${list.slice(0, -1).join(", ")} och ${list[list.length - 1]}`;
}
