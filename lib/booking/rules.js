// Booking rules shared by the calculator pages.
import { joinSwedish } from "./format";

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
