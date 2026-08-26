/**
 * QA: unit checks for the booking helpers — escaping, header safety and the
 * Europe/Stockholm conversions the availability check depends on.
 * No network, no side effects.
 *
 *   node scripts/qa-units.mjs
 */
import { escapeHtml, singleLine } from "../utils/escapeHtml.js";
import { stockholmToUtc, utcToStockholmWallClock, formatStockholm } from "../utils/timeZone.js";

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

console.log(`\n=== ${passed}/${passed + failures.length} OK ===`);
if (failures.length) {
  console.log(failures.map((f) => `  FAIL: ${f}`).join("\n"));
  process.exit(1);
}
