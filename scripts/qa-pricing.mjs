/**
 * QA: prices. config/prices.json is the single source of truth and the
 * calculators reach it through lib/pricing.js, so this script checks the two
 * ends of that chain:
 *
 *   1. No calculator keeps a rate of its own. Each page is tokenized and every
 *      number it still spells out is compared with the figures lib/pricing.js
 *      hands it, so a rate that creeps back into the JSX fails the check.
 *   2. The figures themselves still match the client's price lists: Prislista
 *      2026 (pages 1-3) and the answers confirmed on 2026-09-17, including the
 *      rules the pages depend on (two billed hours, tiers that never drop,
 *      window add-ons that add up, the quote thresholds).
 *
 * It then lists, for information only, where the calculators still differ from
 * the price list and which entries wait for the client. No network, no side
 * effects.
 *
 *   node scripts/qa-pricing.mjs
 *
 * Exit code 1 only when a check fails; the reports never fail the run.
 */
import { readFileSync } from "node:fs";
import {
  containerCleaningPricePerUnit,
  CONTAINER_MAX_UNITS_ONLINE,
  CONTAINER_WEEKS_PER_MONTH,
  deepCleaningBasePrice,
  DEEP_CLEANING_EXTRAS,
  DEEP_CLEANING_QUOTE_ABOVE_AREA,
  estimateHours,
  homeCleaningHourlyRate,
  HOME_FREQUENCY_RATES,
  HOME_TIME_ESTIMATE,
  HOME_WEEKDAY_RATES,
  MIN_BILLABLE_HOURS,
  moveCleaningBasePrice,
  MOVE_CLEANING_EXTRAS,
  MOVE_TIME_ESTIMATE,
  OFFICE_FREQUENCIES,
  OFFICE_TIME_ESTIMATE,
  PRICE_FLAGS,
  WINDOW_BALCONY_PRICE,
  WINDOW_QUOTE_ABOVE_AREA,
  WINDOW_QUOTE_FROM_ROOMS,
  WINDOW_ROOM_PRICES,
  WINDOW_SURCHARGE_PERCENT,
  WINDOW_SURCHARGE_RATE,
} from "../lib/pricing.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const prices = JSON.parse(read("config/prices.json"));
const S = prices.services;

let passed = 0;
const failures = [];
function check(name, actual, expected) {
  const ok = actual === expected;
  if (ok) passed += 1;
  else failures.push(name);
  console.log(
    ok ? `PASS  ${name}` : `FAIL  ${name}\n        esperado: ${expected}\n        obtenido: ${actual}`
  );
}

const kr = (amount) => `${amount.toFixed(2)} kr`;

/* ----------------------- no rates left in the pages ----------------------- */

// Numbers inside comments, strings and JSX attributes are not rates the page
// prices with, so only code and JSX text are scanned. Template literals count
// as text plus the code inside their ${...} holes.
function numbersInCode(source) {
  const code = [];
  let i = 0;
  let line = 1;
  const lines = [];
  const keep = (char) => {
    code.push(char);
    lines.push(line);
  };
  const skip = (char) => {
    code.push(" ");
    lines.push(line);
    if (char === "\n") line += 1;
  };
  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];
    if (char === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") skip(source[i++]);
      continue;
    }
    if (char === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      const stop = end === -1 ? source.length : end + 2;
      while (i < stop) skip(source[i++]);
      continue;
    }
    if (char === '"' || char === "'") {
      skip(source[i++]);
      while (i < source.length && source[i] !== char) {
        if (source[i] === "\\") skip(source[i++]);
        if (i < source.length) skip(source[i++]);
      }
      if (i < source.length) skip(source[i++]);
      continue;
    }
    if (char === "`") {
      // Text of the template is dropped, the ${...} holes are kept as code.
      skip(source[i++]);
      let depth = 0;
      while (i < source.length && (depth > 0 || source[i] !== "`")) {
        if (depth === 0 && source[i] === "$" && source[i + 1] === "{") {
          depth = 1;
          skip(source[i++]);
          skip(source[i++]);
          continue;
        }
        if (depth > 0) {
          if (source[i] === "{") depth += 1;
          if (source[i] === "}") depth -= 1;
          keep(source[i++]);
          continue;
        }
        if (source[i] === "\\") skip(source[i++]);
        if (i < source.length) skip(source[i++]);
      }
      if (i < source.length) skip(source[i++]);
      continue;
    }
    keep(source[i++]);
    if (char === "\n") line += 1;
  }

  const text = code.join("");
  const found = [];
  // Skips numbers glued to a word or a dot, so ids and versions are left alone.
  for (const match of text.matchAll(/(?<![\w.$])\d+(?:\.\d+)?/g)) {
    found.push({ value: Number(match[0]), line: lines[match.index] });
  }
  return found;
}

// Every figure lib/pricing.js hands each page. If one of these turns up as a
// literal in the page, the page is pricing with its own copy again.
const PAGE_RATES = {
  "pages/homecleaning.js": {
    ...HOME_FREQUENCY_RATES,
    ...HOME_WEEKDAY_RATES,
    baseHours: HOME_TIME_ESTIMATE.baseHours,
    hoursPerSqm: HOME_TIME_ESTIMATE.hoursPerSqm,
  },
  "pages/deepcleaning.js": {
    ...DEEP_CLEANING_EXTRAS,
    quoteAboveArea: DEEP_CLEANING_QUOTE_ABOVE_AREA,
    ...Object.fromEntries([1, 50.5, 71, 101].map((area) => [`${area} m²`, deepCleaningBasePrice(area)])),
  },
  "pages/movecleaning.js": {
    ...MOVE_CLEANING_EXTRAS,
    baseHours: MOVE_TIME_ESTIMATE.baseHours,
    hoursPerSqm: MOVE_TIME_ESTIMATE.hoursPerSqm,
    ...Object.fromEntries(
      S.movecleaning.tiers.map((tier, index) => [
        `tramo ${index + 1}`,
        tier.price ?? tier.pricePerSqm,
      ])
    ),
  },
  "pages/windowcleaning.js": {
    ...WINDOW_ROOM_PRICES,
    balcony: WINDOW_BALCONY_PRICE,
    quoteAboveArea: WINDOW_QUOTE_ABOVE_AREA,
    quoteFromRooms: WINDOW_QUOTE_FROM_ROOMS,
    surchargePercent: WINDOW_SURCHARGE_PERCENT,
    surchargeRate: WINDOW_SURCHARGE_RATE,
  },
  "pages/officecleaning.js": {
    ...Object.fromEntries(
      Object.entries(OFFICE_FREQUENCIES).map(([id, plan]) => [`${id}/mes`, plan.hourlyRate])
    ),
    baseHours: OFFICE_TIME_ESTIMATE.baseHours,
    hoursPerSqm: OFFICE_TIME_ESTIMATE.hoursPerSqm,
  },
  "pages/containercleaning.js": {
    ...Object.fromEntries(
      S.containercleaning.tiers.flatMap((tier, index) =>
        Object.entries(tier.pricePerUnitByVisitsPerWeek).map(([visits, price]) => [
          `tramo ${index + 1}, ${visits}/semana`,
          price,
        ])
      )
    ),
    quoteAboveUnits: CONTAINER_MAX_UNITS_ONLINE,
    weeksPerMonth: CONTAINER_WEEKS_PER_MONTH,
  },
};

console.log("=== Ninguna calculadora guarda tarifas propias ===");
for (const [file, rates] of Object.entries(PAGE_RATES)) {
  const source = read(file);
  const problems = [];
  if (!/from "\.\.\/lib\/pricing"/.test(source)) problems.push("no importa ../lib/pricing");
  const byValue = new Map();
  for (const [name, value] of Object.entries(rates)) {
    if (typeof value !== "number") continue;
    if (!byValue.has(value)) byValue.set(value, []);
    byValue.get(value).push(name);
  }
  for (const { value, line } of numbersInCode(source)) {
    if (byValue.has(value)) problems.push(`${value} en la línea ${line} (${byValue.get(value).join(", ")})`);
  }
  check(file, problems.length ? problems.join("; ") : "sin números sueltos", "sin números sueltos");
}

/* ------------------- the formulas the pages apply on top ------------------ */

// Transcriptions of what each page does with the figures lib/pricing.js gives
// it. They hold no rate of their own, so the report below and the rule checks
// can quote the same amounts the visitor sees.
const homeHours = (area) => estimateHours(area, HOME_TIME_ESTIMATE);
const billable = (hours) => Math.max(MIN_BILLABLE_HOURS, hours);

function homePrice(area, frequency, weekday) {
  const rate = homeCleaningHourlyRate(frequency, weekday);
  if (!rate) return null;
  const sessions = frequency === "onetime" ? 1 : Number(frequency);
  return Math.round(billable(homeHours(area)) * rate * sessions);
}

function windowPrice(rooms, addOns = 0, balconyOnly = false) {
  const base = balconyOnly ? WINDOW_BALCONY_PRICE : WINDOW_ROOM_PRICES[rooms] || null;
  return base === null ? null : Math.round(base * (1 + WINDOW_SURCHARGE_RATE * addOns));
}

function officePrice(area, frequency) {
  const plan = OFFICE_FREQUENCIES[frequency];
  const hours = billable(Number(estimateHours(area, OFFICE_TIME_ESTIMATE).toFixed(2)));
  return plan ? Math.round(plan.hourlyRate * hours * Number(frequency)) : null;
}

function containerPrice(units, visitsPerWeek) {
  const perUnit = containerCleaningPricePerUnit(units, visitsPerWeek);
  return perUnit === null
    ? null
    : Math.round(perUnit * units * visitsPerWeek * CONTAINER_WEEKS_PER_MONTH);
}

/* ------------------ rules the client confirmed on 2026-09-17 --------------- */

console.log("\n=== Reglas confirmadas por el cliente (2026-09-17) ===");

check("Q14 mínimo de 2 horas facturadas", MIN_BILLABLE_HOURS, 2);
const tiny = 20;
check(
  `Q14 hemstädning de ${tiny} m² se factura como ${MIN_BILLABLE_HOURS} h`,
  homePrice(tiny, "4", 2),
  Math.round(MIN_BILLABLE_HOURS * HOME_WEEKDAY_RATES.mondayToWednesday * 4)
);
check(
  `Q14 kontorsstädning de ${tiny} m² se factura como ${MIN_BILLABLE_HOURS} h`,
  officePrice(tiny, "1"),
  Math.round(MIN_BILLABLE_HOURS * OFFICE_FREQUENCIES[1].hourlyRate)
);
check(
  "Q13 fin de semana sin tarifa de hemstädning",
  [0, 6].map((weekday) => String(homeCleaningHourlyRate("4", weekday))).join("/"),
  "null/null"
);

// Q22: the per-m² rate applies to the whole home, so without the floor the
// price would fall at 51, 101 and 151 m².
const drops = [];
let previous = 0;
for (let area = 1; area <= 300; area++) {
  const base = moveCleaningBasePrice(area);
  if (base < previous) drops.push(`${area} m² = ${base} kr`);
  previous = base;
}
check("Q22 flyttstädning nunca baja al cruzar un umbral", drops.join(", ") || "nunca baja", "nunca baja");
check(
  "Q22 el tramo empieza en el techo del anterior (51, 101 y 151 m²)",
  [51, 101, 151].map((area) => moveCleaningBasePrice(area)).join("/"),
  [50, 100, 150].map((area) => moveCleaningBasePrice(area)).join("/")
);

// Q20: the add-ons add up; compounding would give 1 099 × 1.25³ = 2 146,29 kr.
const rooms4 = WINDOW_ROOM_PRICES[4];
check(
  `Q20 fönsterputs: ${WINDOW_SURCHARGE_PERCENT} % por tillägg y aditivos`,
  [0, 1, 2, 3].map((count) => windowPrice("4", count)).join("/"),
  [0, 1, 2, 3].map((count) => Math.round(rooms4 * (1 + 0.25 * count))).join("/")
);
check(
  "Q20 tres tillägg suman 75 %, no componen 95,3 %",
  windowPrice("4", 3),
  Math.round(rooms4 * 1.75)
);
check(
  "Q20 los tillägg se aplican también a “endast balkong”",
  windowPrice("", 1, true),
  Math.round(WINDOW_BALCONY_PRICE * 1.25)
);

check("Q21 fönsterputs: oferta desde 5 rum", WINDOW_QUOTE_FROM_ROOMS, 5);
check("Q21 fönsterputs: oferta por encima de 120 m²", WINDOW_QUOTE_ABOVE_AREA, 120);
check("Q21 no hay precio para 5 rum", WINDOW_ROOM_PRICES[5] ?? null, null);
check(
  "Storstädning: oferta por encima de 150 m²",
  `${DEEP_CLEANING_QUOTE_ABOVE_AREA}/${deepCleaningBasePrice(DEEP_CLEANING_QUOTE_ABOVE_AREA + 1)}`,
  "150/null"
);
check(
  `Bodstädning: oferta por encima de ${CONTAINER_MAX_UNITS_ONLINE} bodar`,
  containerCleaningPricePerUnit(CONTAINER_MAX_UNITS_ONLINE + 1, 5),
  null
);
check(
  "Q23 privados: SEK, con IVA, después de RUT",
  ["homecleaning", "deepcleaning", "movecleaning", "windowcleaning"]
    .map((id) => `${PRICE_FLAGS[id].includesVat}/${PRICE_FLAGS[id].afterRut}`)
    .join(" "),
  "true/true true/true true/true true/true"
);
check(
  "Q26–Q28 empresas: sin IVA, estimación y siempre offert",
  ["officecleaning", "containercleaning"]
    .map((id) => {
      const f = PRICE_FLAGS[id];
      return `${f.includesVat}/${f.priceIsEstimate}/${f.alwaysQuoted}`;
    })
    .join(" "),
  "false/true/true false/true/true"
);

/* ---------------- prices.json against the printed price list -------------- */

// Prislista 2026 exactly as printed on pages 1-3, used only for comparison.
const PRISLISTA = {
  homeWeekdays: { monday: 200, tuesday: 200, wednesday: 200, thursday: 220, friday: 220 },
  homeMonthly: 245,
  homeOneTime: 270,
  homeMinHours: 2,
  deep: [
    { from: 1, to: 50, price: 2650 },
    { from: 51, to: 70, price: 3290 },
    { from: 71, to: 100, price: 3950 },
    { from: 101, to: 149, price: 4750 },
  ],
  deepQuoteFrom: 151,
  deepExtrasFrom: { kylFrys: 360, kylFrysDefrost: 500, kapGarderob: 360, forrad: 300 },
  move: [
    { from: 1, to: 50, fixed: 2890 },
    { from: 51, to: 100, perSqm: 51 },
    { from: 101, to: 150, perSqm: 47 },
    { from: 151, to: Infinity, perSqm: 42 },
  ],
  windowRooms: { 1: 799, 2: 899, 3: 999, 4: 1099 },
  windowBalconyFrom: 450,
  windowSurchargePercent: 25,
};

console.log("\n=== Las tarifas entregadas a las páginas frente a la Prislista 2026 (págs. 1–3) ===");
check(
  "Hemstädning lun–vie 200/200/200/220/220 kr/h",
  [1, 2, 3, 4, 5].map((weekday) => homeCleaningHourlyRate("4", weekday)).join("/"),
  Object.values(PRISLISTA.homeWeekdays).join("/")
);
check("Hemstädning una vez al mes 245 kr/h", HOME_FREQUENCY_RATES[1], PRISLISTA.homeMonthly);
check("Enstaka hemstädning 270 kr/h", HOME_FREQUENCY_RATES.onetime, PRISLISTA.homeOneTime);
check("Minsta debitering 2 h", MIN_BILLABLE_HOURS, PRISLISTA.homeMinHours);
check(
  "Estimación de horas 1,57 + 0,0167 × m² en las tres páginas que la usan",
  [HOME_TIME_ESTIMATE, MOVE_TIME_ESTIMATE, OFFICE_TIME_ESTIMATE]
    .map((e) => `${e.baseHours}+${e.hoursPerSqm}`)
    .join(" "),
  "1.57+0.0167 1.57+0.0167 1.57+0.0167"
);

const deepMismatches = [];
for (let area = 1; area <= 300; area++) {
  const listed = PRISLISTA.deep.find((tier) => area >= tier.from && area <= tier.to);
  const base = deepCleaningBasePrice(area);
  if (listed && base !== listed.price) deepMismatches.push(`${area} m² = ${base} kr`);
  if (area >= PRISLISTA.deepQuoteFrom && base !== null) deepMismatches.push(`${area} m² sin oferta`);
}
check(
  "Storstädning: precio de 1–149 m² y oferta desde 151 m²",
  deepMismatches.join(", ") || "coincide",
  "coincide"
);
for (const [id, from] of Object.entries(PRISLISTA.deepExtrasFrom)) {
  check(`Storstädning tillägg "${S.deepcleaning.extras[id].label}" desde ${from} kr`, DEEP_CLEANING_EXTRAS[id], from);
}

// The floor from Q22 only ever raises a price, so the printed rate must still
// be what the page charges at the top of every band.
const moveMismatches = [];
for (const tier of PRISLISTA.move) {
  const area = tier.to === Infinity ? 300 : tier.to;
  const expected = tier.fixed ?? area * tier.perSqm;
  const base = moveCleaningBasePrice(area);
  if (base !== expected) moveMismatches.push(`${area} m² = ${base} kr, la lista dice ${expected} kr`);
}
check("Flyttstädning: la tarifa impresa vale en el techo de cada tramo", moveMismatches.join(", ") || "coincide", "coincide");

check(
  "Fönsterputs 1–4 rum",
  ["1", "2", "3", "4"].map((rooms) => WINDOW_ROOM_PRICES[rooms]).join("/"),
  Object.values(PRISLISTA.windowRooms).join("/")
);
check("Endast balkong desde 450 kr", WINDOW_BALCONY_PRICE, PRISLISTA.windowBalconyFrom);
check("Recargo de ventanas del 25 %", WINDOW_SURCHARGE_PERCENT, PRISLISTA.windowSurchargePercent);

/* ------------------------------ discrepancies ------------------------------ */

const findings = new Map();
function finding(group, text) {
  if (!findings.has(group)) findings.set(group, []);
  findings.get(group).push(text);
}

// Q14 two-hour minimum
const minArea = (MIN_BILLABLE_HOURS - HOME_TIME_ESTIMATE.baseHours) / HOME_TIME_ESTIMATE.hoursPerSqm;
finding(
  "Q14",
  `Por debajo de ${minArea.toFixed(1)} m² la estimación es menor de 2 h, así que el mínimo de ${MIN_BILLABLE_HOURS} h decide el precio: 20 m² cada semana (martes) = ${kr(homePrice(20, "4", 2))}/mes.`
);
finding(
  "Q14",
  `La Prislista pone el mínimo bajo las tarifas recurrentes y no aclara si vale para enstaka; la calculadora lo aplica también ahí: 20 m² enstaka = ${kr(homePrice(20, "onetime", 2))}.`
);

// Q15 material
if (S.homecleaning.material.companyProductsPrice === null) {
  finding("Q15", "Hemstädning recurrente: el cliente pone los productos; si los pone Aurel se facturan, pero no hay precio y la calculadora no los contempla.");
}
finding("Q15", "Enstaka hemstädning (270 kr/h \"med Aurel städmaterial\"): no se dice si incluye equipo (aspiradora…) ni si la nota OBS sobre productos del cliente también aplica.");

// Q17 move-out extras
for (const [id, extra] of Object.entries(S.movecleaning.extras)) {
  const price = extra.type === "perEstimatedHour" ? `${MOVE_CLEANING_EXTRAS[id]} kr/h estimada` : `${MOVE_CLEANING_EXTRAS[id]} kr`;
  finding("Q17", `Flyttstädning "${extra.label}": ${price}, solo en la calculadora (no está en las págs. 1–3).`);
}
finding(
  "Q17",
  `"Kyl/Frys med avfrostning" cuesta ${MOVE_CLEANING_EXTRAS.kylFrysDefrost} kr en flyttstädning y ${DEEP_CLEANING_EXTRAS.kylFrysDefrost} kr en storstädning.`
);
const biytorHours = Number(estimateHours(80, MOVE_TIME_ESTIMATE).toFixed(2));
finding(
  "Q17",
  `Biytor = ${MOVE_CLEANING_EXTRAS.biytor} kr × horas estimadas de TODA la vivienda: 80 m² → ${biytorHours} h → +${kr(biytorHours * MOVE_CLEANING_EXTRAS.biytor)}, sin relación con el tamaño del trastero o balcón.`
);

// Q18 deep-cleaning extras
for (const [id, extra] of Object.entries(S.deepcleaning.extras)) {
  const from = PRISLISTA.deepExtrasFrom[id];
  if (from === undefined) {
    finding("Q18", `Storstädning "${extra.label}": ${DEEP_CLEANING_EXTRAS[id]} kr${extra.unit ? `/${extra.unit}` : ""}, solo en la calculadora.`);
  } else {
    finding("Q18", `Storstädning "${extra.label}": la Prislista dice "Från ${from} kr" y la calculadora cobra ${from} kr fijos.`);
  }
}

// Q20 window surcharges
finding(
  "Q20",
  `"Endast balkong" es "Från ${WINDOW_BALCONY_PRICE} kr", pero la calculadora cobra ${WINDOW_BALCONY_PRICE} kr fijos y le aplica los tillägg (con spröjs: ${kr(windowPrice("", 1, true))}).`
);

// Q21 window quote threshold
finding(
  "Q21",
  `5 rum: la Prislista pide oferta y el docx da precio directo "upp till 5 rum och kök" (oferta solo si son más); ninguna fuente da precio para ${WINDOW_QUOTE_FROM_ROOMS} rum. La calculadora pide oferta.`
);

// Q22 move-out thresholds
finding(
  "Q22",
  `Con la regla del cliente el precio se aplana en cada umbral: 50 m² = ${kr(moveCleaningBasePrice(50))} igual que 51–56 m², y 100 m² = ${kr(moveCleaningBasePrice(100))} igual que 101–108 m².`
);
finding(
  "Q22",
  `Storstädning 150 m²: el tramo no existe en la Prislista, que pasa de "101–149 kvm" a "Över 151 kvm"; la calculadora cobra ${kr(deepCleaningBasePrice(150))} hasta 150 m² y oferta por encima.`
);

// Business
const officeRates = Object.values(OFFICE_FREQUENCIES).map((plan) => `${plan.label} ${plan.hourlyRate} kr/h`);
finding("Q26–Q28", `Kontorsstädning: ${officeRates.join(", ")}; sin lista de precios de empresa que confirmarlo.`);
finding(
  "Q26–Q28",
  `Bodstädning: tramos por número de bodar y visitas/semana "exkl. moms"; el mes se calcula como ${CONTAINER_WEEKS_PER_MONTH} semanas (10 bodar, 1/semana = ${kr(containerPrice(10, 1))}).`
);

// Not in the client questionnaire yet
const NO_Q = "Sin pregunta asignada (proponer)";
finding(NO_Q, "Recargo por vivienda muy sucia: hay que aclarar si es 20 % fijo (Prislista: \"tilläggskostnad på 20%\") o hasta 20 % (docx: \"upp till 20 procent\"); ninguna calculadora lo contempla y solo aparece como aviso.");
finding(NO_Q, `La estimación de horas (${HOME_TIME_ESTIMATE.baseHours} + ${HOME_TIME_ESTIMATE.hoursPerSqm} × m²) no figura en la Prislista y determina el precio de hemstädning, kontorsstädning y del extra biytor.`);
const unrounded = billable(homeHours(120)) * HOME_WEEKDAY_RATES.mondayToWednesday * 2;
const rounded = billable(Number(homeHours(120).toFixed(2))) * HOME_WEEKDAY_RATES.mondayToWednesday * 2;
finding(
  NO_Q,
  `Redondeo distinto: hemstädning multiplica las horas sin redondear y kontorsstädning/biytor las redondeadas (120 m² cada dos semanas, lunes: ${kr(unrounded)} frente a ${kr(rounded)}).`
);
finding(NO_Q, "\"Varje vecka\" se calcula como 4 visitas al mes, no 4,33.");

// Other price sources still in the code
const OTHER_SOURCES = [
  ["components/ChatBot/FAQbot.js", "från 180 kr/timme", "Chatbot: hemstädning \"från 180 kr/timme\" (Prislista: 200–270 kr/h)"],
  ["components/ChatBot/FAQbot.js", "195 kr per timme", "Chatbot: jueves y viernes 195 kr/h (Prislista: 220 kr/h)"],
  ["components/ChatBot/FAQbot.js", "325 kr/timme", "Chatbot: \"standardpriset är 325 kr/timme inklusive moms\""],
  ["components/ChatBot/FAQbot.js", "Inglasad balkong – +400 kr", "Chatbot: fönsterputs \"Inglasad balkong +400 kr\" (ni Prislista ni calculadora)"],
  ["components/HomeForm/HomeForm.jsx", "{ range: [1, 50], price: 180 }", "Formulario de la portada: tabla propia (hemstädning 180/150/120, flytt 3 400/80/75, storstädning 2 400–4 800)"],
];
for (const [file, needle, text] of OTHER_SOURCES) {
  let present = false;
  try {
    present = read(file).includes(needle);
  } catch {
    present = false;
  }
  if (present) finding("Otras fuentes de precios en el código", `${text} — ${file}`);
}

console.log("\n=== Discrepancias con la Prislista 2026 ===");
for (const [group, lines] of findings) {
  console.log(`\n[${group}]`);
  for (const line of lines) console.log(`  · ${line}`);
}

/* ------------------------- pending in prices.json ------------------------- */

const pending = [];
(function collect(node, path) {
  if (Array.isArray(node)) {
    node.forEach((child, index) => collect(child, `${path}[${index}]`));
  } else if (node && typeof node === "object") {
    if (node.pendingConfirmation) pending.push({ path, question: node.question || "sin pregunta" });
    for (const [key, child] of Object.entries(node)) collect(child, path ? `${path}.${key}` : key);
  }
})(prices.services, "");

console.log(`\n=== Pendientes de confirmar en prices.json (${pending.length}) ===`);
const byQuestion = new Map();
for (const { path, question } of pending) {
  if (!byQuestion.has(question)) byQuestion.set(question, []);
  byQuestion.get(question).push(path);
}
for (const [question, paths] of [...byQuestion].sort(([a], [b]) => a.localeCompare(b, "sv", { numeric: true }))) {
  console.log(`  ${question}: ${paths.join(", ")}`);
}

console.log(`\n=== ${passed}/${passed + failures.length} OK ===`);
if (failures.length) {
  console.log(failures.map((name) => `  FAIL: ${name}`).join("\n"));
  process.exitCode = 1;
}
