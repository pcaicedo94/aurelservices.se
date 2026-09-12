/**
 * QA: end to end test of /api/contact against a running server.
 *
 * APP_TEST_MODE=1: start the server in test mode before running this.
 *   bash:       APP_TEST_MODE=1 npx next dev -p 3105
 *   PowerShell: $env:APP_TEST_MODE="1"; npx next dev -p 3105
 * The endpoint then renders mail with jsonTransport instead of sending it and
 * marks its responses with `X-App-Test-Mode: 1`. See utils/testMode.js.
 *
 *   node scripts/qa-contact.mjs --url=http://localhost:3105
 *   node scripts/qa-contact.mjs --url=... --live --email=du@example.com
 *
 * Always: the rejection paths, which send nothing on any server.
 *
 * Only when the server answers with X-App-Test-Mode: 1: anti-spam (honeypot,
 * fill time, per-IP limit), the mail-error path and the rendered mails,
 * including that the confirmation to the sender repeats none of their text.
 * Those tests post valid messages, so they are skipped otherwise.
 *
 * --live (server NOT in test mode) sends real mail to the address given and to
 * info@aurelservice.se, covering both shapes the site posts: the classic
 * contact form and the quote forms (structured details, no name).
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
const SENDER = EMAIL || "qa@example.com";
const ENDPOINT = `${BASE_URL}/api/contact`;
const ADMIN_EMAIL = "info@aurelservice.se";
const RUN_ID = Date.now().toString(36);

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

// In test mode the per-IP limit is keyed on x-test-client-id, so every request
// gets its own budget unless a test deliberately reuses one.
let clientCounter = 0;
function freshClient() {
  clientCounter += 1;
  return `qa-contact-${RUN_ID}-${clientCounter}`;
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

// What ContactForm.js and FaqContactForm.js send.
function contactPayload(overrides = {}) {
  return {
    name: "QA Testkund",
    email: SENDER,
    phone: "070-000 00 00",
    subject: "QA kontaktformulär",
    text: "Rad ett.\nRad två med <b>taggar</b>.",
    company_website: "",
    // A person who opened the form 20 seconds ago.
    formStartedAt: Date.now() - 20000,
    ...overrides,
  };
}

// What HomeForm.jsx sends: structured details, no name, no message, and no
// anti-spam fields yet.
function quotePayload(overrides = {}) {
  return {
    email: SENDER,
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

const mailTo = (response, to) => (response.body?.test?.mails || []).find((m) => m.to === to);

/* ------------------------------ safe tests ------------------------------- */

async function runSafeTests() {
  console.log("=== Avvisningar (inget skickas, säkert mot alla servrar) ===");

  try {
    const res = await fetch(ENDPOINT, { method: "GET" });
    check("GET avvisas med 405", res.status === 405, `status ${res.status}`);
  } catch (error) {
    check("Servern svarar", false, `${error.message} — starta dev-servern först`);
    return { up: false, testMode: false };
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
    /nodemailer|ECONN|SMTP|at Object\.|TypeError/i.test(r.body?.message || "")
  );
  check("Felmeddelanden läcker inga interna detaljer", !leaky);

  const testMode = empty.headers.get("x-app-test-mode") === "1";
  console.log(`      servern kör i testläge: ${testMode ? "ja" : "nej"}`);
  return { up: true, testMode };
}

/* ---------------------------- test mode tests ---------------------------- */

async function runTestModeTests() {
  console.log("\n=== Testläge: antispam (inget skickas) ===");

  const trap = await post(contactPayload({ company_website: "https://spam.example" }));
  check(
    "Fältfälla company_website ger 200 utan att skicka",
    trap.status === 200 && trap.body?.test?.mails.length === 0,
    `status ${trap.status}, mejl ${trap.body?.test?.mails.length}`
  );

  const tooFast = await post(contactPayload({ formStartedAt: Date.now() - 500 }));
  check(
    "För snabbt inskick (< 3 s) avvisas med 400",
    tooFast.status === 400 && tooFast.body?.test?.mails.length === 0,
    `status ${tooFast.status}: ${tooFast.body?.message}`
  );

  const badStart = await post(contactPayload({ formStartedAt: "nyss" }));
  check("Ogiltigt formStartedAt avvisas med 400", badStart.status === 400, `status ${badStart.status}`);

  const legacy = await post(quotePayload());
  check(
    "Formulär som ännu inte skickar formStartedAt släpps igenom",
    legacy.status === 200,
    `status ${legacy.status}: ${legacy.body?.message}`
  );

  const client = `qa-contact-${RUN_ID}-ratelimit`;
  const statuses = [];
  let last = null;
  for (let i = 0; i < 6; i += 1) {
    last = await post(contactPayload(), { "x-test-client-id": client });
    statuses.push(last.status);
  }
  check(
    "Högst 5 inskick per 10 min per IP, det sjätte får 429",
    statuses.slice(0, 5).every((s) => s === 200) && statuses[5] === 429,
    statuses.join(",")
  );
  check("429 har ett svenskt meddelande", /för många/i.test(last.body?.message || ""), last.body?.message);
  check(
    "429 har Retry-After",
    Number(last.headers.get("retry-after")) > 0,
    `Retry-After: ${last.headers.get("retry-after")}`
  );
  const otherClient = await post(contactPayload());
  check("Andra IP-adresser påverkas inte", otherClient.status === 200, `status ${otherClient.status}`);

  console.log("\n=== Testläge: e-postfel ===");
  const mailError = await post(contactPayload(), { "x-test-scenario": "mail-error" });
  check("E-postfel ger 500", mailError.status === 500, `status ${mailError.status}`);
  check(
    "500-svaret läcker inga interna detaljer",
    !/Simulated|TEST_SCENARIO|nodemailer|ECONN|SMTP|at Object\./i.test(mailError.body?.message || "")
  );

  console.log("\n=== Testläge: renderade mejl ===");
  const marker = `QA-${RUN_ID}`;
  const message = await post(
    contactPayload({
      text: `Hemligt ${marker}\n<img src=x onerror=alert(1)>`,
      subject: "QA rubrik\r\nBcc: attacker@evil.com",
    })
  );
  const toSender = mailTo(message, SENDER);
  const toAdmin = mailTo(message, ADMIN_EMAIL);
  check(
    "Kontaktformulär ger 200 och två simulerade mejl",
    message.status === 200 && Boolean(toSender) && Boolean(toAdmin),
    `status ${message.status}`
  );
  check(
    "Bekräftelsen till avsändaren upprepar inte meddelandet",
    Boolean(toSender) && !toSender.html.includes(marker) && !/Ditt meddelande/.test(toSender.html)
  );
  check("Bekräftelsen hälsar med ett vanligt namn", (toSender?.html || "").includes("Hej <strong>QA Testkund</strong>"));
  check(
    "Adminmejlet har meddelandet, escapat och med radbrytningar",
    (toAdmin?.html || "").includes(`Hemligt ${marker}<br />&lt;img src=x onerror=alert(1)&gt;`)
  );
  check(
    "Rubriken har ingen CRLF (ingen header injection)",
    Boolean(toAdmin) && !/[\r\n]/.test(toAdmin.subject),
    JSON.stringify(toAdmin?.subject)
  );
  check("Svara-till i adminmejlet är avsändaren", toAdmin?.replyTo === SENDER, toAdmin?.replyTo);

  const spamName = await post(contactPayload({ name: "Billiga klockor på https://spam.example" }));
  check(
    "Namn som ser ut som en länk upprepas inte i bekräftelsen",
    spamName.status === 200 && !(mailTo(spamName, SENDER)?.html || "").includes("spam.example")
  );
  check("Adminmejlet visar ändå hela namnet", (mailTo(spamName, ADMIN_EMAIL)?.html || "").includes("https://spam.example"));

  const address = `Testgatan ${RUN_ID}`;
  const quote = await post(quotePayload({ details: { ...quotePayload().details, Adress: address } }));
  check("Offertförfrågan utan namn ger 200", quote.status === 200, `status ${quote.status}: ${quote.body?.message}`);
  check(
    "Adminmejlet visar offertens detaljer",
    (mailTo(quote, ADMIN_EMAIL)?.html || "").includes(address) &&
      (mailTo(quote, ADMIN_EMAIL)?.html || "").includes("Uppskattat pris")
  );
  check("Bekräftelsen upprepar inte detaljerna", !(mailTo(quote, SENDER)?.html || "").includes(address));
}

/* ------------------------------ live tests ------------------------------- */

async function runLiveTests() {
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
  const injected = await post(contactPayload({ subject: "QA rubrik\r\nBcc: attacker@evil.com" }));
  check("Rubrik med CRLF accepteras men saneras", injected.status === 200, `status ${injected.status}`);

  console.log(`\n      Tre mejl skickade till ${EMAIL} och ${ADMIN_EMAIL}.`);
  console.log(`      Kontrollera: taggar visas som text i adminmejlet, radbrytningar bevarade,`);
  console.log(`      inget "Bcc:" i rubriken, och att bekräftelsen inte upprepar meddelandet.`);
}

console.log(`=== QA /api/contact @ ${BASE_URL} ===\n`);
if (LIVE && !EMAIL) {
  console.log("--live kräver --email=<adress>.");
  process.exit(1);
}

const server = await runSafeTests();
if (server.up && server.testMode) {
  if (LIVE) check("--live kräver en server utan APP_TEST_MODE", false, "live-testerna hoppades över");
  await runTestModeTests();
} else if (server.up && LIVE) {
  await runLiveTests();
} else if (server.up) {
  console.log("\n(starta servern med APP_TEST_MODE=1 för antispam och mejlkontroller,");
  console.log(" eller kör --live --email=<adress> mot en vanlig server för riktiga utskick)");
}

console.log(`\n=== ${passed}/${passed + failures.length} OK ===`);
if (failures.length) {
  console.log(failures.map((f) => `  FAIL: ${f}`).join("\n"));
  process.exit(1);
}
