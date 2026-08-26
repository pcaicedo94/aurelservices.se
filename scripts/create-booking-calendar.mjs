/**
 * Creates the dedicated Google Calendar that customer bookings land in, so
 * they no longer mix with the OAuth account's personal calendar (where private
 * meetings would also block customer time slots).
 *
 *   node --env-file=.env scripts/create-booking-calendar.mjs
 *
 * Prints the new calendar id — copy it into GOOGLE_CALENDAR_ID in .env.
 * Re-running is safe: an existing calendar with the same name is reused.
 */
import { google } from "googleapis";

const CALENDAR_NAME = "Aurel Städ – Bokningar";

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const calendar = google.calendar({ version: "v3", auth });

const { data: list } = await calendar.calendarList.list();
const existing = (list.items || []).find((c) => c.summary === CALENDAR_NAME);

if (existing) {
  console.log(`Kalendern finns redan: ${existing.id} (tz ${existing.timeZone})`);
} else {
  const { data: created } = await calendar.calendars.insert({
    requestBody: {
      summary: CALENDAR_NAME,
      description: "Bokningar från aurelservice.se. Skapas automatiskt av /api/booking.",
      timeZone: "Europe/Stockholm",
    },
  });
  console.log(`Skapad: ${created.id} (tz ${created.timeZone})`);
  console.log("\nSätt i .env:");
  console.log(`GOOGLE_CALENDAR_ID=${created.id}`);
}
