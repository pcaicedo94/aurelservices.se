/**
 * QA: prices. config/prices.json is the single source of truth and the
 * calculators reach it through lib/pricing.js, so this script checks the two
 * ends of that chain:
 *
 *   1. No calculator keeps a rate of its own. Each page is tokenized and every
 *      number it still spells out is compared with the figures lib/pricing.js
 *      hands it, so a rate that creeps back into the JSX fails the check.
 *   2. The figures themselves still match the client's price lists: Prislista
 *      för privatpersoner Aurel 2027, the flyttstädning calculation spec that
 *      came with it, and the answers confirmed on 2026-09-17 and 2026-10-15,
 *      including the rules the pages depend on (two billed hours, bands that
 *      never drop, the quote thresholds, the minimum that binds in each
 *      flyttstädning band).
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
  HOME_MONTHLY_RATE,
  HOME_ONETIME_RATES,
  HOME_TIME_ESTIMATE,
  HOME_WEEKDAY_RATES,
  MIN_BILLABLE_HOURS,
  moveCleaningBasePrice,
  MOVE_CLEANING_EXTRAS,
  MOVE_CLEANING_QUOTE_ABOVE_AREA,
  MOVE_TIME_ESTIMATE,
  OFFICE_FREQUENCIES,
  OFFICE_TIME_ESTIMATE,
  PRICE_FLAGS,
  SOILING_SURCHARGE_MAX_PERCENT,
  WINDOW_BALCONY_PRICE,
  WINDOW_QUOTE_ABOVE_AREA,
  WINDOW_QUOTE_FROM_ROOMS,
  WINDOW_EXTRA_BAGE_PRICES,
  windowExtraBagePrice,
  windowIncludedBagar,
  WINDOW_INCLUDED_BAGAR_PER_ROOM,
  WINDOW_ROOM_PRICES,
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
  "pages/tjanster/hemstadning.js": {
    monthly: HOME_MONTHLY_RATE,
    ...HOME_ONETIME_RATES,
    ...HOME_WEEKDAY_RATES,
    baseHours: HOME_TIME_ESTIMATE.baseHours,
    hoursPerSqm: HOME_TIME_ESTIMATE.hoursPerSqm,
  },
  "pages/tjanster/storstadning.js": {
    ...DEEP_CLEANING_EXTRAS,
    quoteAboveArea: DEEP_CLEANING_QUOTE_ABOVE_AREA,
    ...Object.fromEntries([1, 50.5, 71, 101].map((area) => [`${area} m²`, deepCleaningBasePrice(area)])),
  },
  "pages/tjanster/flyttstadning.js": {
    ...MOVE_CLEANING_EXTRAS,
    baseHours: MOVE_TIME_ESTIMATE.baseHours,
    hoursPerSqm: MOVE_TIME_ESTIMATE.hoursPerSqm,
    quoteAboveArea: MOVE_CLEANING_QUOTE_ABOVE_AREA,
    ...Object.fromEntries(
      S.movecleaning.tiers.flatMap((tier, index) => [
        [`tramo ${index + 1}`, tier.price ?? tier.pricePerSqm],
        [`tramo ${index + 1}, mínimo`, tier.minPrice ?? null],
      ])
    ),
  },
  "pages/tjanster/fonsterputs.js": {
    ...WINDOW_ROOM_PRICES,
    balcony: WINDOW_BALCONY_PRICE,
    quoteAboveArea: WINDOW_QUOTE_ABOVE_AREA,
    quoteFromRooms: WINDOW_QUOTE_FROM_ROOMS,
    extraBagePlain: WINDOW_EXTRA_BAGE_PRICES.plain,
    extraBageSprojs: WINDOW_EXTRA_BAGE_PRICES.sprojs,
  },
  "pages/foretag/kontorsstadning.js": {
    ...Object.fromEntries(
      Object.entries(OFFICE_FREQUENCIES).map(([id, plan]) => [`${id}/mes`, plan.hourlyRate])
    ),
    baseHours: OFFICE_TIME_ESTIMATE.baseHours,
    hoursPerSqm: OFFICE_TIME_ESTIMATE.hoursPerSqm,
  },
  "pages/foretag/bodstadning.js": {
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
  // The depth of the relative path depends on where the page sits
  // (pages/tjanster/... is one level deeper than pages/...), so match any
  // number of "../" segments instead of hard-coding one.
  if (!/from "(?:\.\.\/)+lib\/pricing"/.test(source)) problems.push("no importa lib/pricing");
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

// Since the 2027 list the room price IS the price: nothing multiplies it. The
// two conditions the list still singles out (svåråtkomliga, kraftigt
// nedsmutsade fönster) are "Offert", which the page shows instead of a figure.
function windowPrice(rooms, balconyOnly = false) {
  const base = balconyOnly ? WINDOW_BALCONY_PRICE : WINDOW_ROOM_PRICES[rooms] || null;
  return base === null ? null : Math.round(base);
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
// Q13 was reopened on 2026-11-24: the 2027 list prices Saturday, so only
// Sunday is left without a rate and it is the only day that cannot be booked.
check(
  "Q13 el domingo sigue sin tarifa, en los cuatro planes",
  ["onetime", "1", "2", "4"].map((f) => String(homeCleaningHourlyRate(f, 0))).join("/"),
  "null/270/null/null"
);
check(
  "Q13 el sábado ya tiene tarifa: abono 320, puntual 400",
  `${homeCleaningHourlyRate("4", 6)}/${homeCleaningHourlyRate("onetime", 6)}`,
  `${HOME_WEEKDAY_RATES.saturday}/${HOME_ONETIME_RATES.saturday}`
);
check(
  "Q13 el sábado es el día más caro de la semana",
  HOME_WEEKDAY_RATES.saturday > HOME_WEEKDAY_RATES.thursdayToFriday &&
    HOME_ONETIME_RATES.saturday > HOME_ONETIME_RATES.weekday,
  true
);

// The rate applies to the whole home, so without a floor under each band the
// price would fall every time one is crossed. Two rules hold it up: each 2027
// band carries its own minimum, and Q22 forbids pricing below the top of the
// previous band.
const drops = [];
let previous = 0;
for (let area = 1; area <= MOVE_CLEANING_QUOTE_ABOVE_AREA; area++) {
  const base = moveCleaningBasePrice(area);
  if (base < previous) drops.push(`${area} m² = ${base} kr`);
  previous = base;
}
check("Flyttstädning nunca baja al cruzar un umbral", drops.join(", ") || "nunca baja", "nunca baja");

// The spec prints the exact area at which each band's minimum stops deciding
// the price ("Mínimo hasta"). A typo in any rate or any minimum would move one
// of these five crossovers, so they pin both columns of the table at once.
const CROSSOVERS = [49, 59, 79, 109, 133];
const crossoverFaults = [];
for (const [index, area] of CROSSOVERS.entries()) {
  const tier = S.movecleaning.tiers[index];
  if (moveCleaningBasePrice(area) !== tier.minPrice) {
    crossoverFaults.push(`${area} m² no cobra el mínimo ${tier.minPrice} kr`);
  }
  if (moveCleaningBasePrice(area + 1) !== (area + 1) * tier.pricePerSqm) {
    crossoverFaults.push(`${area + 1} m² no cobra ${tier.pricePerSqm} kr/m²`);
  }
}
check(
  `Flyttstädning: el mínimo manda hasta ${CROSSOVERS.join(", ")} m² y ni un m² más`,
  crossoverFaults.join(", ") || "coincide",
  "coincide"
);
check(
  "Flyttstädning: nunca se suman tarifa y mínimo",
  S.movecleaning.tiers.every((tier, index) => {
    const top = tier.maxSqm;
    return moveCleaningBasePrice(top) === Math.max(top * tier.pricePerSqm, tier.minPrice);
  }),
  true
);
check(
  `Flyttstädning: oferta por encima de ${MOVE_CLEANING_QUOTE_ABOVE_AREA} m²`,
  `${moveCleaningBasePrice(MOVE_CLEANING_QUOTE_ABOVE_AREA)}/${moveCleaningBasePrice(
    MOVE_CLEANING_QUOTE_ABOVE_AREA + 1
  )}`,
  "7650/null"
);

// Fönsterputs: the room price is the whole price since the 2027 list.
const rooms4 = WINDOW_ROOM_PRICES[4];
check("Fönsterputs: el precio por rum no se multiplica por nada", windowPrice("4"), rooms4);
check(
  "Fönsterputs: ya no existe ningún recargo porcentual",
  Object.keys(S.windowcleaning).includes("surcharges"),
  false
);
check(
  "Fönsterputs: los dos casos que la lista manda a offert no llevan importe",
  ["svaratkomligaFonster", "kraftigtNedsmutsadeFonster"]
    .map((id) => `${S.windowcleaning.extras[id].type}:${S.windowcleaning.extras[id].price}`)
    .join(" "),
  "quote:null quote:null"
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

// Transcribed by hand from the two documents the client sent on 2026-11-24, and
// used only for comparison: these literals are the independent copy that
// catches a typo in config/prices.json. Do not derive them from the JSON.
//
//   Prislista för privatpersoner Aurel 2027.docx
//   Flyttstädning kalkyl.pdf  (the flyttstädning table and its examples)
const PRISLISTA = {
  homeWeekdays: { monday: 210, tuesday: 210, wednesday: 210, thursday: 230, friday: 230 },
  homeSaturday: 320,
  homeMonthly: 270,
  homeOneTime: 300,
  homeOneTimeSaturday: 400,
  homeMinHours: 2,
  deep: [
    { from: 1, to: 50, price: 2890 },
    { from: 51, to: 70, price: 3590 },
    { from: 71, to: 100, price: 4290 },
    { from: 101, to: 149, price: 5190 },
  ],
  deepQuoteFrom: 151,
  // The 2027 list prices only two storstädning add-ons, and by the hour. The
  // site keeps the fixed prices the client confirmed on 2026-09-17; see the
  // findings below and Q18b in config/prices.json.
  deepExtrasHourlyFrom2027: { kapGarderob: 200, forrad: 170 },
  deepExtrasKept: {
    kylFrys: 360,
    kylFrysDefrost: 500,
    diskmaskin: 250,
    kapGarderob: 360,
    forrad: 300,
    tvattmaskin: 390,
    vaggtvatt: 250,
  },
  move: [
    { from: 1, to: 50, perSqm: 60, min: 2990 },
    { from: 51, to: 70, perSqm: 55, min: 3290 },
    { from: 71, to: 100, perSqm: 54, min: 4290 },
    { from: 101, to: 120, perSqm: 53, min: 5790 },
    { from: 121, to: 150, perSqm: 51, min: 6790 },
  ],
  moveQuoteFrom: 151,
  // Section 3 of the spec, "Ejemplos de comprobación": the client's own worked
  // examples. They are the cheapest real test there is of the whole method.
  moveExamples: [
    [35, 2990],
    [55, 3290],
    [65, 3575],
    [75, 4290],
    [90, 4860],
    [100, 5400],
    [140, 7140],
  ],
  windowRooms: { 1: 920, 2: 1040, 3: 1150, 4: 1290 },
  windowBalconyFrom: 450,
  windowExtras: {
    extraBageUtanSprojs: 110,
    extraBageMedSprojs: 140,
    overhangdaFonster: 160,
  },
};

console.log("\n=== Las tarifas entregadas a las páginas frente a la Prislista 2027 ===");
check(
  "Hemstädning lun–vie 210/210/210/230/230 kr/h",
  [1, 2, 3, 4, 5].map((weekday) => homeCleaningHourlyRate("4", weekday)).join("/"),
  Object.values(PRISLISTA.homeWeekdays).join("/")
);
check("Hemstädning sábado 320 kr/h", homeCleaningHourlyRate("4", 6), PRISLISTA.homeSaturday);
check("Hemstädning una vez al mes 270 kr/h", HOME_MONTHLY_RATE, PRISLISTA.homeMonthly);
check("Enstaka hemstädning lun–vie 300 kr/h", HOME_ONETIME_RATES.weekday, PRISLISTA.homeOneTime);
check(
  "Enstaka hemstädning sábado 400 kr/h",
  HOME_ONETIME_RATES.saturday,
  PRISLISTA.homeOneTimeSaturday
);
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
// The add-ons are deliberately unchanged by the 2027 list: it names only two of
// the seven, and of the 2026 list only 3 of 7 pages ever reached us, so silence
// in one sheet is not evidence that Aurel stopped selling the rest (Q18b).
for (const [id, price] of Object.entries(PRISLISTA.deepExtrasKept)) {
  check(
    `Storstädning tillägg "${S.deepcleaning.extras[id].label}" sigue en ${price} kr`,
    DEEP_CLEANING_EXTRAS[id],
    price
  );
}
check(
  "Storstädning: los siete tillägg siguen ahí",
  Object.keys(S.deepcleaning.extras).length,
  Object.keys(PRISLISTA.deepExtrasKept).length
);

// Every m² from 1 to 150 against the printed table, plus the sizes the list no
// longer prices. A floor only ever raises a price, so the printed rate must
// still be what the page charges at the top of every band.
const moveMismatches = [];
for (let area = 1; area <= 300; area++) {
  const tier = PRISLISTA.move.find((band) => area >= band.from && area <= band.to);
  const base = moveCleaningBasePrice(area);
  if (tier) {
    const expected = Math.max(area * tier.perSqm, tier.min);
    if (base !== expected) moveMismatches.push(`${area} m² = ${base} kr, la lista dice ${expected} kr`);
  } else if (area >= PRISLISTA.moveQuoteFrom && base !== null) {
    moveMismatches.push(`${area} m² da precio en vez de oferta`);
  }
}
check(
  "Flyttstädning: los 150 m² de la tabla, m² a m², y oferta desde 151",
  moveMismatches.join(", ") || "coincide",
  "coincide"
);

// The client's own worked examples, which exercise both columns at once.
const exampleFaults = PRISLISTA.moveExamples
  .filter(([area, price]) => moveCleaningBasePrice(area) !== price)
  .map(([area, price]) => `${area} m² = ${moveCleaningBasePrice(area)} kr, el cálculo dice ${price} kr`);
check(
  `Flyttstädning: los ${PRISLISTA.moveExamples.length} ejemplos del cálculo del cliente`,
  exampleFaults.join(", ") || "coinciden",
  "coinciden"
);

check(
  "Fönsterputs 1–4 rum",
  ["1", "2", "3", "4"].map((rooms) => WINDOW_ROOM_PRICES[rooms]).join("/"),
  Object.values(PRISLISTA.windowRooms).join("/")
);
check("Balkonginglasning desde 450 kr", WINDOW_BALCONY_PRICE, PRISLISTA.windowBalconyFrom);
// Recorded but not charged by the calculator: a price per EXTRA frame needs the
// number of frames a room price includes, which the 2027 list never says (Q20b).
for (const [id, price] of Object.entries(PRISLISTA.windowExtras)) {
  check(
    `Fönsterputs tillägg "${S.windowcleaning.extras[id].label}" ${price} kr`,
    S.windowcleaning.extras[id].price,
    price
  );
}
// Q20b (client, confirmed 2026-11-25): three frames per rum are included, so
// the price of an extra one finally means something and the calculator charges
// it. Before that answer it could not: the list prices an EXTRA frame without
// ever saying how many come with the room.
check(
  "Fönsterputs: la calculadora ya cobra los bastidores extra",
  S.windowcleaning.extrasNote.shownByCalculator,
  true
);
check(
  "Q20b el precio por rum incluye 3 bågar, contados por rum y no por «rum och kök»",
  [1, 2, 3, 4].map((rooms) => windowIncludedBagar(rooms)).join("/"),
  [3, 6, 9, 12].join("/")
);
check(
  "Q20b una vivienda dentro de sus bågar incluidos no paga extra",
  [0, 1, 5, 9].map((count) => windowExtraBagePrice(count, 3)).join("/"),
  "0/0/0/0"
);
check(
  `Q20b cada båge extra cuesta ${WINDOW_EXTRA_BAGE_PRICES.plain} kr, o ${WINDOW_EXTRA_BAGE_PRICES.sprojs} kr con spröjs`,
  `${windowExtraBagePrice(12, 3, false)}/${windowExtraBagePrice(12, 3, true)}`,
  `${3 * WINDOW_EXTRA_BAGE_PRICES.plain}/${3 * WINDOW_EXTRA_BAGE_PRICES.sprojs}`
);
check(
  "Q20b spröjs ya no se cobra sobre el precio base, solo sobre los extras",
  windowExtraBagePrice(windowIncludedBagar(3), 3, true),
  0
);
check(
  "Q20b sin rum (solo balcón) no hay bågar incluidos ni extras que cobrar",
  `${windowIncludedBagar(null)}/${windowExtraBagePrice(0, null, true)}`,
  "0/0"
);
check(
  "Q20b los tres casos que siguen en offert no los cobra la calculadora",
  ["overhangdaFonster", "svaratkomligaFonster", "kraftigtNedsmutsadeFonster"]
    .map((id) => S.windowcleaning.extras[id].chargedByCalculator)
    .join("/"),
  "false/false/false"
);

/* ------------- the FAQ quotes the same figures as the price list ----------- */

// components/Faq/FaqContent.js is the one customer-facing surface that writes
// its figures out by hand: it is prose, and the same strings feed the FAQPage
// JSON-LD, so a stale number there is published to Google too. Nothing but
// this block keeps it tied to config/prices.json — and the 2027 list did
// falsify two of its answers, which is why the block exists.
console.log("\n=== El FAQ cita las mismas cifras que la lista ===");
const faq = read("components/Faq/FaqContent.js");

check(
  "FAQ: el recargo por suciedad nombra los dos techos, por servicio",
  faq.includes(`upp till ${SOILING_SURCHARGE_MAX_PERCENT.deepcleaning} procent vid storstädning`) &&
    faq.includes(`upp till ${SOILING_SURCHARGE_MAX_PERCENT.movecleaning} procent vid flyttstädning`),
  true
);
check(
  "FAQ: ya no promete ningún recargo porcentual de fönsterputs",
  /till(ä|a)gg p(å|a) \d+ procent vardera/.test(faq),
  false
);
check(
  "FAQ: el umbral de offert de fönsterputs sale de los datos",
  faq.includes(`större än ${WINDOW_QUOTE_ABOVE_AREA} kvadratmeter`),
  true
);
check(
  "FAQ: el plazo de cancelación coincide con los datos",
  faq.includes(`${prices.terms.cancellationNoticeHours.value} timmar`) &&
    faq.includes(`${prices.terms.cancellationNoticeDays.value} dagar`),
  true
);
// Textosweb (2026-11-26): the no-access ceiling, the flyttstädning guarantee
// and the provstädning window are also written out by hand.
check(
  "FAQ: el techo sin tillträde coincide con los datos",
  faq.includes(`högst ${prices.terms.noAccessFeeMaxPercent.value} procent`),
  true
);
check(
  "FAQ: la garantía de flyttstädning coincide con los datos",
  faq.includes(`${prices.terms.satisfactionGuaranteeHours.value} timmar efter avslutad städning`),
  true
);
check(
  "FAQ: el plazo de la provstädning coincide con los datos",
  faq.includes(`${prices.terms.trialCleaning.adjustWithinDays} kalenderdagar`),
  true
);
check(
  "FAQ: ya no cita la penalización del 100 % ni el plazo de 48 h para cancelar",
  /100 procent|48 timmar \(2 dagar\)/.test(faq),
  false
);
check(
  "FAQ: la factura cuesta lo que dicen los datos",
  faq.includes(`${prices.terms.invoiceFee.value} kr`),
  true
);
check(
  "FAQ: el precio por båge extra coincide con los datos",
  faq.includes(`${WINDOW_EXTRA_BAGE_PRICES.plain} kr`) &&
    faq.includes(`${WINDOW_EXTRA_BAGE_PRICES.sprojs} kr`),
  true
);
// Spelled out in Swedish prose, so the figure is matched as a word. Three is
// the only number this answer can name; if the client ever changes it, the
// check fails and the sentence has to be rewritten rather than silently drift.
check(
  "FAQ: dice cuántos bågar incluye el precio por rum",
  /ingår tre fönsterbågar per rum/.test(faq) && WINDOW_INCLUDED_BAGAR_PER_ROOM === 3,
  true
);
check(
  "FAQ: ningún precio de servicio viejo sigue escrito ahí",
  [799, 899, 999, 1099, 2650, 3950, 4750, 245, 200, 220, 270]
    .filter((amount) => new RegExp(`\\b${amount}\\s*(kr|procent)`).test(faq))
    .join(", ") || "ninguno",
  "ninguno"
);

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
finding(
  "Q15",
  `Enstaka hemstädning (${HOME_ONETIME_RATES.weekday} kr/h lun–vie, ${HOME_ONETIME_RATES.saturday} kr/h sábado, "med Aurel städmaterial"): no se dice si incluye equipo (aspiradora…) ni si la nota OBS sobre productos del cliente también aplica.`
);

// Q17 move-out extras
for (const [id, extra] of Object.entries(S.movecleaning.extras)) {
  const price = extra.type === "perEstimatedHour" ? `${MOVE_CLEANING_EXTRAS[id]} kr/h estimada` : `${MOVE_CLEANING_EXTRAS[id]} kr`;
  finding("Q17", `Flyttstädning "${extra.label}": ${price}, solo en la calculadora; la Prislista 2027 tampoco lo menciona.`);
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

// Q18b deep-cleaning extras: what the 2027 list says about each one.
for (const [id, extra] of Object.entries(S.deepcleaning.extras)) {
  const hourly = PRISLISTA.deepExtrasHourlyFrom2027[id];
  if (hourly === undefined) {
    finding(
      "Q18b",
      `Storstädning "${extra.label}": ${DEEP_CLEANING_EXTRAS[id]} kr${extra.unit ? `/${extra.unit}` : ""}, y la Prislista 2027 no lo menciona. Se conserva a la espera de que el cliente confirme si sigue vendiéndose.`
    );
  } else {
    finding(
      "Q18b",
      `Storstädning "${extra.label}": la Prislista 2027 lo cobra "Från ${hourly} kr/timme" y la calculadora sigue cobrando ${DEEP_CLEANING_EXTRAS[id]} kr fijos. Un precio por hora no se puede sumar en la calculadora, porque las horas no se conocen hasta estar en la vivienda.`
    );
  }
}

// Q20b window add-ons
finding(
  "Q20b",
  `Los tres recargos del 25 % (spröjs, techo sobre 280 cm, triple vidrio) desaparecieron con la Prislista 2027. La lista los reemplaza por importes por bastidor (${Object.entries(
    PRISLISTA.windowExtras
  )
    .map(([id, price]) => `${S.windowcleaning.extras[id].label} ${price} kr`)
    .join(
      ", "
    )}). Cuántos bastidores incluye el precio por rum no está en ningún documento: lo resolvió el cliente el 2026-11-25 con ${WINDOW_INCLUDED_BAGAR_PER_ROOM} por rum, así que la calculadora ya cobra los extras. «Överhängda fönster» tiene precio en la lista (${
    PRISLISTA.windowExtras.overhangdaFonster
  } kr/båge) pero sigue pasando a oferta: hay que ver cuántas son antes de cobrarlas.`
);
finding(
  "Q20",
  `"Balkonginglasning" es "Från ${WINDOW_BALCONY_PRICE} kr" y la calculadora cobra ${kr(
    windowPrice("", true)
  )} fijos. Ya no se le aplica ningún recargo, así que es el precio tal cual.`
);

// Q21 window quote threshold
finding(
  "Q21",
  `5 rum: la Prislista pide oferta y el docx da precio directo "upp till 5 rum och kök" (oferta solo si son más); ninguna fuente da precio para ${WINDOW_QUOTE_FROM_ROOMS} rum. La calculadora pide oferta.`
);

// Q22 / Q22b move-out thresholds
finding(
  "Q22",
  `El mínimo de cada tramo aplana el precio al principio del tramo: todo lo que baja de 50 m² cuesta ${kr(
    moveCleaningBasePrice(1)
  )}, y de 51 a 59 m² cuesta ${kr(moveCleaningBasePrice(51))}. Es lo que pide el cálculo del cliente, no un efecto secundario.`
);
finding(
  "Q22b",
  `A 50 m² justos los dos documentos no dicen lo mismo: la Prislista pone "1-50kvm, 2990 kr (fast pris)" y el cálculo da 50 × ${
    S.movecleaning.tiers[0].pricePerSqm
  } = ${kr(moveCleaningBasePrice(50))}, porque su columna "Mínimo hasta" se detiene en 49 m². El sitio sigue el cálculo. Son 10 kr, pero el precio impreso es el que el cliente puede exigir.`
);
finding(
  "Q22",
  `Flyttstädning por encima de ${MOVE_CLEANING_QUOTE_ABOVE_AREA} m² pasa a oferta. La lista de 2026 seguía cobrando 42 kr/m² sin límite, así que esto es un cambio de política, no de cifra.`
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
finding(
  "Q104",
  `Recargo por vivienda muy sucia: resuelto el 2026-10-15 como un techo ("hasta"), no un importe fijo, con aprobación del cliente en el sitio antes de hacer trabajo extra; en casos extremos se valora aparte y puede superarlo. Ninguna calculadora lo aplica: sigue siendo solo un aviso de texto. La Prislista 2027 rompió la cifra única: storstädning ${
    SOILING_SURCHARGE_MAX_PERCENT.deepcleaning
  } %, flyttstädning ${SOILING_SURCHARGE_MAX_PERCENT.movecleaning} %.`
);

const NO_Q = "Sin pregunta asignada (proponer)";
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

console.log("\n=== Discrepancias con la Prislista 2027 ===");
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
