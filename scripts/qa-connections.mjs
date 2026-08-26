/**
 * QA: verifies the three external dependencies of the booking system.
 * Read only — it does not send mail, create events or write rows.
 *
 *   node --env-file=.env scripts/qa-connections.mjs
 */
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const results = [];

function report(name, ok, detail) {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

/* ------------------------------- 1. SMTP -------------------------------- */
async function checkSmtp() {
  const missing = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"].filter(
    (key) => !process.env[key]
  );
  if (missing.length) return report("SMTP env vars", false, `saknas: ${missing.join(", ")}`);
  report("SMTP env vars", true, `${process.env.SMTP_HOST}:${process.env.SMTP_PORT} as ${process.env.SMTP_USER}`);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await transporter.verify();
    report("SMTP connection + auth (Simply)", true, "server accepts credentials");
  } catch (error) {
    return report("SMTP connection + auth (Simply)", false, error.message);
  }

  // --send=<address> proves delivery was actually accepted, not just that the
  // connection works: Simply's queue id comes back in the SMTP response.
  const to = process.argv.find((a) => a.startsWith("--send="))?.split("=")[1];
  if (!to) return;

  try {
    const info = await transporter.sendMail({
      from: '"Aurel Städ & Allservice" <info@aurelservice.se>',
      to,
      subject: "QA — testmejl från bokningssystemet",
      text: "Detta är ett testmejl som bekräftar att utskick via Simply SMTP fungerar. Ingen åtgärd krävs.",
    });
    report("SMTP testutskick accepterat", info.accepted?.includes(to), `svar: ${info.response}`);
    console.log(`      messageId: ${info.messageId}`);
    if (info.rejected?.length) console.log(`      AVVISADE: ${info.rejected.join(", ")}`);
  } catch (error) {
    report("SMTP testutskick accepterat", false, error.message);
  }
}

/* --------------------------- 2. Google Calendar -------------------------- */
async function checkCalendar() {
  const missing = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REFRESH_TOKEN",
    "GOOGLE_CALENDAR_ID",
  ].filter((key) => !process.env[key]);
  if (missing.length) return report("Calendar env vars", false, `saknas: ${missing.join(", ")}`);
  report("Calendar env vars", true, `calendar id: ${process.env.GOOGLE_CALENDAR_ID}`);

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  const calendar = google.calendar({ version: "v3", auth });

  try {
    const { token } = await auth.getAccessToken();
    report("Google OAuth refresh token", Boolean(token), token ? "access token issued" : "no token");
  } catch (error) {
    return report("Google OAuth refresh token", false, error.message);
  }

  try {
    const { data } = await calendar.calendars.get({ calendarId: process.env.GOOGLE_CALENDAR_ID });
    report("Calendar reachable", true, `"${data.summary}" (tz ${data.timeZone})`);
    if (data.timeZone !== "Europe/Stockholm") {
      console.log(`      OBS: kalenderns tidszon är ${data.timeZone}, inte Europe/Stockholm.`);
    }
  } catch (error) {
    return report("Calendar reachable", false, error?.response?.data?.error?.message || error.message);
  }

  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 86400000);
    const { data } = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: in30Days.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 10,
    });
    const items = data.items || [];
    report("Calendar events.list (write scope check)", true, `${items.length} bokningar kommande 30 dagar`);
    for (const item of items.slice(0, 5)) {
      console.log(`      · ${item.start?.dateTime || item.start?.date}  ${item.summary}`);
    }
  } catch (error) {
    report("Calendar events.list", false, error?.response?.data?.error?.message || error.message);
  }
}

/* ------------------------------ 3. Supabase ------------------------------ */
async function checkSupabase() {
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter(
    (key) => !process.env[key]
  );
  if (missing.length) return report("Supabase env vars", false, `saknas: ${missing.join(", ")}`);
  report("Supabase env vars", true, process.env.NEXT_PUBLIC_SUPABASE_URL);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error, count } = await supabase
    .from("bookings")
    .select("id, cleaning_type, name, date_time, event_id", { count: "exact" })
    .order("id", { ascending: false })
    .limit(5);

  if (error) return report("Supabase table `bookings`", false, error.message);
  report("Supabase table `bookings`", true, `${count} rader totalt`);
  for (const row of data || []) {
    console.log(`      · #${row.id} ${row.date_time} ${row.cleaning_type} — ${row.name}`);
  }
}

console.log("=== QA: externa beroenden ===\n");
await checkSmtp();
console.log("");
await checkCalendar();
console.log("");
await checkSupabase();

const failed = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} OK ===`);
if (failed.length) {
  console.log(failed.map((r) => `  FAIL: ${r.name}`).join("\n"));
  process.exit(1);
}
