/**
 * QA: asserts that the `bookings` table matches exactly what /api/booking writes.
 * Read only.
 *
 *   node --env-file=.env scripts/qa-schema.mjs
 *
 * Run this after applying scripts/supabase-bookings-migration.sql.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}` };

// column -> the PostgREST format the API layer must see for the insert to work.
const EXPECTED = {
  id: "int64",
  cleaning_type: "text",
  name: "text",
  email: "text",
  phone: "text",
  address: "text",
  date_time: "timestamp with time zone",
  total_price: "numeric",
  details: "jsonb",
  event_id: "text",
  created_at: "timestamp with time zone",
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

console.log("=== QA: schema för public.bookings ===\n");

let spec;
try {
  const res = await fetch(`${url}/rest/v1/`, { headers });
  spec = await res.json();
} catch (error) {
  console.log(`FAIL  Supabase nåbart — ${error.message}`);
  console.log("      (gratisnivån pausar projektet vid inaktivitet — väck det i dashboarden)");
  process.exit(1);
}

const table = spec.definitions?.bookings;
if (!table) {
  console.log("FAIL  Tabellen `bookings` finns inte");
  process.exit(1);
}
check("Tabellen `bookings` finns", true);

const actual = table.properties || {};

for (const [column, expectedFormat] of Object.entries(EXPECTED)) {
  const found = actual[column];
  if (!found) {
    check(`Kolumn ${column}`, false, "saknas — kör supabase-bookings-migration.sql");
    continue;
  }
  check(`Kolumn ${column}`, found.format === expectedFormat, `${found.format} (väntat ${expectedFormat})`);
}

const unexpected = Object.keys(actual).filter((c) => !(c in EXPECTED));
if (unexpected.length) console.log(`\n      Extra kolumner (ofarliga): ${unexpected.join(", ")}`);

// A round trip proves the insert path really works, not just that columns exist.
console.log("\n=== Insert-test (skrivs och raderas direkt) ===");
const probe = {
  cleaning_type: "QA schemakontroll",
  name: "QA",
  email: "qa@example.com",
  phone: "000",
  address: "QA",
  date_time: new Date().toISOString(),
  total_price: 1234.5,
  details: { qa: true },
  event_id: `qa-schema-probe-${Buffer.from(String(process.pid)).toString("hex")}`,
};

const insertRes = await fetch(`${url}/rest/v1/bookings`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
  body: JSON.stringify(probe),
});
const insertBody = await insertRes.json();

if (check(`Insert med alla fält lyckas`, insertRes.status === 201, insertBody?.message || `status ${insertRes.status}`)) {
  const row = insertBody[0];
  check(
    "total_price sparas som tal",
    Number(row.total_price) === probe.total_price,
    `${row.total_price}`
  );
  check(
    "date_time sparas som instant",
    new Date(row.date_time).toISOString() === probe.date_time,
    `${row.date_time}`
  );
  check("event_id sparas", row.event_id === probe.event_id);

  const del = await fetch(`${url}/rest/v1/bookings?id=eq.${row.id}`, { method: "DELETE", headers });
  console.log(`      testrad #${row.id} ${del.ok ? "raderad" : "KUNDE INTE RADERAS"}`);
}

console.log(`\n=== ${passed}/${passed + failures.length} OK ===`);
if (failures.length) {
  console.log(failures.map((f) => `  FAIL: ${f}`).join("\n"));
  process.exit(1);
}
