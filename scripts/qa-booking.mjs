/**
 * QA: end to end test of /api/booking against a running server.
 *
 *   node --env-file=.env scripts/qa-booking.mjs                  # safe tests only (no writes)
 *   node --env-file=.env scripts/qa-booking.mjs --live --email=du@example.com
 *
 * Safe mode only exercises the rejection paths (405 / 400) — nothing is
 * created and no mail is sent. --live additionally books a real slot, checks
 * that it lands in Google Calendar at the right instant, that a repeat booking
 * is rejected with 409, that a Supabase row was written, and then deletes
 * everything it created. --live DOES send real mail to the customer address
 * given and to info@aurelservice.se.
 */
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { stockholmToUtc, utcToStockholmWallClock } from "../utils/timeZone.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v === undefined ? true : v];
  })
);

const BASE_URL = args.url || "http://localhost:3000";
const LIVE = Boolean(args.live);
const CUSTOMER_EMAIL = args.email || "";
const ENDPOINT = `${BASE_URL}/api/booking`;

let passed = 0;
const failures = [];
const createdEventIds = [];
const createdBookingIds = [];

function check(name, ok, detail) {
  if (ok) {
    passed += 1;
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failures.push(name);
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
  return ok;
}

async function post(body) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, body: json };
}

function calendarClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: "v3", auth });
}

/** Finds a free weekday slot 07:00-17:00, at least `daysAhead` days out. */
async function findFreeSlot(calendar, hours, daysAhead = 6) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  for (let day = daysAhead; day < daysAhead + 30; day += 1) {
    for (const hour of [7, 8, 9, 10, 11, 12, 13]) {
      const probe = new Date(Date.now() + day * 86400000);
      const wallClock = `${probe.getFullYear()}-${String(probe.getMonth() + 1).padStart(2, "0")}-${String(
        probe.getDate()
      ).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00`;
      const startsAt = stockholmToUtc(wallClock);
      const endsAt = new Date(startsAt.getTime() + hours * 3600000);
      const { data } = await calendar.events.list({
        calendarId,
        timeMin: startsAt.toISOString(),
        timeMax: endsAt.toISOString(),
        singleEvents: true,
        showDeleted: false,
      });
      const busy = (data.items || []).filter(
        (i) => i.status !== "cancelled" && i.transparency !== "transparent"
      );
      if (busy.length === 0) return { wallClock, startsAt, endsAt };
    }
  }
  return null;
}

function baseBooking(overrides = {}) {
  return {
    cleaningType: "QA Flyttstädning",
    name: "QA Testkund",
    email: CUSTOMER_EMAIL,
    phone: "070-000 00 00",
    address: "Testgatan 1, 111 11 Stockholm",
    dateTime: "2099-01-01T10:00",
    totalPrice: 3950,
    area: "75",
    estimatedHours: "3",
    extras: "Kyl/frys, Diskmaskin",
    ...overrides,
  };
}

/* ------------------------------ safe tests ------------------------------- */

async function runSafeTests() {
  console.log("=== Avvisningar (inga skrivningar) ===");

  try {
    const res = await fetch(ENDPOINT, { method: "GET" });
    check("GET avvisas med 405", res.status === 405, `status ${res.status}`);
  } catch (error) {
    check("Servern svarar", false, `${error.message} — kör 'npm run dev' först`);
    return false;
  }

  const empty = await post({});
  check("Tom body avvisas med 400", empty.status === 400, `status ${empty.status}: ${empty.body?.message}`);

  const badEmail = await post(baseBooking({ email: "inte-en-epost" }));
  check("Ogiltig e-post avvisas med 400", badEmail.status === 400, `status ${badEmail.status}`);

  const noName = await post(baseBooking({ name: "   ", email: "qa@example.com" }));
  check("Saknat namn avvisas med 400", noName.status === 400, `status ${noName.status}`);

  const past = await post(baseBooking({ dateTime: "2020-01-01T10:00", email: "qa@example.com" }));
  check(
    "Datum i det förflutna avvisas med 400",
    past.status === 400 && /passerat/i.test(past.body?.message || ""),
    `status ${past.status}: ${past.body?.message}`
  );

  const badDate = await post(baseBooking({ dateTime: "imorgon typ", email: "qa@example.com" }));
  check("Ogiltigt datumformat avvisas med 400", badDate.status === 400, `status ${badDate.status}`);

  // The 500 handler must not leak Google/SMTP internals to the browser.
  const leaky = [empty, badEmail, past].some((r) =>
    /invalid_grant|ECONN|nodemailer|googleapis|at Object\./i.test(JSON.stringify(r.body || {}))
  );
  check("Felmeddelanden läcker inga interna detaljer", !leaky);

  return true;
}

/* ------------------------------ live tests ------------------------------- */

async function runLiveTests() {
  console.log("\n=== Live-bokning (skickar riktig e-post, skapar riktig kalenderhändelse) ===");
  const calendar = calendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  const slot = await findFreeSlot(calendar, 3);
  if (!check("Hittade en ledig tid i kalendern", Boolean(slot))) return;
  console.log(`      slot: ${slot.wallClock} (Europe/Stockholm) = ${slot.startsAt.toISOString()}`);

  // 1. Book it — with an XSS payload in the name to prove escaping end to end.
  const payloadName = 'QA <script>alert("xss")</script> Testkund';
  const booking = baseBooking({ dateTime: slot.wallClock, name: payloadName });
  const created = await post(booking);
  if (!check("Bokning skapas (200)", created.status === 200, `status ${created.status}: ${created.body?.message}`)) {
    console.log(`      svar: ${JSON.stringify(created.body)}`);
    return;
  }

  // 2. Event must exist in Google Calendar at exactly the requested instant.
  const { data: listed } = await calendar.events.list({
    calendarId,
    timeMin: slot.startsAt.toISOString(),
    timeMax: slot.endsAt.toISOString(),
    singleEvents: true,
    showDeleted: false,
  });
  const event = (listed.items || []).find((i) => (i.summary || "").includes("QA"));
  if (check("Händelsen finns i Google Calendar", Boolean(event), event?.summary)) {
    createdEventIds.push(event.id);
    const actualStart = new Date(event.start.dateTime).toISOString();
    check(
      "Starttid matchar vald tid (ingen tidszonsförskjutning)",
      actualStart === slot.startsAt.toISOString(),
      `kalender ${actualStart} vs begärt ${slot.startsAt.toISOString()}`
    );
    check(
      "Sluttid = start + 3 h",
      new Date(event.end.dateTime).toISOString() === slot.endsAt.toISOString(),
      `${event.end.dateTime}`
    );
    check("Tidszon är Europe/Stockholm", event.start.timeZone === "Europe/Stockholm", event.start.timeZone);
    check("Adress ligger i location", event.location === booking.address, event.location);
    check("Telefon finns i beskrivningen", (event.description || "").includes(booking.phone));
    check("Pris finns i beskrivningen", (event.description || "").includes(String(booking.totalPrice)));
    check(
      "Bokningen syns i kalendern på rätt lokal tid",
      utcToStockholmWallClock(new Date(event.start.dateTime)).startsWith(slot.wallClock),
      utcToStockholmWallClock(new Date(event.start.dateTime))
    );
  }

  // 3. Same slot again must be refused.
  const duplicate = await post(baseBooking({ dateTime: slot.wallClock, name: "QA Dubbelbokning" }));
  check(
    "Dubbelbokning avvisas med 409",
    duplicate.status === 409,
    `status ${duplicate.status}: ${duplicate.body?.message}`
  );
  if (duplicate.status === 200) {
    const { data: dupes } = await calendar.events.list({
      calendarId,
      timeMin: slot.startsAt.toISOString(),
      timeMax: slot.endsAt.toISOString(),
      singleEvents: true,
    });
    for (const d of (dupes.items || []).filter((i) => (i.summary || "").includes("QA Dubbelbokning"))) {
      createdEventIds.push(d.id);
    }
  }

  // 4. Supabase row.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, name, date_time, event_id, total_price")
      .eq("event_id", event?.id || "none");
    if (error) throw new Error(error.message);
    const row = (data || [])[0];
    if (check("Bokningen sparad i Supabase", Boolean(row), row ? `rad #${row.id}` : "ingen rad")) {
      createdBookingIds.push(row.id);
      check(
        "date_time sparad som korrekt UTC-instant",
        new Date(row.date_time).toISOString() === slot.startsAt.toISOString(),
        `${row.date_time}`
      );
    }
  } catch (error) {
    check("Bokningen sparad i Supabase", false, error.message);
  }

  console.log(`\n      E-post skickad till: ${CUSTOMER_EMAIL} (kund) och info@aurelservice.se (admin).`);
  console.log(`      Kundnamnet innehöll "<script>" — kontrollera att det visas som text i mejlet,`);
  console.log(`      inte som kod, och att inget popup-beteende finns.`);
}

async function cleanup() {
  if (!createdEventIds.length && !createdBookingIds.length) return;
  console.log("\n=== Städar upp testdata ===");
  const calendar = calendarClient();
  for (const id of createdEventIds) {
    try {
      await calendar.events.delete({ calendarId: process.env.GOOGLE_CALENDAR_ID, eventId: id });
      console.log(`      raderade kalenderhändelse ${id}`);
    } catch (error) {
      console.log(`      KUNDE INTE radera händelse ${id}: ${error.message}`);
    }
  }
  if (createdBookingIds.length) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { error } = await supabase.from("bookings").delete().in("id", createdBookingIds);
    console.log(
      error
        ? `      KUNDE INTE radera rader ${createdBookingIds}: ${error.message}`
        : `      raderade Supabase-rader ${createdBookingIds.join(", ")}`
    );
  }
}

console.log(`=== QA /api/booking @ ${BASE_URL} ===\n`);
if (LIVE && !CUSTOMER_EMAIL) {
  console.log("--live kräver --email=<adress> för kundbekräftelsen.");
  process.exit(1);
}

const serverUp = await runSafeTests();
if (serverUp && LIVE) {
  try {
    await runLiveTests();
  } finally {
    await cleanup();
  }
} else if (serverUp) {
  console.log("\n(kör med --live --email=<adress> för att testa hela flödet)");
}

console.log(`\n=== ${passed}/${passed + failures.length} OK ===`);
if (failures.length) {
  console.log(failures.map((f) => `  FAIL: ${f}`).join("\n"));
  process.exit(1);
}
