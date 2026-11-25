/**
 * QA for the transactional emails. Two jobs, one fixture set:
 *
 *  1. PARITY — renders the four mails with the Node builders and again with
 *     the PHP ones, and compares them byte for byte. The live site runs PHP
 *     and staging runs Node, so a customer must not be able to tell which one
 *     wrote to them. Nothing else enforces that: the two implementations are
 *     separate files that drift the moment someone edits one of them.
 *
 *  2. PREVIEW — writes the rendered HTML to a directory so the design can be
 *     looked at in a browser without sending anything.
 *
 * No SMTP, no database, no network: these are pure string builders.
 *
 *   node scripts/qa-email.mjs [--out=<dir>] [--php=<path to php.exe>]
 *
 * The preview files reference the logo as cid:aurel-logo, which a browser
 * cannot resolve, so --out rewrites that one attribute to a data: URI. The
 * compared strings are the untouched ones.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

/* ------------------------------- fixtures -------------------------------- */

// The same data php/tests/test_messages.php uses, so a failure here and a
// failure there describe the same mail. The name carries the Swedish letters
// and the address an ä, because those are what an encoding bug eats first.
const WHEN = "8 juli 2026 kl. 10:00";

const BOOKING = {
  cleaningType: "Hemstädning",
  name: "Åsa Öberg",
  email: "asa@example.se",
  phone: "070-123 45 67",
  address: "Ängsvägen 3, Stockholm",
  totalPrice: "2650",
};
const DETAILS = [
  ["Yta", "82 m²"],
  ["Rum", "3"],
];

const CONTACT = {
  name: "Åsa Öberg",
  email: "asa@example.se",
  phone: "070-123 45 67",
  subject: "Offertförfrågan",
  text: "Hej!\nJag undrar vad en flyttstädning på 82 m² kostar.",
  details: [["Tjänst", "Flyttstädning"]],
};

/* ------------------------------ node side -------------------------------- */

// The real builders, not a copy of them: utils/emailMessages.js is what
// pages/api/booking.js and pages/api/contact.js call. A copy here would pass
// this check while the mails that actually go out drifted.
import {
  bookingCustomer,
  bookingAdmin,
  contactCustomer,
  contactAdmin,
} from "../utils/emailMessages.js";

const nodeMails = {
  "booking-customer": bookingCustomer(BOOKING, WHEN),
  "booking-admin": bookingAdmin(BOOKING, DETAILS, WHEN, false),
  "contact-customer": contactCustomer(CONTACT),
  "contact-admin": contactAdmin(CONTACT),
};

// Only Node builds this one: the PHP side writes the booking row before any
// mail goes out, so there is nothing to warn about. It is rendered for the
// preview and for the document checks, never for the parity comparison.
const nodeOnlyMails = {
  "booking-admin-db-failed": bookingAdmin(BOOKING, DETAILS, WHEN, true),
};

/* ------------------------------- php side -------------------------------- */

function phpBinary() {
  const given = arg("php");
  if (given) return given;
  // Where winget puts it on this machine; `php` on PATH otherwise.
  const winget = join(
    process.env.LOCALAPPDATA || "",
    "Microsoft/WinGet/Packages/PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe/php.exe"
  );
  return process.platform === "win32" ? winget : "php";
}

function renderWithPhp() {
  const php = phpBinary();
  const extDir = join(dirname(php), "ext");
  const script = join(ROOT, "scripts", ".qa-email-render.php");
  const payload = join(ROOT, "scripts", ".qa-email-fixtures.json");

  writeFileSync(
    payload,
    JSON.stringify({ when: WHEN, booking: BOOKING, details: DETAILS, contact: CONTACT }),
    "utf8"
  );
  writeFileSync(
    script,
    `<?php
declare(strict_types=1);
require __DIR__ . '/../php/lib/bootstrap.php';
use Aurel\\Messages;
$f = json_decode(file_get_contents(__DIR__ . '/.qa-email-fixtures.json'), true);
$b = $f['booking'];
$b['totalPrice'] = (float) $b['totalPrice'];
echo json_encode([
  'booking-customer' => Messages::bookingCustomer($b, $f['when']),
  'booking-admin' => Messages::bookingAdmin($b, $f['details'], $f['when']),
  'contact-customer' => Messages::contactCustomer($f['contact']),
  'contact-admin' => Messages::contactAdmin($f['contact']),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
`,
    "utf8"
  );

  try {
    const out = execFileSync(
      php,
      ["-d", `extension_dir=${extDir}`, "-d", "extension=mbstring", "-d", "extension=openssl", script],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
    );
    return JSON.parse(out);
  } finally {
    rmSync(script, { force: true });
    rmSync(payload, { force: true });
  }
}

/* -------------------------------- compare -------------------------------- */

let failures = 0;
const pass = (name) => console.log(`PASS  ${name}`);
const fail = (name, detail) => {
  failures += 1;
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
};

// Where two strings first differ, with a little context: a diff of two 4 kB
// one-line documents is unreadable otherwise.
function firstDifference(a, b) {
  const limit = Math.min(a.length, b.length);
  let i = 0;
  while (i < limit && a[i] === b[i]) i += 1;
  const from = Math.max(0, i - 40);
  return [
    `byte ${i}`,
    `  node: ${JSON.stringify(a.slice(from, i + 60))}`,
    `  php:  ${JSON.stringify(b.slice(from, i + 60))}`,
  ].join("\n");
}

console.log("=== Node vs PHP, byte for byte ===\n");

const phpMails = renderWithPhp();

for (const [name, phpHtml] of Object.entries(phpMails)) {
  const nodeHtml = nodeMails[name];
  if (nodeHtml === phpHtml) pass(name);
  else fail(name, `\n${firstDifference(nodeHtml, phpHtml)}`);
}

/* ---------------------------- sanity of the HTML -------------------------- */

console.log("\n=== every mail is a whole document ===\n");

const allMails = { ...nodeMails, ...nodeOnlyMails };

for (const [name, html] of Object.entries(allMails)) {
  const problems = [];
  if (!html.startsWith("<!DOCTYPE html>")) problems.push("no doctype");
  if (!html.includes('<meta charset="UTF-8">')) problems.push("no charset");
  if (!html.includes("cid:aurel-logo")) problems.push("no logo reference");
  if (!html.trimEnd().endsWith("</html>")) problems.push("not closed");
  // The old layout used divs and a gradient; Outlook renders neither.
  if (/linear-gradient/.test(html)) problems.push("linear-gradient (Outlook drops it)");
  if (problems.length === 0) pass(name);
  else fail(name, problems.join(", "));
}

/* -------------------------------- preview --------------------------------- */

const outDir = arg("out");
if (outDir) {
  const logo = readFileSync(join(ROOT, "php/assets/logo-email.png")).toString("base64");
  const dataUri = `data:image/png;base64,${logo}`;
  mkdirSync(outDir, { recursive: true });
  for (const [name, html] of Object.entries(allMails)) {
    writeFileSync(join(outDir, `${name}.html`), html.replace("cid:aurel-logo", dataUri), "utf8");
  }
  console.log(`\nVista previa: ${Object.keys(allMails).length} archivos en ${outDir}`);
}

const total = Object.keys(phpMails).length + Object.keys(allMails).length;
console.log(`\n=== ${total - failures}/${total} OK ===`);
process.exit(failures === 0 ? 0 : 1);
