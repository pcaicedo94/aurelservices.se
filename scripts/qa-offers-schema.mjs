/**
 * QA: asserts that the five offer tables match exactly what the offer flow
 * writes, then proves the acceptance path end to end against the real
 * database: insert a request, an offer and an acceptance, try to accept the
 * same offer a second time, and clean everything up again.
 *
 * The second acceptance is the point of this script. Idempotency is the whole
 * defence against a double click forming two contracts, and it lives in a
 * database constraint, not in the code — so it can only be proved here.
 *
 * APP_TEST_MODE=1 does not apply: this calls Supabase's REST API directly, so
 * the probe rows are real even when the dev server runs in test mode.
 *
 *   node --env-file=.env scripts/qa-offers-schema.mjs
 *
 * Run after applying scripts/supabase-offers-migration.sql.
 */
import { createOfferToken } from "../utils/offerToken.js";
import { angerfristEndsAt, offerExpiresAt, linkValidUntil } from "../utils/offerRules.js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const writeHeaders = { ...headers, "Content-Type": "application/json", Prefer: "return=representation" };

// table -> column -> the PostgREST format the API layer must report.
const EXPECTED = {
  quote_requests: {
    id: "uuid",
    created_at: "timestamp with time zone",
    service: "text",
    name: "text",
    email: "text",
    details: "jsonb",
    status: "text",
  },
  offers: {
    id: "uuid",
    request_id: "uuid",
    token_selector: "text",
    token_verifier_hash: "text",
    expires_at: "timestamp with time zone",
    link_valid_until: "timestamp with time zone",
    snapshot: "jsonb",
    service: "text",
    arbetskostnad_incl_vat: "numeric",
    rut_deduction: "numeric",
    resetillagg_incl_vat: "numeric",
    total_to_pay: "numeric",
    travel_zone: "integer",
    service_at: "timestamp with time zone",
    requires_start_consent: "boolean",
    requires_discount_consent: "boolean",
    status: "text",
  },
  offer_acceptances: {
    id: "uuid",
    offer_id: "uuid",
    accepted_at: "timestamp with time zone",
    consent_info: "boolean",
    consent_start: "boolean",
    consent_lapse: "boolean",
    consent_discount: "boolean",
    button_label: "text",
    screen_snapshot: "jsonb",
    screen_sha256: "text",
    ip_hash: "text",
    user_agent: "text",
    angerfrist_ends_at: "timestamp with time zone",
  },
  withdrawals: {
    id: "uuid",
    offer_id: "uuid",
    submitted_at: "timestamp with time zone",
    received_at: "timestamp with time zone",
    consumer_name: "text",
    contract_ref: "text",
    receipt_to: "text",
    message_body: "jsonb",
    within_angerfrist: "boolean",
  },
  travel_zones: {
    // bigserial, unlike the uuid keys elsewhere: these rows are a price list
    // the office edits by hand, so a readable number beats a uuid here.
    id: "bigint",
    postnummer_from: "integer",
    postnummer_to: "integer",
    zone: "integer",
    fee_incl_vat: "numeric",
    label: "text",
  },
};

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

async function post(table, row) {
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: writeHeaders,
    body: JSON.stringify(row),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function remove(table, id) {
  const res = await fetch(`${url}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers });
  return res.ok;
}

console.log("=== QA: schema för offertflödet ===\n");

let spec;
try {
  const res = await fetch(`${url}/rest/v1/`, { headers });
  spec = await res.json();
} catch (error) {
  console.log(`FAIL  Supabase nåbart — ${error.message}`);
  console.log("      (gratisnivån pausar projektet vid inaktivitet — väck det i dashboarden)");
  process.exit(1);
}

for (const [table, columns] of Object.entries(EXPECTED)) {
  const definition = spec.definitions?.[table];
  if (!check(`Tabellen \`${table}\` finns`, Boolean(definition), definition ? "" : "kör migrationen")) {
    continue;
  }
  const actual = definition.properties || {};
  for (const [column, expectedFormat] of Object.entries(columns)) {
    const found = actual[column];
    if (!found) {
      check(`  ${table}.${column}`, false, "saknas");
      continue;
    }
    check(`  ${table}.${column}`, found.format === expectedFormat, `${found.format}`);
  }
}

/* ----------------------- the acceptance round trip ----------------------- */

console.log("\n=== Acceptans från början till slut (allt raderas efteråt) ===");

const created = { quote_requests: [], offers: [], offer_acceptances: [] };
let ok = true;

try {
  const request = await post("quote_requests", {
    service: "QA offertkontroll",
    name: "QA",
    email: "qa@example.com",
    details: { qa: true },
  });
  ok = check("Offertförfrågan sparas", request.status === 201, request.body?.message || `status ${request.status}`);
  if (!ok) throw new Error("stop");
  const requestId = request.body[0].id;
  created.quote_requests.push(requestId);

  const token = createOfferToken();
  const serviceAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  const expiresAt = offerExpiresAt({ createdAt: new Date(), serviceAt });
  const offer = await post("offers", {
    request_id: requestId,
    token_selector: token.selector,
    token_verifier_hash: token.verifierHash,
    expires_at: expiresAt.toISOString(),
    link_valid_until: linkValidUntil({ expiresAt }).toISOString(),
    snapshot: { qa: true, total_to_pay: 1234.5 },
    service: "QA offertkontroll",
    arbetskostnad_incl_vat: 1084.5,
    rut_deduction: 0,
    resetillagg_incl_vat: 150,
    total_to_pay: 1234.5,
    travel_zone: 1,
    service_at: serviceAt.toISOString(),
    status: "sent",
  });
  ok = check("Offert sparas", offer.status === 201, offer.body?.message || `status ${offer.status}`);
  if (!ok) throw new Error("stop");
  const offerId = offer.body[0].id;
  created.offers.push(offerId);

  check(
    "link_valid_until ligger efter expires_at",
    new Date(offer.body[0].link_valid_until) >= new Date(offer.body[0].expires_at),
    "villkoret offers_link_outlives_offer håller"
  );

  const acceptanceRow = {
    offer_id: offerId,
    consent_info: true,
    consent_start: false,
    consent_lapse: false,
    consent_discount: false,
    button_label: "Beställning förenad med betalningsskyldighet",
    screen_snapshot: { qa: true },
    screen_sha256: "0".repeat(64),
    angerfrist_ends_at: angerfristEndsAt(new Date()).toISOString(),
  };

  const first = await post("offer_acceptances", acceptanceRow);
  ok = check("Acceptans sparas", first.status === 201, first.body?.message || `status ${first.status}`);
  if (ok) created.offer_acceptances.push(first.body[0].id);

  // The one that matters: a second acceptance of the same offer must be
  // refused by the database, not merely avoided by the code.
  const second = await post("offer_acceptances", acceptanceRow);
  check(
    "Andra acceptansen avvisas av databasen",
    second.status === 409,
    `status ${second.status}${second.body?.code ? ` (${second.body.code})` : ""}`
  );
  check(
    "och avvisas just på offer_id",
    String(second.body?.message || second.body?.details || "").includes("offer_acceptances_offer_id_key"),
    second.body?.message || ""
  );
} catch {
  // Falls through to the cleanup below: a failed step must not leave rows.
} finally {
  console.log("\n      Städar upp…");
  for (const id of created.offer_acceptances) {
    console.log(`      acceptans ${id} ${(await remove("offer_acceptances", id)) ? "raderad" : "KUNDE INTE RADERAS"}`);
  }
  for (const id of created.offers) {
    console.log(`      offert ${id} ${(await remove("offers", id)) ? "raderad" : "KUNDE INTE RADERAS"}`);
  }
  for (const id of created.quote_requests) {
    console.log(`      förfrågan ${id} ${(await remove("quote_requests", id)) ? "raderad" : "KUNDE INTE RADERAS"}`);
  }
}

console.log(`\n=== ${passed}/${passed + failures.length} OK ===`);
if (failures.length) {
  console.log(failures.map((f) => `  FAIL: ${f}`).join("\n"));
  process.exit(1);
}
