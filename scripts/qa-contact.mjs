/**
 * QA: end to end test of /api/contact against a running server.
 *
 *   node --env-file=.env scripts/qa-contact.mjs --url=http://localhost:3100
 *   node --env-file=.env scripts/qa-contact.mjs --url=... --live --email=du@example.com
 *
 * Safe mode only exercises the rejection paths — nothing is sent. --live sends
 * real mail to the address given and to info@aurelservice.se, covering both
 * shapes the site posts: the classic contact form and the quote form on the
 * home page (which sends structured details and no name).
 */
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v === undefined ? true : v];
  })
);

const BASE_URL = args.url || "http://localhost:3000";
const LIVE = Boolean(args.live);
const EMAIL = args.email || "";
const ENDPOINT = `${BASE_URL}/api/contact`;

let passed = 0;
const failures = [];

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

// What ContactForm.js and FaqContactForm.js send.
function contactPayload(overrides = {}) {
  return {
    name: "QA Testkund",
    email: EMAIL || "qa@example.com",
    phone: "070-000 00 00",
    subject: "QA kontaktformulär",
    text: "Rad ett.\nRad två med <b>taggar</b>.",
    ...overrides,
  };
}

// What HomeForm.jsx sends: structured details, no name, no message.
function quotePayload(overrides = {}) {
  return {
    email: EMAIL || "qa@example.com",
    subject: "Prisförfrågan från startsidan",
    details: {
      Typ: "Privat",
      Tjänst: "Hemstädning",
      Yta: "75 m²",
      Adress: "Testgatan 1, 111 11 Stockholm",
      "Uppskattat pris": "150 kr",
    },
    ...overrides,
  };
}

console.log(`=== QA /api/contact @ ${BASE_URL} ===\n`);
console.log("=== Avvisningar (inget skickas) ===");

try {
  const res = await fetch(ENDPOINT, { method: "GET" });
  check("GET avvisas med 405", res.status === 405, `status ${res.status}`);
} catch (error) {
  check("Servern svarar", false, `${error.message} — kör dev-servern först`);
  process.exit(1);
}

const empty = await post({});
check("Tom body avvisas med 400", empty.status === 400, `status ${empty.status}`);

const badEmail = await post(contactPayload({ email: "inte-en-epost" }));
check("Ogiltig e-post avvisas med 400", badEmail.status === 400, `status ${badEmail.status}`);

const noName = await post(contactPayload({ name: "   " }));
check("Saknat namn avvisas med 400 (utan details)", noName.status === 400, `status ${noName.status}`);

const noText = await post(contactPayload({ text: "" }));
check("Tomt meddelande avvisas med 400 (utan details)", noText.status === 400, `status ${noText.status}`);

const leaky = [empty, badEmail, noText].some((r) =>
  /nodemailer|ECONN|SMTP|at Object\.|TypeError/i.test(JSON.stringify(r.body || {}))
);
check("Felmeddelanden läcker inga interna detaljer", !leaky);

if (LIVE) {
  if (!EMAIL) {
    console.log("\n--live kräver --email=<adress>.");
    process.exit(1);
  }
  console.log("\n=== Live (skickar riktig e-post) ===");

  // XSS payload in every free text field the templates render.
  const hostile = await post(
    contactPayload({
      name: 'QA <script>alert("xss")</script> Testkund',
      subject: 'QA " onmouseover="steal()',
      text: 'Rad ett.\n<img src=x onerror=alert(1)>\nRad tre.',
    })
  );
  check("Kontaktformulär skickas (200)", hostile.status === 200, `status ${hostile.status}: ${hostile.body?.message}`);

  const quote = await post(quotePayload());
  check(
    "Prisförfrågan utan namn skickas (200)",
    quote.status === 200,
    `status ${quote.status}: ${quote.body?.message}`
  );

  // Header injection must not survive into the subject.
  const injected = await post(
    contactPayload({ subject: "QA rubrik\r\nBcc: attacker@evil.com" })
  );
  check("Rubrik med CRLF accepteras men saneras", injected.status === 200, `status ${injected.status}`);

  console.log(`\n      Tre mejl skickade till ${EMAIL} och info@aurelservice.se.`);
  console.log(`      Kontrollera: taggar visas som text, radbrytningar bevarade,`);
  console.log(`      inget "Bcc:" i rubriken, och prisförfrågan visar tabellen utan namn.`);
} else {
  console.log("\n(kör med --live --email=<adress> för att testa utskicken)");
}

console.log(`\n=== ${passed}/${passed + failures.length} OK ===`);
if (failures.length) {
  console.log(failures.map((f) => `  FAIL: ${f}`).join("\n"));
  process.exit(1);
}
