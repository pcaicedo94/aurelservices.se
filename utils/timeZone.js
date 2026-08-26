export const TIME_ZONE = "Europe/Stockholm";

function partsOf(date, options) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    ...options,
  });
  const parts = {};
  for (const part of formatter.formatToParts(date)) {
    parts[part.type] = part.value;
  }
  return parts;
}

// Minutes that Europe/Stockholm is ahead of UTC at the given instant.
function offsetMinutes(date) {
  const parts = partsOf(date);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUtc - date.getTime()) / 60000;
}

// Turns a naive wall clock string ("2026-09-01T10:00") that the booking form
// produces into the real UTC instant it represents in Europe/Stockholm.
// Without this the server (UTC) would read the string as its own local time
// and check availability for a different window than the one it books.
export function stockholmToUtc(wallClock) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    String(wallClock || "").trim()
  );
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match.map(Number);
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute, second || 0);

  // Two passes settle the DST boundary cases.
  let timestamp = naiveUtc;
  for (let i = 0; i < 2; i += 1) {
    timestamp = naiveUtc - offsetMinutes(new Date(timestamp)) * 60000;
  }

  const result = new Date(timestamp);
  return Number.isNaN(result.getTime()) ? null : result;
}

// Formats an instant back into the naive wall clock string Google Calendar
// expects alongside `timeZone: Europe/Stockholm`.
export function utcToStockholmWallClock(date) {
  const parts = partsOf(date);
  const hour = String(Number(parts.hour) % 24).padStart(2, "0");
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}`;
}

// Human readable Swedish date/time for emails, always in Stockholm time.
export function formatStockholm(date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIME_ZONE,
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}
