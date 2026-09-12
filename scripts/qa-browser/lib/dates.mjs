// Booking dates as wall-clock strings for <input type="datetime-local">,
// computed for Europe/Stockholm. Calendar math runs on UTC midnights so a DST
// switch can never move a date by one day.

const TZ = "Europe/Stockholm";
const DAY_MS = 86400000;

const pad = (n) => String(n).padStart(2, "0");
const utcDate = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const addDays = (date, n) => new Date(date.getTime() + n * DAY_MS);

export function stockholmToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return utcDate(get("year"), get("month"), get("day"));
}

// Anonymous Gregorian algorithm (Meeus/Jones/Butcher).
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utcDate(year, month, day);
}

// Weekday public holidays and the eves businesses treat as holidays. A
// "valid" test date must avoid them, or a future holiday rule would turn a
// control test red for the wrong reason.
export function isSwedishHoliday(date) {
  const y = date.getUTCFullYear();
  const md = `${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  if (["01-01", "01-06", "05-01", "06-06", "12-24", "12-25", "12-26", "12-31"].includes(md)) return true;
  const easter = easterSunday(y);
  const movable = [-2, 1, 39].map((n) => addDays(easter, n).getTime());
  if (movable.includes(date.getTime())) return true;
  // Midsummer Eve: the Friday between 19 and 25 June.
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  if (month === 6 && date.getUTCDay() === 5 && day >= 19 && day <= 25) return true;
  return false;
}

export const toLocalInput = (date, hour = 10, minute = 0) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(hour)}:${pad(minute)}`;

function findDate(start, step, weekday, skipHolidays) {
  for (let i = 0; i < 60; i++) {
    const candidate = addDays(start, i * step);
    if (candidate.getUTCDay() !== weekday) continue;
    if (skipHolidays && isSwedishHoliday(candidate)) continue;
    return candidate;
  }
  throw new Error("No se encontró una fecha adecuada");
}

export function bookingDates(now = new Date()) {
  const today = stockholmToday(now);
  // Seven days ahead keeps every date clear of any lead-time rule.
  const ahead = addDays(today, 7);
  const wednesday = findDate(ahead, 1, 3, true);
  const thursday = findDate(ahead, 1, 4, true);
  const saturday = findDate(ahead, 1, 6, false);
  const sunday = findDate(ahead, 1, 0, false);
  // A past weekday, so "in the past" is the only thing wrong with it.
  const pastWednesday = findDate(addDays(today, -35), -1, 3, true);
  return {
    weekday: toLocalInput(wednesday),
    weekdayAlt: toLocalInput(thursday),
    saturday: toLocalInput(saturday),
    sunday: toLocalInput(sunday),
    past: toLocalInput(pastWednesday),
  };
}
