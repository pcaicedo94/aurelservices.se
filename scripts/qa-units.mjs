/**
 * QA: unit checks for the form helpers — escaping, header safety, booking
 * rules, slot conflict detection (QA-01), anti-spam and the
 * Europe/Stockholm conversions the availability check depends on.
 * No network, no side effects.
 *
 * APP_TEST_MODE is not needed here: nothing in this script calls a server or
 * an external service. It matters for qa-booking.mjs and qa-contact.mjs.
 *
 *   node scripts/qa-units.mjs
 */
import { escapeHtml, singleLine } from "../utils/escapeHtml.js";
import {
  stockholmToUtc,
  utcToStockholmWallClock,
  formatStockholm,
  stockholmDateParts,
} from "../utils/timeZone.js";
import {
  parsePrice,
  parseHours,
  bookingDurationHours,
  earliestBookableStart,
  checkSchedule,
  checkHours,
  validateBooking,
  bookingErrorMessage,
  collectBookingDetails,
  bookingDetailsRecord,
  bookingEventDescription,
} from "../utils/bookingRules.js";
import { isBlocking, compareCreation, findEarlierConflict, reserveSlot } from "../utils/reserveSlot.js";
import {
  isHoneypotFilled,
  checkFillTime,
  createRateLimiter,
  clientIp,
  rateLimitKey,
  turnstileEnabled,
  verifyTurnstile,
  screenSubmission,
  greetingName,
} from "../utils/antiSpam.js";

let passed = 0;
const failures = [];

function check(name, actual, expected) {
  const ok = actual === expected;
  if (ok) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failures.push(name);
    console.log(`FAIL  ${name}\n        expected: ${expected}\n        actual:   ${actual}`);
  }
}

console.log("=== escapeHtml ===");
check(
  "script tag is neutralised",
  escapeHtml('<script>alert(1)</script>'),
  "&lt;script&gt;alert(1)&lt;/script&gt;"
);
check(
  "attribute break-out is neutralised",
  escapeHtml('" onmouseover="steal()'),
  "&quot; onmouseover=&quot;steal()"
);
check("img onerror payload", escapeHtml('<img src=x onerror=alert(1)>'), "&lt;img src=x onerror=alert(1)&gt;");
check("ampersand", escapeHtml("Städ & Allservice"), "Städ &amp; Allservice");
check("single quote", escapeHtml("O'Brien"), "O&#39;Brien");
check("null becomes empty", escapeHtml(null), "");
check("undefined becomes empty", escapeHtml(undefined), "");
check("numbers survive", escapeHtml(2650), "2650");
check("swedish letters untouched", escapeHtml("Åsa Öberg Ängsvägen"), "Åsa Öberg Ängsvägen");

console.log("\n=== singleLine (mail header / calendar safety) ===");
check(
  "CRLF header injection stripped",
  singleLine("Städning\r\nBcc: attacker@evil.com"),
  "Städning Bcc: attacker@evil.com"
);
check("newline stripped", singleLine("a\nb"), "a b");
check("trimmed", singleLine("   spaced   "), "spaced");

console.log("\n=== timeZone: wall clock -> UTC instant ===");
check("summer (CEST, +2)", stockholmToUtc("2026-09-01T10:00").toISOString(), "2026-09-01T08:00:00.000Z");
check("winter (CET, +1)", stockholmToUtc("2026-01-15T10:00").toISOString(), "2026-01-15T09:00:00.000Z");
check("DST spring forward eve", stockholmToUtc("2026-03-29T01:00").toISOString(), "2026-03-29T00:00:00.000Z");
check("DST autumn back", stockholmToUtc("2026-10-25T04:00").toISOString(), "2026-10-25T03:00:00.000Z");
check("seconds accepted", stockholmToUtc("2026-09-01T10:00:00").toISOString(), "2026-09-01T08:00:00.000Z");
check("garbage rejected", stockholmToUtc("nope"), null);
check("empty rejected", stockholmToUtc(""), null);
check("undefined rejected", stockholmToUtc(undefined), null);

console.log("\n=== timeZone: round trip ===");
check(
  "summer round trip",
  utcToStockholmWallClock(stockholmToUtc("2026-09-01T10:00")),
  "2026-09-01T10:00:00"
);
check(
  "winter round trip",
  utcToStockholmWallClock(stockholmToUtc("2026-01-15T10:00")),
  "2026-01-15T10:00:00"
);
check(
  "3h duration crosses no boundary",
  utcToStockholmWallClock(new Date(stockholmToUtc("2026-09-01T10:00").getTime() + 3 * 3600000)),
  "2026-09-01T13:00:00"
);
check(
  "duration across DST autumn change stays wall-clock correct",
  utcToStockholmWallClock(new Date(stockholmToUtc("2026-10-25T01:00").getTime() + 3 * 3600000)),
  "2026-10-25T03:00:00"
);

console.log("\n=== timeZone: display ===");
check("swedish long format", formatStockholm(stockholmToUtc("2026-09-01T10:00")), "1 september 2026 kl. 10:00");

function checkJson(name, actual, expected) {
  check(name, JSON.stringify(actual), JSON.stringify(expected));
}

function checkTrue(name, condition) {
  check(name, Boolean(condition), true);
}

const at = (wallClock) => stockholmToUtc(wallClock);

console.log("\n=== timeZone: Stockholm calendar parts ===");
checkJson("parts of a Monday morning", stockholmDateParts(at("2026-09-14T07:30")), {
  year: 2026,
  month: 9,
  day: 14,
  hour: 7,
  minute: 30,
  weekday: 1,
});
checkJson(
  "UTC Sunday 22:30 is Monday 00:30 in Stockholm",
  stockholmDateParts(new Date("2026-09-13T22:30:00Z")),
  { year: 2026, month: 9, day: 14, hour: 0, minute: 30, weekday: 1 }
);

console.log("\n=== bookingRules: price ===");
check("number price accepted", parsePrice(1450), 1450);
check("calculator string price accepted", parsePrice("1450.50"), 1450.5);
check("padded string price accepted", parsePrice(" 999 "), 999);
for (const [label, value] of [
  ["0", 0],
  ['"0"', "0"],
  ["null", null],
  ["undefined", undefined],
  ["negative", -100],
  ['"-100"', "-100"],
  ['"Offereras"', "Offereras"],
  ["empty string", ""],
  ["NaN", NaN],
  ["Infinity", Infinity],
  ["true", true],
  ['"12abc"', "12abc"],
]) {
  check(`price ${label} rejected`, parsePrice(value), null);
}

console.log("\n=== bookingRules: hours (TODO cliente Q14: 2 h minimum) ===");
check("no hours sent", parseHours({}), undefined);
check("estimatedHours string", parseHours({ estimatedHours: "3.5" }), 3.5);
check("hours number", parseHours({ hours: 4 }), 4);
check("empty estimatedHours falls back to hours", parseHours({ estimatedHours: "", hours: "2.5" }), 2.5);
check("non numeric hours is NaN", Number.isNaN(parseHours({ hours: "abc" })), true);
checkJson("absent hours pass", checkHours(undefined), []);
checkJson("1.5 h is below the minimum", checkHours(1.5), ["min-hours"]);
checkJson("exactly 2 h passes", checkHours(2), []);
checkJson("NaN hours is a field error", checkHours(NaN), ["hours"]);
check("duration defaults to 2 h", bookingDurationHours(undefined), 2);
check("duration never below 2 h", bookingDurationHours(1.5), 2);
check("duration capped at 12 h", bookingDurationHours(20), 12);
check("duration keeps fractions", bookingDurationHours(3.25), 3.25);

console.log("\n=== bookingRules: minimum notice (today + 2 days at 07:00) ===");
check(
  "Saturday afternoon -> Monday 07:00",
  earliestBookableStart(at("2026-09-12T15:00")).toISOString(),
  "2026-09-14T05:00:00.000Z"
);
check(
  "counts Stockholm days, not UTC days",
  earliestBookableStart(new Date("2026-09-12T22:30:00Z")).toISOString(),
  "2026-09-15T05:00:00.000Z"
);
check(
  "across a month end and the DST change",
  earliestBookableStart(at("2026-10-30T12:00")).toISOString(),
  "2026-11-01T06:00:00.000Z"
);

console.log("\n=== bookingRules: schedule (TODO cliente Q13 weekdays, Q16 07-17) ===");
const monday = at("2026-09-14T12:00"); // earliest bookable: Wednesday 16 Sep 07:00
checkJson("weekday 10:00 a week ahead", checkSchedule(at("2026-09-21T10:00"), monday), []);
checkJson("Saturday rejected", checkSchedule(at("2026-09-19T10:00"), monday), ["weekday"]);
checkJson("Sunday rejected", checkSchedule(at("2026-09-20T10:00"), monday), ["weekday"]);
checkJson("06:59 rejected", checkSchedule(at("2026-09-21T06:59"), monday), ["start-time"]);
checkJson("07:00 accepted", checkSchedule(at("2026-09-21T07:00"), monday), []);
checkJson("16:59 accepted", checkSchedule(at("2026-09-21T16:59"), monday), []);
checkJson("17:00 rejected", checkSchedule(at("2026-09-21T17:00"), monday), ["start-time"]);
checkJson("tomorrow is too soon", checkSchedule(at("2026-09-15T10:00"), monday), ["too-soon"]);
checkJson("first bookable minute accepted", checkSchedule(at("2026-09-16T07:00"), monday), []);
checkJson(
  "a minute before the first bookable one",
  checkSchedule(at("2026-09-16T06:59"), monday),
  ["too-soon", "start-time"]
);
checkJson("past date", checkSchedule(at("2026-09-01T10:00"), monday), ["past"]);

console.log("\n=== bookingRules: validateBooking and messages ===");
const validBody = {
  cleaningType: "Hemstädning",
  name: "Åsa Öberg",
  email: "asa@example.com",
  phone: "070-000 00 00",
  address: "Testgatan 1",
  dateTime: "2026-09-21T10:00",
  totalPrice: "1450.00",
  estimatedHours: "3",
};
const valid = validateBooking(validBody, monday);
checkJson("valid booking has no errors", valid.errors, []);
check("price parsed", valid.data.totalPrice, 1450);
check("duration from estimatedHours", valid.data.durationHours, 3);
const rejected = (overrides) => validateBooking({ ...validBody, ...overrides }, monday);
const messageFor = (overrides) => bookingErrorMessage(rejected(overrides).errors, monday);
checkJson("price 0 -> price error", rejected({ totalPrice: 0 }).errors, ["price"]);
checkJson("price null -> price error", rejected({ totalPrice: null }).errors, ["price"]);
checkTrue("price message invites a quote", /offert/i.test(messageFor({ totalPrice: "Offereras" })));
checkTrue("weekend message", /måndag till fredag/.test(messageFor({ dateTime: "2026-09-19T10:00" })));
checkTrue("start time message", /mellan 07:00 och 17:00/.test(messageFor({ dateTime: "2026-09-21T18:00" })));
check(
  "too soon message names the earliest time",
  messageFor({ dateTime: "2026-09-15T10:00" }),
  "Tidigast bokningsbara tid är 16 september 2026 kl. 07:00. Vänligen välj en senare tid."
);
checkTrue("minimum hours message", /Minsta bokningstid är 2 timmar/.test(messageFor({ estimatedHours: "1.5" })));
check(
  "missing fields win over rule messages",
  messageFor({ name: "", dateTime: "2026-09-19T10:00" }),
  "Vänligen fyll i alla uppgifter korrekt."
);
check(
  "past wins over weekday",
  messageFor({ dateTime: "2026-09-05T10:00" }),
  "Den valda tiden har redan passerat. Vänligen välj en annan tid."
);

console.log("\n=== bookingRules: details that used to be dropped (QA-06) ===");
const detailBody = {
  ...validBody,
  contactPreference: "call",
  addOns: "Spröjs, <b>Treglas</b>",
  rooms: "3 rum och kök",
  basePrice: 1200,
  balconies: "2",
  nested: { ignored: true },
};
const details = Object.fromEntries(collectBookingDetails(detailBody));
check("contact preference gets its Swedish label", details.Kontaktmetod, "Bli uppringd");
check("add-ons kept verbatim until rendering", details["Tillägg"], "Spröjs, <b>Treglas</b>");
check("rooms kept", details.Rum, "3 rum och kök");
check("estimated hours labelled", details["Beräknad tid"], "3 timmar");
check("base price labelled", details.Grundpris, "1200 kr");
check("unknown fields are kept under their own key", details.balconies, "2");
check("core fields are not repeated", details.name, undefined);
check("objects are not rendered", details.nested, undefined);
const description = bookingEventDescription(valid.data, collectBookingDetails(detailBody));
checkTrue("event description has the contact preference", description.includes("Kontaktmetod: Bli uppringd"));
checkTrue(
  "event description escapes HTML",
  description.includes("Tillägg: Spröjs, &lt;b&gt;Treglas&lt;/b&gt;") && !description.includes("<b>")
);
const record = bookingDetailsRecord(detailBody);
check("details record keeps the original keys", record.contactPreference, "call");
check("details record keeps numbers as numbers", record.basePrice, 1200);
check("details record drops objects", record.nested, undefined);

console.log("\n=== reserveSlot: conflict detection (QA-01) ===");
const T = "2026-09-12T10:00:00.000Z";
const later = "2026-09-12T10:00:01.000Z";
const earlier = "2026-09-12T09:59:59.000Z";
const own = { id: "mine", status: "confirmed", created: T };
check("confirmed event blocks", isBlocking({ status: "confirmed" }), true);
check("cancelled event does not block", isBlocking({ status: "cancelled" }), false);
check("free (transparent) event does not block", isBlocking({ status: "confirmed", transparency: "transparent" }), false);
checkTrue("earlier creation sorts first", compareCreation({ id: "z", created: earlier }, own) < 0);
checkTrue("equal creation falls back to the id", compareCreation({ id: "a", created: T }, { id: "b", created: T }) < 0);
checkTrue("missing creation time sorts last", compareCreation({ id: "a" }, own) > 0);
check("only our own event -> no conflict", findEarlierConflict(own, [own]), null);
check(
  "newer overlapping event -> no conflict (that request backs off)",
  findEarlierConflict(own, [own, { id: "x", status: "confirmed", created: later }]),
  null
);
check(
  "older overlapping event -> conflict",
  findEarlierConflict(own, [own, { id: "y", status: "confirmed", created: earlier }])?.id,
  "y"
);
check(
  "older but cancelled -> no conflict",
  findEarlierConflict(own, [own, { id: "y", status: "cancelled", created: earlier }]),
  null
);
const first = { id: "aaa", status: "confirmed", created: T };
const second = { id: "bbb", status: "confirmed", created: T };
check("same millisecond: lower id keeps the slot", findEarlierConflict(first, [first, second]), null);
check("same millisecond: higher id backs off", findEarlierConflict(second, [first, second])?.id, "aaa");

console.log("\n=== reserveSlot: compensation with a fake calendar ===");
function fakeCalendar(reads, { failDelete = false } = {}) {
  const calls = { reads: 0, inserted: [], deleted: [] };
  return {
    calls,
    async listEvents() {
      const next = reads[calls.reads];
      calls.reads += 1;
      if (next instanceof Error) throw next;
      return typeof next === "function" ? next(calls) : next;
    },
    async insertEvent(requestBody) {
      const event = { ...requestBody, id: "mine", status: "confirmed", created: T };
      calls.inserted.push(event);
      return event;
    },
    async deleteEvent(id) {
      if (failDelete) throw new Error("delete failed");
      calls.deleted.push(id);
    },
  };
}
const slot = { window: { timeMin: "2026-09-21T08:00:00.000Z", timeMax: "2026-09-21T11:00:00.000Z" }, event: { summary: "QA" } };
const olderBooking = { id: "older", status: "confirmed", created: earlier };

let calendar = fakeCalendar([[olderBooking]]);
let outcome = await reserveSlot(calendar, slot);
check("busy slot -> taken, nothing inserted", `${outcome.reason}/${calendar.calls.inserted.length}`, "taken/0");

calendar = fakeCalendar([[], (calls) => [calls.inserted[0]]]);
outcome = await reserveSlot(calendar, slot);
check("free slot -> reserved and kept", `${outcome.reserved}/${calendar.calls.deleted.length}`, "true/0");

calendar = fakeCalendar([[], (calls) => [olderBooking, calls.inserted[0]]]);
outcome = await reserveSlot(calendar, slot);
check("lost race -> own event deleted", `${outcome.reason}/${calendar.calls.deleted.join(",")}`, "race/mine");

calendar = fakeCalendar([[], (calls) => [calls.inserted[0], { id: "newer", status: "confirmed", created: later }]]);
outcome = await reserveSlot(calendar, slot);
check("won race -> own event kept", `${outcome.reserved}/${calendar.calls.deleted.length}`, "true/0");

calendar = fakeCalendar([[], new Error("network")]);
let thrown = null;
try {
  await reserveSlot(calendar, slot);
} catch (error) {
  thrown = error;
}
check(
  "verification failure -> rethrown and own event deleted",
  `${thrown?.message}/${calendar.calls.deleted.join(",")}`,
  "network/mine"
);

const quietError = console.error;
console.error = () => {};
calendar = fakeCalendar([[], (calls) => [olderBooking, calls.inserted[0]]], { failDelete: true });
outcome = await reserveSlot(calendar, slot);
console.error = quietError;
check("lost race still answers 409 when the delete fails", outcome.reason, "race");

console.log("\n=== antiSpam: honeypot and fill time ===");
check("empty honeypot passes", isHoneypotFilled({ company_website: "" }), false);
check("whitespace-only honeypot passes", isHoneypotFilled({ company_website: "   " }), false);
check("missing honeypot passes", isHoneypotFilled({}), false);
check("filled honeypot is caught", isHoneypotFilled({ company_website: "https://spam.example" }), true);
const NOW = 1800000000000;
check("missing formStartedAt passes (forms not updated yet)", checkFillTime({}, NOW), "ok");
check("20 s to fill in passes", checkFillTime({ formStartedAt: NOW - 20000 }, NOW), "ok");
check("exactly 3 s passes", checkFillTime({ formStartedAt: NOW - 3000 }, NOW), "ok");
check("2.9 s is too fast", checkFillTime({ formStartedAt: NOW - 2900 }, NOW), "too-fast");
check("numeric string is read as a timestamp", checkFillTime({ formStartedAt: String(NOW - 500) }, NOW), "too-fast");
check("garbage is invalid", checkFillTime({ formStartedAt: "igår" }, NOW), "invalid");
check("zero is invalid", checkFillTime({ formStartedAt: 0 }, NOW), "invalid");
check("visitor clock ahead of the server passes", checkFillTime({ formStartedAt: NOW + 60000 }, NOW), "ok");

console.log("\n=== antiSpam: per-IP limit (5 per 10 min) ===");
const limiter = createRateLimiter({ limit: 5, windowMs: 600000 });
const verdicts = [];
for (let i = 0; i < 6; i += 1) verdicts.push(limiter.hit("1.2.3.4", NOW + i * 1000).allowed);
checkJson("five allowed, the sixth blocked", verdicts, [true, true, true, true, true, false]);
check(
  "Retry-After counts down to when the oldest hit leaves the window",
  limiter.hit("1.2.3.4", NOW + 10000).retryAfterSeconds,
  590
);
check("other IPs keep their own budget", limiter.hit("5.6.7.8", NOW + 10000).allowed, true);
check("allowed again once the oldest hit has expired", limiter.hit("1.2.3.4", NOW + 600001).allowed, true);
const tiny = createRateLimiter({ limit: 1, windowMs: 600000, maxKeys: 2 });
tiny.hit("a", NOW);
tiny.hit("b", NOW);
tiny.hit("c", NOW);
check("memory is bounded: the least recently used key is forgotten", tiny.hit("a", NOW).allowed, true);

console.log("\n=== antiSpam: client address ===");
const fakeReq = (headers, remoteAddress = "10.0.0.1") => ({ headers, socket: { remoteAddress } });
check(
  "outside Vercel forwarded headers are ignored",
  clientIp(fakeReq({ "x-forwarded-for": "6.6.6.6" }), {}),
  "10.0.0.1"
);
check(
  "on Vercel x-real-ip is used",
  clientIp(fakeReq({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }), { VERCEL: "1" }),
  "1.1.1.1"
);
check(
  "on Vercel the first x-forwarded-for is used",
  clientIp(fakeReq({ "x-forwarded-for": "3.3.3.3, 4.4.4.4" }), { VERCEL: "1" }),
  "3.3.3.3"
);
check(
  "x-test-client-id ignored outside test mode",
  rateLimitKey(fakeReq({ "x-test-client-id": "qa-1" }), { testMode: false, env: {} }),
  "10.0.0.1"
);
check(
  "x-test-client-id used in test mode",
  rateLimitKey(fakeReq({ "x-test-client-id": "qa-1" }), { testMode: true, env: {} }),
  "test:qa-1"
);

console.log("\n=== antiSpam: Turnstile (optional) ===");
check("off without keys", turnstileEnabled({}), false);
check("off with only the secret", turnstileEnabled({ TURNSTILE_SECRET_KEY: "s" }), false);
check("on with both keys", turnstileEnabled({ TURNSTILE_SECRET_KEY: "s", NEXT_PUBLIC_TURNSTILE_SITE_KEY: "k" }), true);
const cloudflare = (success) => async () => ({ json: async () => ({ success }) });
check("valid token", await verifyTurnstile("token", "1.1.1.1", { secret: "s", fetchImpl: cloudflare(true) }), true);
check("rejected token", await verifyTurnstile("token", "1.1.1.1", { secret: "s", fetchImpl: cloudflare(false) }), false);
check("missing token", await verifyTurnstile("", "1.1.1.1", { secret: "s", fetchImpl: cloudflare(true) }), false);

console.log("\n=== antiSpam: screenSubmission ===");
const withTurnstile = { TURNSTILE_SECRET_KEY: "s", NEXT_PUBLIC_TURNSTILE_SITE_KEY: "k" };
checkJson(
  "clean submission continues",
  await screenSubmission(fakeReq({}), { formStartedAt: NOW - 20000 }, { now: NOW, env: {} }),
  null
);
checkJson(
  "honeypot answers 200",
  await screenSubmission(fakeReq({}), { company_website: "x" }, { now: NOW, env: {} }),
  { status: 200, reason: "honeypot" }
);
checkJson(
  "too fast answers 400",
  await screenSubmission(fakeReq({}), { formStartedAt: NOW - 100 }, { now: NOW, env: {} }),
  { status: 400, reason: "too-fast" }
);
checkJson(
  "Turnstile enforced once both keys exist",
  await screenSubmission(fakeReq({}), {}, { now: NOW, env: withTurnstile }),
  { status: 400, reason: "turnstile" }
);
checkJson(
  "Turnstile not called in test mode",
  await screenSubmission(fakeReq({}), {}, { now: NOW, env: withTurnstile, testMode: true }),
  null
);

console.log("\n=== antiSpam: what a confirmation may repeat ===");
check("ordinary name kept", greetingName("Åsa Öberg"), "Åsa Öberg");
check("link dropped", greetingName("Köp på https://spam.example"), "");
check("domain dropped", greetingName("billigt.se"), "");
check("e-mail address dropped", greetingName("mail me@spam.example"), "");
check("long text dropped", greetingName("A".repeat(41)), "");

console.log(`\n=== ${passed}/${passed + failures.length} OK ===`);
if (failures.length) {
  console.log(failures.map((f) => `  FAIL: ${f}`).join("\n"));
  process.exit(1);
}
