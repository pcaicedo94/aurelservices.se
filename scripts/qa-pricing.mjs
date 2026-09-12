/**
 * QA: lib/pricing.js must reproduce, to the öre, what each calculator page
 * shows today. The script then checks the figures transcribed into
 * config/prices.json against Prislista 2026 (pages 1-3), lists where the
 * calculators disagree with the price list, and lists every price still
 * waiting for the client. No network, no side effects.
 *
 *   node scripts/qa-pricing.mjs
 *
 * Exit code 1 only when a check fails; discrepancies are informational.
 *
 * The legacy* functions are transcriptions of each page's calculation, with
 * React state setters turned into return values. A drift check runs first and
 * fails if a page's formula lines change, so a page cannot keep passing
 * against an outdated transcription.
 */
import { readFileSync } from "node:fs";
import {
  containerCleaningPrice,
  deepCleaningPrice,
  homeCleaningPrice,
  moveCleaningPrice,
  officeCleaningPrice,
  weekdayOf,
  windowCleaningPrice,
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

/* ------------------------------ source drift ------------------------------ */

const SIGNATURES = {
  "pages/homecleaning.js": [
    'if (selectedFrequency === "1") return 245;',
    'if (selectedFrequency === "onetime") return 270;',
    "if (dayOfWeek >= 1 && dayOfWeek <= 3) return 200;",
    "if (dayOfWeek >= 4 && dayOfWeek <= 5) return 220;",
    "const time = 1.57 + 0.0167 * area;",
    "monthlyPrice = time * rate;",
    "monthlyPrice = time * rate * sessionsPerMonth;",
  ],
  "pages/deepcleaning.js": [
    "if (area >= 1 && area <= 50) price = 2650;",
    "else if (area > 50 && area <= 70) price = 3290;",
    "else if (area > 70 && area <= 100) price = 3950;",
    "else if (area > 100 && area <= 150) price = 4750;",
    "if (hasKylFrys) total += 360;",
    "if (hasKylFrysDefrost) total += 500;",
    "if (hasDiskmaskin) total += 250;",
    "if (hasKapGarderob) total += 360;",
    "if (hasForrad) total += 300;",
    "if (hasTvattmaskin) total += 390;",
    "total += vaggtvattCount * 250;",
  ],
  "pages/movecleaning.js": [
    "const time = 1.57 + 0.0167 * area;",
    "price = 2890;",
    "price = area * 51;",
    "price = area * 47;",
    "price = area * 42;",
    "if (hasKylFrysDefrost) total += 400;",
    "if (hasPersienner) total += 360;",
    "if (hasBalkonger) total += cleaningTime * 360;",
    "if (hasBalkongerGlas) total += 650;",
  ],
  "pages/windowcleaning.js": [
    "basePrice = 450;",
    'case "1": basePrice = 799; break;',
    'case "2": basePrice = 899; break;',
    'case "3": basePrice = 999; break;',
    'case "4": basePrice = 1099; break;',
    "if (hasSprojs) finalPrice *= 1.25;",
    "if (hasHighCeiling) finalPrice *= 1.25;",
    "if (hasTripleGlass) finalPrice *= 1.25;",
    '} else if (rooms === "5") {',
  ],
  "pages/officecleaning.js": [
    '1: { label: "1 gång per månad", hourlyRate: 350 },',
    '2: { label: "2 gånger per månad", hourlyRate: 163 },',
    '4: { label: "4 gånger per månad", hourlyRate: 150 },',
    "(1.57 + 0.0167 * area).toFixed(2)",
    "(plan.hourlyRate * cleaningTime * Number(frequency)).toFixed(2)",
  ],
  "pages/containercleaning.js": [
    "if (numFreq === 5) pricePerBodar = 100;",
    "else if (numFreq === 1) pricePerBodar = 130;",
    "if (numFreq === 5) pricePerBodar = 65;",
    "if (numFreq === 5) pricePerBodar = 60;",
    "else if (numFreq === 1) pricePerBodar = 85;",
    "const totalPrice = pricePerBodar * numUnits * numFreq * 4;",
  ],
};

console.log("=== Las fórmulas transcritas siguen en las páginas ===");
const squash = (text) => text.replace(/\s+/g, " ");
for (const [file, lines] of Object.entries(SIGNATURES)) {
  const source = squash(read(file));
  const missing = lines.filter((line) => !source.includes(squash(line)));
  check(`${file}`, missing.length ? `cambió: ${missing.join(" | ")}` : "sin cambios", "sin cambios");
}

/* ------------------------ page logic, transcribed ------------------------- */

// pages/homecleaning.js — getHourlyRate() and updateCalculations()
function legacyHome({ size, frequency, dateTime }) {
  const getHourlyRate = (selectedDateTime, selectedFrequency) => {
    if (selectedFrequency === "1") return 245;
    if (selectedFrequency === "onetime") return 270;
    if (selectedDateTime) {
      const dayOfWeek = new Date(selectedDateTime).getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 3) return 200;
      if (dayOfWeek >= 4 && dayOfWeek <= 5) return 220;
    }
    return 0;
  };
  let hourlyRate = 0;
  let cleaningTime = 0;
  let predictedPrice = 0;
  if (size && frequency && dateTime) {
    const area = parseFloat(size);
    const rate = getHourlyRate(dateTime, frequency);
    const time = 1.57 + 0.0167 * area;
    hourlyRate = rate;
    cleaningTime = time.toFixed(2);
    let monthlyPrice;
    if (frequency === "onetime") {
      monthlyPrice = time * rate;
    } else {
      const sessionsPerMonth = parseInt(frequency, 10);
      monthlyPrice = time * rate * sessionsPerMonth;
    }
    predictedPrice = monthlyPrice.toFixed(2);
  }
  // What the summary shows
  return `${hourlyRate} kr/h | ${cleaningTime || "0"} h | ${predictedPrice || "0"} kr`;
}

// pages/deepcleaning.js — calculateBasePrice(), total effect, summary labels
function legacyDeep({ size, extras: x = {} }) {
  const area = parseFloat(size);
  let basePrice = 0;
  if (!isNaN(area) && area > 0) {
    let price = 0;
    if (area >= 1 && area <= 50) price = 2650;
    else if (area > 50 && area <= 70) price = 3290;
    else if (area > 70 && area <= 100) price = 3950;
    else if (area > 100 && area <= 150) price = 4750;
    else if (area > 150) price = 0; // Offereras
    basePrice = price;
  }
  let total = basePrice;
  if (x.kylFrys) total += 360;
  if (x.kylFrysDefrost) total += 500;
  if (x.diskmaskin) total += 250;
  if (x.kapGarderob) total += 360;
  if (x.forrad) total += 300;
  if (x.tvattmaskin) total += 390;
  total += (x.vaggtvatt || 0) * 250;
  const predictedPrice = total.toFixed(2);
  const quote = basePrice === 0 && parseFloat(size) > 150;
  return `${quote ? "Offereras" : `${basePrice || "0"} kr`} | ${quote ? "Offereras" : `${predictedPrice || "0"} kr`}`;
}

// pages/movecleaning.js — calculateBasePrice(), total effect, summary labels
function legacyMove({ size, extras: x = {} }) {
  const area = parseFloat(size);
  let basePrice = 0;
  let cleaningTime = 0;
  if (!isNaN(area) && area > 0) {
    const time = 1.57 + 0.0167 * area;
    cleaningTime = time.toFixed(2);
    let price = 0;
    if (area >= 1 && area <= 50) price = 2890;
    else if (area > 50 && area <= 100) price = area * 51;
    else if (area > 100 && area <= 150) price = area * 47;
    else if (area > 150) price = area * 42;
    basePrice = price;
  }
  let total = basePrice;
  if (x.kylFrysDefrost) total += 400;
  if (x.persienner) total += 360;
  if (x.biytor) total += cleaningTime * 360;
  if (x.inglasadBalkong) total += 650;
  return `${cleaningTime || "0"} h | ${basePrice || "0"} kr | ${total.toFixed(2) || "0"} kr`;
}

// pages/windowcleaning.js — price effect and summary label
function legacyWindow({ rooms, onlyBalcony, sprojs, highCeiling, tripleGlass }) {
  let basePrice = 0;
  if (onlyBalcony) {
    basePrice = 450;
  } else {
    switch (rooms) {
      case "1": basePrice = 799; break;
      case "2": basePrice = 899; break;
      case "3": basePrice = 999; break;
      case "4": basePrice = 1099; break;
      default: basePrice = 0;
    }
  }
  let predictedPrice;
  if (basePrice > 0) {
    let finalPrice = basePrice;
    if (sprojs) finalPrice *= 1.25;
    if (highCeiling) finalPrice *= 1.25;
    if (tripleGlass) finalPrice *= 1.25;
    predictedPrice = finalPrice.toFixed(2);
  } else if (rooms === "5") {
    predictedPrice = "Offereras";
  } else {
    predictedPrice = 0;
  }
  return predictedPrice === "Offereras" ? "Offereras" : `${predictedPrice} kr`;
}

// pages/officecleaning.js (main, 40d75a9) — values derived on every render
const OFFICE_FREQUENCIES = {
  1: { label: "1 gång per månad", hourlyRate: 350 },
  2: { label: "2 gånger per månad", hourlyRate: 163 },
  4: { label: "4 gånger per månad", hourlyRate: 150 },
};
function legacyOffice({ size, frequency }) {
  const area = parseFloat(size);
  const plan = OFFICE_FREQUENCIES[frequency];
  const hasArea = !isNaN(area) && area > 0;
  const cleaningTime = hasArea ? (1.57 + 0.0167 * area).toFixed(2) : 0;
  const predictedPrice = hasArea && plan ? (plan.hourlyRate * cleaningTime * Number(frequency)).toFixed(2) : 0;
  return `${plan ? plan.hourlyRate : "-"} kr/h | ${cleaningTime || "0"} h | ${predictedPrice || "0"} kr`;
}

// pages/containercleaning.js — calculatePrice()
function legacyContainer({ units, frequency }) {
  const numUnits = parseInt(units);
  const numFreq = parseInt(frequency);
  if (!numUnits || !numFreq) return "0 kr/bod | 0 kr";
  let pricePerBodar = 0;
  if (numUnits >= 1 && numUnits <= 10) {
    if (numFreq === 5) pricePerBodar = 100;
    else if (numFreq === 3) pricePerBodar = 110;
    else if (numFreq === 2) pricePerBodar = 120;
    else if (numFreq === 1) pricePerBodar = 130;
  } else if (numUnits >= 11 && numUnits <= 20) {
    if (numFreq === 5) pricePerBodar = 65;
    else if (numFreq === 3) pricePerBodar = 75;
    else if (numFreq === 2) pricePerBodar = 95;
    else if (numFreq === 1) pricePerBodar = 100;
  } else if (numUnits >= 21 && numUnits <= 30) {
    if (numFreq === 5) pricePerBodar = 60;
    else if (numFreq === 3) pricePerBodar = 70;
    else if (numFreq === 2) pricePerBodar = 90;
    else if (numFreq === 1) pricePerBodar = 95;
  } else if (numUnits >= 31 && numUnits <= 50) {
    if (numFreq === 5) pricePerBodar = 55;
    else if (numFreq === 3) pricePerBodar = 65;
    else if (numFreq === 2) pricePerBodar = 80;
    else if (numFreq === 1) pricePerBodar = 85;
  }
  const totalPrice = pricePerBodar * numUnits * numFreq * 4;
  return `${pricePerBodar} kr/bod | ${totalPrice.toFixed(2) || "0"} kr`;
}

/* ------------------- the same summaries from lib/pricing ------------------ */

const LIB = {
  homecleaning: ({ size, frequency, dateTime }) => {
    const r = homeCleaningPrice({ area: size, frequency, dateTime }, prices);
    return `${r.hourlyRate} kr/h | ${r.hoursText || "0"} h | ${r.totalText || "0"} kr`;
  },
  deepcleaning: ({ size, extras }) => {
    const r = deepCleaningPrice({ area: size, extras }, prices);
    const quote = r.status === "quote";
    return `${quote ? "Offereras" : `${r.basePrice || "0"} kr`} | ${quote ? "Offereras" : `${r.totalText} kr`}`;
  },
  movecleaning: ({ size, extras }) => {
    const r = moveCleaningPrice({ area: size, extras }, prices);
    return `${r.hoursText || "0"} h | ${r.basePrice || "0"} kr | ${r.totalText} kr`;
  },
  windowcleaning: ({ rooms, onlyBalcony, ...surcharges }) => {
    const r = windowCleaningPrice({ rooms, balconyOnly: onlyBalcony, surcharges }, prices);
    if (r.status === "quote") return "Offereras";
    return `${r.status === "ok" ? r.totalText : 0} kr`;
  },
  officecleaning: ({ size, frequency }) => {
    const r = officeCleaningPrice({ area: size, frequency }, prices);
    return `${r.hourlyRate || "-"} kr/h | ${r.hoursText || "0"} h | ${r.totalText || "0"} kr`;
  },
  containercleaning: ({ units, frequency }) => {
    const r = containerCleaningPrice({ units, visitsPerWeek: frequency }, prices);
    return `${r.pricePerUnit} kr/bod | ${r.totalText || "0"} kr`;
  },
};

const LEGACY = {
  homecleaning: legacyHome,
  deepcleaning: legacyDeep,
  movecleaning: legacyMove,
  windowcleaning: legacyWindow,
  officecleaning: legacyOffice,
  containercleaning: legacyContainer,
};

// September 2026: the 14th is a Monday and the 20th a Sunday.
const CASES = [
  ["homecleaning", "60 m², varje vecka, måndag", { size: "60", frequency: "4", dateTime: "2026-09-14T09:00" }],
  ["homecleaning", "60 m², varje vecka, torsdag", { size: "60", frequency: "4", dateTime: "2026-09-17T09:00" }],
  ["homecleaning", "85 m², varannan vecka, onsdag", { size: "85", frequency: "2", dateTime: "2026-09-16T10:00" }],
  ["homecleaning", "85 m², varannan vecka, fredag", { size: "85", frequency: "2", dateTime: "2026-09-18T13:30" }],
  ["homecleaning", "42,5 m², en gång i månaden, lördag", { size: "42.5", frequency: "1", dateTime: "2026-09-19T08:00" }],
  ["homecleaning", "120 m², enstaka, söndag", { size: "120", frequency: "onetime", dateTime: "2026-09-20T10:00" }],
  ["homecleaning", "70 m², varannan vecka, lördag (sin tarifa)", { size: "70", frequency: "2", dateTime: "2026-09-19T10:00" }],
  ["homecleaning", "20 m², varje vecka, tisdag (< 2 h)", { size: "20", frequency: "4", dateTime: "2026-09-15T08:00" }],
  ["deepcleaning", "45 m² sin extras", { size: "45" }],
  ["deepcleaning", "50 m² (límite)", { size: "50" }],
  ["deepcleaning", "50,5 m²", { size: "50.5" }],
  ["deepcleaning", "100 m² + kyl/frys + skåp", { size: "100", extras: { kylFrys: true, kapGarderob: true } }],
  [
    "deepcleaning",
    "150 m² + todos los extras + 3 väggar",
    {
      size: "150",
      extras: { kylFrys: true, kylFrysDefrost: true, diskmaskin: true, kapGarderob: true, forrad: true, tvattmaskin: true, vaggtvatt: 3 },
    },
  ],
  ["deepcleaning", "151 m² + avfrostning (oferta)", { size: "151", extras: { kylFrysDefrost: true } }],
  ["deepcleaning", "0,5 m² (fuera de tramo)", { size: "0.5" }],
  ["movecleaning", "30 m²", { size: "30" }],
  ["movecleaning", "50 m²", { size: "50" }],
  ["movecleaning", "51 m²", { size: "51" }],
  ["movecleaning", "101 m²", { size: "101" }],
  [
    "movecleaning",
    "55,3 m² + todos los extras",
    { size: "55.3", extras: { kylFrysDefrost: true, persienner: true, biytor: true, inglasadBalkong: true } },
  ],
  ["movecleaning", "180 m² + biytor", { size: "180", extras: { biytor: true } }],
  ["windowcleaning", "1 rum", { rooms: "1" }],
  ["windowcleaning", "2 rum + treglas", { rooms: "2", tripleGlass: true }],
  ["windowcleaning", "3 rum + spröjs + takhöjd", { rooms: "3", sprojs: true, highCeiling: true }],
  ["windowcleaning", "4 rum + los 3 recargos", { rooms: "4", sprojs: true, highCeiling: true, tripleGlass: true }],
  ["windowcleaning", "5 rum (oferta)", { rooms: "5" }],
  ["windowcleaning", "endast balkong", { rooms: "", onlyBalcony: true }],
  ["windowcleaning", "endast balkong + spröjs", { rooms: "", onlyBalcony: true, sprojs: true }],
  ["officecleaning", "120 m², 2 veces/mes", { size: "120", frequency: "2" }],
  ["officecleaning", "200 m², 4 veces/mes", { size: "200", frequency: "4" }],
  ["officecleaning", "25 m², 1 vez/mes", { size: "25", frequency: "1" }],
  ["officecleaning", "57,3 m², 2 veces/mes", { size: "57.3", frequency: "2" }],
  ["officecleaning", "sin superficie", { size: "", frequency: "2" }],
  ["containercleaning", "1 bod, 5/semana", { units: "1", frequency: "5" }],
  ["containercleaning", "10 bodar, 1/semana", { units: "10", frequency: "1" }],
  ["containercleaning", "11 bodar, 3/semana", { units: "11", frequency: "3" }],
  ["containercleaning", "30 bodar, 2/semana", { units: "30", frequency: "2" }],
  ["containercleaning", "50 bodar, 1/semana", { units: "50", frequency: "1" }],
  ["containercleaning", "51 bodar, 5/semana", { units: "51", frequency: "5" }],
];

console.log(`\n=== lib/pricing.js = cálculo actual de cada página (${CASES.length} entradas) ===`);
for (const [service, name, input] of CASES) {
  check(`${service.padEnd(17)} ${name}`, LIB[service](input), LEGACY[service](input));
}

console.log("\n=== Día de la semana independiente de la zona horaria ===");
const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
for (const [date, day] of [["2026-09-14T09:00", "monday"], ["2026-09-18T16:30", "friday"], ["2026-09-20T07:00", "sunday"]]) {
  check(`weekdayOf(${date})`, `${weekdayOf(date)}/${DAY_NAMES[new Date(date).getDay()]}`, `${day}/${day}`);
}

/* ----------------- prices.json against the printed price list ---------------- */

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
  windowQuoteFromRooms: 5,
  windowQuoteAboveSqm: 120,
  windowBalconyFrom: 450,
  windowSurchargePercent: 25,
};

console.log("\n=== prices.json frente a la Prislista 2026 (págs. 1–3) ===");
const byDay = S.homecleaning.weekdayRates.byDay;
check(
  "Hemstädning lun–vie 200/200/200/220/220 kr/h",
  Object.keys(PRISLISTA.homeWeekdays).map((day) => byDay[day]).join("/"),
  Object.values(PRISLISTA.homeWeekdays).join("/")
);
check("Hemstädning una vez al mes 245 kr/h", S.homecleaning.frequencies["1"].hourlyRate, PRISLISTA.homeMonthly);
check("Enstaka hemstädning 270 kr/h", S.homecleaning.frequencies.onetime.hourlyRate, PRISLISTA.homeOneTime);
check("Minsta debitering 2 h", S.homecleaning.minHours.value, PRISLISTA.homeMinHours);

const deepMismatches = [];
for (let area = 1; area <= 300; area++) {
  const listed = PRISLISTA.deep.find((tier) => area >= tier.from && area <= tier.to);
  const result = deepCleaningPrice({ area }, prices);
  if (listed && (result.status !== "ok" || result.basePrice !== listed.price)) deepMismatches.push(area);
  if (area >= PRISLISTA.deepQuoteFrom && result.status !== "quote") deepMismatches.push(area);
}
check("Storstädning: precio de 1–149 m² y oferta desde 151 m²", deepMismatches.join(",") || "coincide", "coincide");
for (const [id, from] of Object.entries(PRISLISTA.deepExtrasFrom)) {
  check(`Storstädning tillägg "${S.deepcleaning.extras[id].label}" desde ${from} kr`, S.deepcleaning.extras[id].price, from);
}

const moveMismatches = [];
for (let area = 1; area <= 300; area++) {
  const tier = PRISLISTA.move.find((t) => area >= t.from && area <= t.to);
  const expected = tier.fixed ?? area * tier.perSqm;
  if (moveCleaningPrice({ area }, prices).basePrice !== expected) moveMismatches.push(area);
}
check("Flyttstädning: precio de 1–300 m²", moveMismatches.join(",") || "coincide", "coincide");

check(
  "Fönsterputs 1–4 rum",
  ["1", "2", "3", "4"].map((rooms) => windowCleaningPrice({ rooms }, prices).total).join("/"),
  Object.values(PRISLISTA.windowRooms).join("/")
);
check("Fönsterputs 5 rum → oferta", windowCleaningPrice({ rooms: "5" }, prices).status, "quote");
check("Fönsterputs oferta por encima de 120 m²", S.windowcleaning.quote.aboveSqm, PRISLISTA.windowQuoteAboveSqm);
check("Endast balkong desde 450 kr", S.windowcleaning.balconyOnly.price, PRISLISTA.windowBalconyFrom);
check(
  "Recargos de ventanas de 25 %",
  Object.values(S.windowcleaning.surcharges.items).map((item) => item.percent).join("/"),
  "25/25/25"
);
for (const id of ["homecleaning", "deepcleaning", "movecleaning", "windowcleaning"]) {
  check(`${S[id].label}: SEK, con IVA, después de RUT`, `${S[id].currency}/${S[id].includesVat}/${S[id].afterRut}`, "SEK/true/true");
}

/* ------------------------------ discrepancies ------------------------------ */

const findings = new Map();
function finding(group, text) {
  if (!findings.has(group)) findings.set(group, []);
  findings.get(group).push(text);
}
const home = (area, frequency, dateTime) => homeCleaningPrice({ area, frequency, dateTime }, prices);
const windows = (rooms, surcharges = {}, balconyOnly = false) =>
  windowCleaningPrice({ rooms, surcharges, balconyOnly }, prices);

// Q13 weekends
for (const [day, date] of [["sábado", "2026-09-19T10:00"], ["domingo", "2026-09-20T10:00"]]) {
  const r = home(70, "2", date);
  if (r.status !== "ok") {
    finding("Q13", `Hemstädning cada dos semanas en ${day}: la calculadora muestra ${kr(r.total)}; la Prislista no tiene tarifa de fin de semana.`);
  }
}

// Q14 two-hour minimum
const te = S.homecleaning.timeEstimate;
const minArea = (PRISLISTA.homeMinHours - te.baseHours) / te.hoursPerSqm;
const small = home(20, "4", "2026-09-15T08:00");
finding(
  "Q14",
  `El mínimo de 2 h no se aplica: por debajo de ${minArea.toFixed(1)} m² la estimación es menor de 2 h. 20 m² cada semana (martes) = ${small.hoursText} h → ${kr(small.total)}/mes; con el mínimo serían ${kr(2 * small.hourlyRate * 4)}.`
);
const smallOneOff = home(20, "onetime", "2026-09-15T08:00");
finding(
  "Q14",
  `La Prislista pone el mínimo bajo las tarifas recurrentes y no aclara si vale para enstaka: 20 m² enstaka = ${kr(smallOneOff.total)}; con mínimo, ${kr(2 * PRISLISTA.homeOneTime)}.`
);

// Q15 material
if (S.homecleaning.material.companyProductsPrice === null) {
  finding("Q15", "Hemstädning recurrente: el cliente pone los productos; si los pone Aurel se facturan, pero no hay precio y la calculadora no los contempla.");
}
finding("Q15", "Enstaka hemstädning (270 kr/h \"med Aurel städmaterial\"): no se dice si incluye equipo (aspiradora…) ni si la nota OBS sobre productos del cliente también aplica.");

// Q17 move-out extras
for (const extra of Object.values(S.movecleaning.extras)) {
  const price = extra.type === "perEstimatedHour" ? `${extra.hourlyRate} kr/h estimada` : `${extra.price} kr`;
  finding("Q17", `Flyttstädning "${extra.label}": ${price}, solo en la calculadora (no está en las págs. 1–3).`);
}
finding(
  "Q17",
  `"Kyl/Frys med avfrostning" cuesta ${S.movecleaning.extras.kylFrysDefrost.price} kr en flyttstädning y ${S.deepcleaning.extras.kylFrysDefrost.price} kr en storstädning.`
);
const biytor = moveCleaningPrice({ area: 80, extras: { biytor: true } }, prices);
finding(
  "Q17",
  `Biytor = 360 kr × horas estimadas de TODA la vivienda: 80 m² → ${biytor.hoursText} h → +${kr(biytor.extras[0].amount)}, sin relación con el tamaño del trastero o balcón.`
);

// Q18 deep-cleaning extras
for (const [id, extra] of Object.entries(S.deepcleaning.extras)) {
  const from = PRISLISTA.deepExtrasFrom[id];
  if (from === undefined) {
    finding("Q18", `Storstädning "${extra.label}": ${extra.price} kr${extra.unit ? `/${extra.unit}` : ""}, solo en la calculadora.`);
  } else {
    finding("Q18", `Storstädning "${extra.label}": la Prislista dice "Från ${from} kr" y la calculadora cobra ${from} kr fijos.`);
  }
}

// Q20 window surcharges
const two = windows("4", { sprojs: true, highCeiling: true });
const three = windows("4", { sprojs: true, highCeiling: true, tripleGlass: true });
finding(
  "Q20",
  `Los recargos se multiplican: 4 rum con 2 recargos = ${kr(two.total)} (sumando 25 % + 25 %: ${kr(1099 * 1.5)}); con 3 = ${kr(three.total)} (sumando: ${kr(1099 * 1.75)}).`
);
finding(
  "Q20",
  `"Endast balkong" es "Från 450 kr", pero la calculadora cobra 450 kr fijos y le aplica recargos (con spröjs: ${kr(windows("", { sprojs: true }, true).total)}).`
);

// Q21 window quote threshold
finding(
  "Q21",
  `La Prislista pide oferta desde 5 rum o más de 120 m², pero la calculadora solo pregunta habitaciones: 3 rum de 130 m² → ${kr(windows("3").total)}.`
);

// Q22 move-out thresholds
const drops = [];
let previous = null;
for (let area = 1; area <= 300; area++) {
  const base = moveCleaningPrice({ area }, prices).basePrice;
  if (previous !== null && base < previous) drops.push(`${area - 1} m² = ${previous} kr → ${area} m² = ${base} kr`);
  previous = base;
}
finding("Q22", `El precio baja al cruzar un umbral (la tarifa por m² se aplica a toda la superficie): ${drops.join("; ")}.`);
finding("Q22", `Decimales entre tramos: 50,5 m² → ${kr(moveCleaningPrice({ area: 50.5 }, prices).basePrice)} (tarifa de 51 kr/m²).`);

// Business
const officeRates = Object.values(S.officecleaning.frequencies).map((plan) => `${plan.label} ${plan.hourlyRate} kr/h`);
finding("Q26–Q28", `Kontorsstädning: ${officeRates.join(", ")}; sin base de IVA confirmada.`);
const officeSmall = officeCleaningPrice({ area: 20, frequency: "1" }, prices);
finding("Q26–Q28", `Kontorsstädning 1 vez/mes promete "minst 2 timmar" pero no lo aplica: 20 m² → ${officeSmall.hoursText} h → ${kr(officeSmall.total)}.`);
finding("Q26–Q28", "Bodstädning: tramos por número de bodar y visitas/semana \"exkl. moms\"; el mes se calcula como 4 semanas.");
finding(
  "Q26–Q28",
  `Bodstädning con más de 50 bodar: la calculadora muestra ${kr(containerCleaningPrice({ units: 51, visitsPerWeek: 5 }, prices).total)} en vez de pedir oferta.`
);

// Not in the client questionnaire yet
const NO_Q = "Sin pregunta asignada (proponer)";
finding(
  NO_Q,
  `Storstädning 150 m²: la Prislista pasa de "101–149 kvm" a "Över 151 kvm"; la calculadora cobra ${kr(deepCleaningPrice({ area: 150 }, prices).basePrice)} hasta 150 m² y oferta por encima.`
);
finding(NO_Q, "Recargo por vivienda muy sucia (\"20%\" en la Prislista, \"upp till 20 procent\" en el docx): ninguna calculadora lo contempla; solo aparece como aviso.");
finding(NO_Q, "La estimación de horas (1,57 + 0,0167 × m²) no figura en la Prislista y determina el precio de hemstädning, kontorsstädning y del extra biytor.");
const unrounded = home(120, "2", "2026-09-14T09:00");
const rounded = Number(unrounded.hoursText) * unrounded.hourlyRate * 2;
finding(
  NO_Q,
  `Redondeo distinto: hemstädning multiplica las horas sin redondear y kontorsstädning/biytor las redondeadas (120 m² cada dos semanas, lunes: ${kr(unrounded.total)} frente a ${kr(rounded)}).`
);
finding(NO_Q, "\"Varje vecka\" se calcula como 4 visitas al mes, no 4,33.");
finding(NO_Q, `Flyttstädning muestra el baspris sin redondear: 55,3 m² → "${legacyMove({ size: "55.3" }).split(" | ")[1]}".`);

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
