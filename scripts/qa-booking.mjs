/**
 * QA: end to end test of /api/booking against a running server.
 *
 * APP_TEST_MODE=1: start the server in test mode before running this.
 *   bash:       APP_TEST_MODE=1 npx next dev -p 3105
 *   PowerShell: $env:APP_TEST_MODE="1"; npx next dev -p 3105
 * The endpoint then simulates every side effect (mail via jsonTransport, fake
 * calendar writes, no Supabase rows) and marks its responses with
 * `X-App-Test-Mode: 1`. See utils/testMode.js.
 *
 *   node --env-file=.env scripts/qa-booking.mjs --url=http://localhost:3105
 *   node --env-file=.env scripts/qa-booking.mjs --url=... --live --email=du@example.com
 *
 * Always: the rejection paths that are safe against any server (405 / 400).
 *
 * Only when the server answers with X-App-Test-Mode: 1: booking rules (price,
 * weekday, start window, notice, 2 h billed minimum), anti-spam (honeypot, fill
 * time, per-IP limit), the 409/500 scenarios and the rendered mails. Those
 * tests post valid bookings, so they are skipped against a server that is not
 * in test mode. The full-flow test reads the real calendar (read only) to pick
 * a free slot, like the server's own availability check does.
 *
 * --live (server NOT in test mode) books a real slot, checks that it lands in
 * Google Calendar at the right instant, that a repeat booking is rejected with
 * 409, that a Supabase row was written, and then deletes everything it
 * created. --live DOES send real mail to the customer address given and to
 * info@aurelservice.se.
 */
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { stockholmToUtc, utcToStockholmWallClock, stockholmDateParts } from "../utils/timeZone.js";

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
const ADMIN_EMAIL = "info@aurelservice.se";
const RUN_ID = Date.now().toString(36);

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

// In test mode the per-IP limit is keyed on x-test-client-id, so every request
// gets its own budget unless a test deliberately reuses one.
let clientCounter = 0;
function freshClient() {
  clientCounter += 1;
  return `qa-booking-${RUN_ID}-${clientCounter}`;
}

async function post(body, headers = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-client-id": freshClient(), ...headers },
    body: JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, headers: res.headers, body: json };
}

function calendarClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: "v3", auth });
}

/* ------------------------------ dates (Stockholm) ------------------------ */

const today = stockholmDateParts(new Date());

function stockholmDate(daysAhead) {
  const utc = new Date(Date.UTC(today.year, today.month - 1, today.day + daysAhead));
  return { date: utc.toISOString().slice(0, 10), weekday: utc.getUTCDay() };
}

const isWeekday = (weekday) => weekday >= 1 && weekday <= 5;
const isSaturday = (weekday) => weekday === 6;

// First Stockholm date at least `daysAhead` days out whose weekday matches.
function dayFrom(daysAhead, accept) {
  for (let day = daysAhead; day < daysAhead + 14; day += 1) {
    const candidate = stockholmDate(day);
    if (accept(candidate.weekday)) return candidate.date;
  }
  throw new Error("no matching day");
}

/** Finds a free weekday slot 07:00-13:00, at least `daysAhead` days out. Read only. */
async function findFreeSlot(calendar, hours, daysAhead = 6) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  for (let day = daysAhead; day < daysAhead + 30; day += 1) {
    const { date, weekday } = stockholmDate(day);
    if (!isWeekday(weekday)) continue;
    for (const hour of [7, 8, 9, 10, 11, 12, 13]) {
      const wallClock = `${date}T${String(hour).padStart(2, "0")}:00`;
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
    email: CUSTOMER_EMAIL || "qa@example.com",
    phone: "070-000 00 00",
    address: "Testgatan 1, 111 11 Stockholm",
    dateTime: `${dayFrom(7, isWeekday)}T10:00`,
    totalPrice: 3950,
    area: "75",
    estimatedHours: "3",
    extras: "Kyl/frys, Diskmaskin",
    // A person who opened the form 20 seconds ago.
    formStartedAt: Date.now() - 20000,
    ...overrides,
  };
}

/* ------------------------------ safe tests ------------------------------- */

// Rejections every server version answers with 400/405, whatever its mode.
async function runSafeTests() {
  console.log("=== Avvisningar (säkra mot alla servrar, inga skrivningar) ===");

  try {
    const res = await fetch(ENDPOINT, { method: "GET" });
    check("GET avvisas med 405", res.status === 405, `status ${res.status}`);
  } catch (error) {
    check("Servern svarar", false, `${error.message} — starta dev-servern först`);
    return { up: false, testMode: false };
  }

  const empty = await post({});
  check("Tom body avvisas med 400", empty.status === 400, `status ${empty.status}: ${empty.body?.message}`);

  const badEmail = await post(baseBooking({ email: "inte-en-epost" }));
  check("Ogiltig e-post avvisas med 400", badEmail.status === 400, `status ${badEmail.status}`);

  const noName = await post(baseBooking({ name: "   " }));
  check("Saknat namn avvisas med 400", noName.status === 400, `status ${noName.status}`);

  const past = await post(baseBooking({ dateTime: "2020-01-01T10:00" }));
  check(
    "Datum i det förflutna avvisas med 400",
    past.status === 400 && /passerat/i.test(past.body?.message || ""),
    `status ${past.status}: ${past.body?.message}`
  );

  const badDate = await post(baseBooking({ dateTime: "imorgon typ" }));
  check("Ogiltigt datumformat avvisas med 400", badDate.status === 400, `status ${badDate.status}`);

  const leaky = [empty, badEmail, past].some((r) =>
    /invalid_grant|ECONN|nodemailer|googleapis|at Object\./i.test(r.body?.message || "")
  );
  check("Felmeddelanden läcker inga interna detaljer", !leaky);

  const testMode = empty.headers.get("x-app-test-mode") === "1";
  console.log(`      servern kör i testläge: ${testMode ? "ja" : "nej"}`);
  return { up: true, testMode };
}

/* ---------------------------- test mode tests ---------------------------- */

function noSideEffects(response) {
  const test = response.body?.test;
  return Boolean(test) && test.mails.length === 0 && test.calendar.inserted.length === 0 && test.db.length === 0;
}

async function runTestModeTests() {
  console.log("\n=== Testläge: antispam (inget skickas eller sparas) ===");
  const weekday = dayFrom(7, isWeekday);
  const booking = (overrides = {}) => baseBooking({ dateTime: `${weekday}T10:00`, ...overrides });
  // Rule tests carry the `conflict` scenario: a rule that wrongly lets a
  // booking through then ends in 409 against a simulated calendar, never in
  // a real read.
  const CONFLICT = { "x-test-scenario": "conflict" };

  const trap = await post(booking({ company_website: "https://spam.example" }));
  check(
    "Fältfälla company_website ger 200 utan att skicka, läsa eller spara",
    trap.status === 200 && noSideEffects(trap) && trap.body.test.calendar.reads === 0,
    `status ${trap.status}`
  );

  const tooFast = await post(booking({ formStartedAt: Date.now() - 500 }), CONFLICT);
  check(
    "För snabbt inskick (< 3 s) avvisas med 400",
    tooFast.status === 400 && noSideEffects(tooFast) && tooFast.body.test.calendar.reads === 0,
    `status ${tooFast.status}: ${tooFast.body?.message}`
  );

  const badStart = await post(booking({ formStartedAt: "igår" }), CONFLICT);
  check("Ogiltigt formStartedAt avvisas med 400", badStart.status === 400, `status ${badStart.status}`);

  const client = `qa-booking-${RUN_ID}-ratelimit`;
  const statuses = [];
  let last = null;
  for (let i = 0; i < 6; i += 1) {
    last = await post(booking(), { ...CONFLICT, "x-test-client-id": client });
    statuses.push(last.status);
  }
  check(
    "Högst 5 inskick per 10 min per IP, det sjätte får 429",
    statuses.slice(0, 5).every((s) => s === 409) && statuses[5] === 429,
    statuses.join(",")
  );
  check("429 har ett svenskt meddelande", /för många/i.test(last.body?.message || ""), last.body?.message);
  check(
    "429 har Retry-After",
    Number(last.headers.get("retry-after")) > 0,
    `Retry-After: ${last.headers.get("retry-after")}`
  );
  const otherClient = await post(booking(), CONFLICT);
  check("Andra IP-adresser påverkas inte", otherClient.status === 409, `status ${otherClient.status}`);

  console.log("\n=== Testläge: bokningsregler ===");
  for (const [label, totalPrice] of [
    ["0", 0],
    ["null", null],
    ["negativt", -500],
    ['"Offereras"', "Offereras"],
  ]) {
    const r = await post(booking({ totalPrice }), CONFLICT);
    check(
      `Pris ${label} avvisas med 400 och hänvisar till offert`,
      r.status === 400 && /offert/i.test(r.body?.message || ""),
      `status ${r.status}: ${r.body?.message}`
    );
  }

  const weekend = await post(booking({ dateTime: `${dayFrom(7, isSaturday)}T10:00` }), CONFLICT);
  check(
    "Lördag avvisas med 400 (TODO cliente Q13)",
    weekend.status === 400 && /måndag till fredag/i.test(weekend.body?.message || ""),
    `status ${weekend.status}: ${weekend.body?.message}`
  );

  const early = await post(booking({ dateTime: `${weekday}T06:30` }), CONFLICT);
  check(
    "Start 06:30 avvisas med 400 (TODO cliente Q16)",
    early.status === 400 && /07:00 och 17:00/.test(early.body?.message || ""),
    `status ${early.status}: ${early.body?.message}`
  );
  const late = await post(booking({ dateTime: `${weekday}T17:00` }), CONFLICT);
  check("Start 17:00 avvisas med 400", late.status === 400, `status ${late.status}: ${late.body?.message}`);
  const lastStart = await post(booking({ dateTime: `${weekday}T16:30` }), CONFLICT);
  check(
    "Start 16:30 godkänns av reglerna (409 från simulerad kalender)",
    lastStart.status === 409,
    `status ${lastStart.status}: ${lastStart.body?.message}`
  );

  const soon = await post(booking({ dateTime: `${stockholmDate(1).date}T10:00` }), CONFLICT);
  check(
    "Imorgon är för tidigt (400)",
    soon.status === 400 && /Tidigast bokningsbara tid/.test(soon.body?.message || ""),
    `status ${soon.status}: ${soon.body?.message}`
  );


  console.log("\n=== Testläge: scenarier ===");
  const conflict = await post(booking(), CONFLICT);
  check(
    "Upptagen tid ger 409 utan att skapa något",
    conflict.status === 409 && noSideEffects(conflict),
    `status ${conflict.status}: ${conflict.body?.message}`
  );

  const race = await post(booking(), { "x-test-scenario": "race" });
  const inserted = race.body?.test?.calendar?.inserted || [];
  const deleted = race.body?.test?.calendar?.deleted || [];
  check(
    "Kapplöpning: äldre bokning vinner, egen händelse raderas, 409",
    race.status === 409 &&
      inserted.length === 1 &&
      deleted.includes(inserted[0].id) &&
      race.body.test.mails.length === 0 &&
      race.body.test.db.length === 0,
    `status ${race.status}, skapad ${inserted[0]?.id}, raderad ${deleted.join(",")}`
  );

  const calendarError = await post(booking(), { "x-test-scenario": "calendar-error" });
  check("Kalenderfel ger 500", calendarError.status === 500, `status ${calendarError.status}`);
  const mailError = await post(booking(), { "x-test-scenario": "mail-error" });
  check("E-postfel ger 500", mailError.status === 500, `status ${mailError.status}`);
  const leaky = [calendarError, mailError].some((r) =>
    /Simulated|TEST_SCENARIO|invalid_grant|ECONN|nodemailer|googleapis|at Object\./i.test(r.body?.message || "")
  );
  check("500-svar läcker inga interna detaljer", !leaky);

  const freeSlot = await freeSlotInTestMode();
  await runFullFlowInTestMode(freeSlot);
  await runMinimumHoursInTestMode(freeSlot);
}

// A free weekday slot from the real calendar (read only), so the server's own
// availability check passes; far in the future if the calendar is unreachable.
async function freeSlotInTestMode() {
  if (process.env.GOOGLE_REFRESH_TOKEN && process.env.GOOGLE_CALENDAR_ID) {
    try {
      const slot = await findFreeSlot(calendarClient(), 3, 8);
      if (slot) return slot.wallClock;
    } catch (error) {
      console.log(`      (kunde inte läsa kalendern: ${error.message})`);
    }
  }
  return `${dayFrom(40, isWeekday)}T10:00`;
}

function eventHours(event) {
  const start = stockholmToUtc(event?.start?.dateTime);
  const end = stockholmToUtc(event?.end?.dateTime);
  return start && end ? (end.getTime() - start.getTime()) / 3600000 : NaN;
}

// TODO(cliente Q14): an estimate under 2 h is booked and billed as 2 h, never
// rejected. Home cleaning sends `estimatedHours`, move cleaning `hours`.
async function runMinimumHoursInTestMode(dateTime) {
  console.log("\n=== Testläge: minst 2 timmar debiteras, ingen avvisning ===");
  for (const [service, field, value] of [
    ["Hemstädning", "estimatedHours", "1.5"],
    ["Flyttstädning", "hours", "1.25"],
  ]) {
    const r = await post(
      baseBooking({ dateTime, cleaningType: `QA ${service}`, estimatedHours: undefined, [field]: value })
    );
    const test = r.body?.test;
    const adminHtml = (test?.mails || []).find((m) => m.to === ADMIN_EMAIL)?.html || "";
    const event = test?.calendar?.inserted?.[0];
    const details = test?.db?.[0]?.row?.details || {};
    check(`${service} med ${field} ${value} ger 200`, r.status === 200, `status ${r.status}: ${r.body?.message}`);
    check(`${service}: kalenderhändelsen är 2 h lång`, eventHours(event) === 2, `${eventHours(event)} h`);
    check(
      `${service}: adminmejlet visar ${value} timmar och "Debiteras minst 2 timmar"`,
      adminHtml.includes(`${value} timmar`) && adminHtml.includes("Debiteras minst 2 timmar")
    );
    check(
      `${service}: raden bokar 2 h och behåller ${field}`,
      details.bookedHours === 2 && details[field] === value,
      `bookedHours ${details.bookedHours}, ${field} ${details[field]}`
    );
  }
}

// One booking through the whole handler: real availability read, everything
// else simulated. Proves the fields the forms send reach mail, event and row.
async function runFullFlowInTestMode(dateTime) {
  console.log("\n=== Testläge: hela flödet (kalendern läses, inget skrivs) ===");
  const payload = baseBooking({
    dateTime,
    cleaningType: "QA Storstädning",
    contactPreference: "call",
    addOns: "Spröjs, <b>Treglas</b>",
    rooms: "3 rum och kök",
    basePrice: 3200,
    company_website: "",
  });
  const r = await post(payload);
  const test = r.body?.test;
  if (!check("Hela flödet ger 200", r.status === 200 && Boolean(test), `status ${r.status}: ${r.body?.message}`)) {
    return;
  }

  const admin = test.mails.find((m) => m.to === ADMIN_EMAIL);
  const customer = test.mails.find((m) => m.to === payload.email);
  const adminHtml = admin?.html || "";
  check(
    "Två simulerade mejl: kund och admin",
    test.mails.length === 2 && Boolean(admin) && Boolean(customer),
    test.mails.map((m) => `${m.to} | ${m.subject}`).join(" ; ")
  );
  check(
    "Adminmejlet visar contactPreference (Kontaktmetod: Bli uppringd)",
    adminHtml.includes("Kontaktmetod") && adminHtml.includes("Bli uppringd")
  );
  check(
    "Adminmejlet visar addOns (Tillägg), escapat",
    adminHtml.includes("Spröjs, &lt;b&gt;Treglas&lt;/b&gt;") && !adminHtml.includes("<b>Treglas</b>")
  );
  check("Adminmejlet visar grundpris och rum", adminHtml.includes("3200 kr") && adminHtml.includes("3 rum och kök"));

  const event = test.calendar.inserted[0];
  check(
    "Kalenderhändelsen simulerades och behölls",
    test.calendar.inserted.length === 1 && String(event?.id).startsWith("test") && test.calendar.deleted.length === 0,
    event?.id
  );
  check("Kalendern lästes två gånger: kontroll + verifiering", test.calendar.reads === 2, `reads ${test.calendar.reads}`);
  check(
    "Händelsebeskrivningen har contactPreference och addOns, escapade",
    (event?.description || "").includes("Kontaktmetod: Bli uppringd") &&
      (event?.description || "").includes("Tillägg: Spröjs, &lt;b&gt;Treglas&lt;/b&gt;")
  );

  const row = test.db[0]?.row;
  check(
    "Supabase-raden (simulerad) har contactPreference och addOns i details",
    row?.details?.contactPreference === "call" && row?.details?.addOns === "Spröjs, <b>Treglas</b>"
  );
  check(
    "details sparar inte antispamfälten",
    Boolean(row) && !("company_website" in row.details) && !("formStartedAt" in row.details)
  );
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

  console.log(`\n      E-post skickad till: ${CUSTOMER_EMAIL} (kund) och ${ADMIN_EMAIL} (admin).`);
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

const server = await runSafeTests();
if (server.up && server.testMode) {
  if (LIVE) check("--live kräver en server utan APP_TEST_MODE", false, "live-testerna hoppades över");
  await runTestModeTests();
} else if (server.up && LIVE) {
  try {
    await runLiveTests();
  } finally {
    await cleanup();
  }
} else if (server.up) {
  console.log("\n(starta servern med APP_TEST_MODE=1 för regler, antispam och scenarier,");
  console.log(" eller kör --live --email=<adress> mot en vanlig server för hela flödet)");
}

console.log(`\n=== ${passed}/${passed + failures.length} OK ===`);
if (failures.length) {
  console.log(failures.map((f) => `  FAIL: ${f}`).join("\n"));
  process.exit(1);
}
