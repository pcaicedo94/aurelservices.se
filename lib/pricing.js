// Single source of truth for the prices the calculators show. Every rate lives
// in config/prices.json and reaches the pages through the accessors below, so
// a page never spells a number out again.
//
//   import { deepCleaningBasePrice, DEEP_CLEANING_EXTRAS } from "../lib/pricing";
//
// config/prices.json mixes values with audit metadata (source, note, question,
// confirmedByClient, clientAnswer, pendingConfirmation). None of that crosses
// this module: the accessors return values only.
//
// Everything is resolved when the module loads and every read is checked, so a
// mis-edited JSON breaks the build instead of quietly shipping a wrong price.
// The rates themselves were confirmed by the client on 2026-09-17; where the
// price list and the calculator disagreed, the client's answer won.
import prices from "../config/prices.json" with { type: "json" };

/**
 * @typedef {Object} TimeEstimate Hours per visit for a home or office.
 * @property {number} baseHours    Fixed part of the estimate.
 * @property {number} hoursPerSqm  Hours added per square metre.
 */

/**
 * @typedef {Object} AreaTier One band of an area-based price list.
 * @property {number|null} maxSqm      Top of the band; null means "and upwards".
 * @property {number|null} price       Fixed price for the band, or null.
 * @property {number|null} pricePerSqm Price per m² applied to the whole area, or null.
 */

/**
 * @typedef {Object} PriceFlags How a service's prices must be read.
 * @property {boolean} includesVat      Amounts already include VAT.
 * @property {boolean} afterRut         Amounts are what the customer pays after RUT.
 * @property {boolean} priceIsEstimate  The figure is an estimate, not a fixed price.
 * @property {boolean} alwaysQuoted     The final price is always agreed by quote.
 */

const FILE = "config/prices.json";

// Every read goes through here, so a renamed or dropped key throws while the
// module loads instead of turning into undefined further down. Paths read like
// JavaScript: "services.deepcleaning.tiers[0].price".
function at(path) {
  let node = prices;
  for (const key of path.replace(/\[(\d+)\]/g, ".$1").split(".")) {
    if (node === null || typeof node !== "object" || !(key in node)) {
      throw new Error(`${FILE}: missing "${path}"`);
    }
    node = node[key];
  }
  return node;
}

function number(path) {
  const value = at(path);
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${FILE}: "${path}" must be a number, got ${JSON.stringify(value)}`);
  }
  return value;
}

function text(path) {
  const value = at(path);
  if (typeof value !== "string" || !value) {
    throw new Error(`${FILE}: "${path}" must be a non-empty string, got ${JSON.stringify(value)}`);
  }
  return value;
}

// Optional booleans: a service that does not carry the flag reads as false.
function flag(path) {
  let value;
  try {
    value = at(path);
  } catch {
    return false;
  }
  if (typeof value !== "boolean") {
    throw new Error(`${FILE}: "${path}" must be a boolean, got ${JSON.stringify(value)}`);
  }
  return value;
}

function array(path, minLength = 1) {
  const value = at(path);
  if (!Array.isArray(value) || value.length < minLength) {
    throw new Error(`${FILE}: "${path}" must be an array of at least ${minLength} entries`);
  }
  return value;
}

// Fails unless every listed path holds the same amount, so splitting a rate the
// pages present as one (Monday to Wednesday, the three window add-ons) cannot
// pass unnoticed.
function sameNumber(paths, what) {
  const [first, ...rest] = paths.map((path) => [path, number(path)]);
  for (const [path, value] of rest) {
    if (value !== first[1]) {
      throw new Error(`${FILE}: ${what} — "${path}" is ${value} but "${first[0]}" is ${first[1]}`);
    }
  }
  return first[1];
}

function timeEstimate(path) {
  return Object.freeze({
    baseHours: number(`${path}.baseHours`),
    hoursPerSqm: number(`${path}.hoursPerSqm`),
  });
}

function priceFlags(service) {
  return Object.freeze({
    includesVat: flag(`services.${service}.includesVat`),
    afterRut: flag(`services.${service}.afterRut`),
    priceIsEstimate: flag(`services.${service}.priceIsEstimate`),
    alwaysQuoted: flag(`services.${service}.alwaysQuoted`),
  });
}

// Reads an area price list into plain tiers, in the order the JSON lists them.
function areaTiers(path) {
  return Object.freeze(
    array(path).map((tier, index) => {
      const entry = `${path}[${index}]`;
      const maxSqm = tier.maxSqm === null ? null : number(`${entry}.maxSqm`);
      if (tier.type === "fixed") {
        return Object.freeze({ maxSqm, price: number(`${entry}.price`), pricePerSqm: null });
      }
      if (tier.type === "perSqm") {
        return Object.freeze({ maxSqm, price: null, pricePerSqm: number(`${entry}.pricePerSqm`) });
      }
      throw new Error(`${FILE}: "${entry}.type" must be "fixed" or "perSqm", got ${JSON.stringify(tier.type)}`);
    })
  );
}

const tierAmount = (tier, area) => (tier.price === null ? area * tier.pricePerSqm : tier.price);

/**
 * Price of an area band. Q22 (client, confirmed): a per-m² rate applies to the
 * whole area, which alone would make 51 m² cheaper than 50 m², so no band may
 * price below the top of the one before it.
 *
 * @param {ReadonlyArray<AreaTier>} tiers
 * @param {number} area   Size in m², at least `minSqm`.
 * @param {number} minSqm Smallest size the list prices.
 * @returns {number|null} The price, or null when no band covers the size.
 */
function tierPrice(tiers, area, minSqm) {
  if (!(area >= minSqm)) return null;
  let floor = 0;
  for (const tier of tiers) {
    const price = Math.max(floor, tierAmount(tier, area));
    if (tier.maxSqm === null || area <= tier.maxSqm) return price;
    floor = Math.max(floor, tierAmount(tier, tier.maxSqm));
  }
  return null;
}

/* -------------------------------- shared --------------------------------- */

/**
 * Q14 (client, confirmed): "Minst 2 debiterade timmar gäller alla tjänster".
 * @type {number}
 */
export const MIN_BILLABLE_HOURS = sameNumber(
  ["services.homecleaning.minHours.value", "services.officecleaning.minHours.value"],
  "the minimum billable time must be the same for every service"
);

/**
 * Estimated hours for one visit.
 * @param {number} area Size in m².
 * @param {TimeEstimate} estimate
 * @returns {number}
 */
export function estimateHours(area, estimate) {
  return estimate.baseHours + estimate.hoursPerSqm * area;
}

/**
 * How each service's amounts must be read, by service id.
 * @type {Readonly<Record<string, PriceFlags>>}
 */
export const PRICE_FLAGS = Object.freeze({
  homecleaning: priceFlags("homecleaning"),
  deepcleaning: priceFlags("deepcleaning"),
  movecleaning: priceFlags("movecleaning"),
  windowcleaning: priceFlags("windowcleaning"),
  officecleaning: priceFlags("officecleaning"),
  containercleaning: priceFlags("containercleaning"),
});

/* ------------------------------ hemstädning ------------------------------ */

/** @type {TimeEstimate} */
export const HOME_TIME_ESTIMATE = timeEstimate("services.homecleaning.timeEstimate");

/**
 * Hourly rate of the plans that have one of their own, by frequency value.
 * "2" and "4" are priced by weekday instead.
 * @type {Readonly<Record<string, number>>}
 */
export const HOME_FREQUENCY_RATES = Object.freeze({
  1: number("services.homecleaning.frequencies.1.hourlyRate"),
  onetime: number("services.homecleaning.frequencies.onetime.hourlyRate"),
});

/**
 * The two weekday rates the summary names. Q13 (client, confirmed): the price
 * list has no weekend rate, so weekends are not bookable online.
 * @type {Readonly<{ mondayToWednesday: number, thursdayToFriday: number }>}
 */
export const HOME_WEEKDAY_RATES = Object.freeze({
  mondayToWednesday: sameNumber(
    [
      "services.homecleaning.weekdayRates.byDay.monday",
      "services.homecleaning.weekdayRates.byDay.tuesday",
      "services.homecleaning.weekdayRates.byDay.wednesday",
    ],
    "Monday to Wednesday share one rate on the page"
  ),
  thursdayToFriday: sameNumber(
    [
      "services.homecleaning.weekdayRates.byDay.thursday",
      "services.homecleaning.weekdayRates.byDay.friday",
    ],
    "Thursday and Friday share one rate on the page"
  ),
});

/**
 * Hourly rate for hemstädning.
 * @param {string} frequency Frequency value of the form ("1", "2", "4", "onetime").
 * @param {number|null} weekday JS weekday index (0 = Sunday), or null.
 * @returns {number|null} null when there is no rate, i.e. on a weekend.
 */
export function homeCleaningHourlyRate(frequency, weekday) {
  const fixed = HOME_FREQUENCY_RATES[frequency];
  if (fixed) return fixed;
  if (weekday >= 1 && weekday <= 3) return HOME_WEEKDAY_RATES.mondayToWednesday;
  if (weekday >= 4 && weekday <= 5) return HOME_WEEKDAY_RATES.thursdayToFriday;
  return null;
}

/* ------------------------------ storstädning ----------------------------- */

const DEEP_TIERS = areaTiers("services.deepcleaning.tiers");
const DEEP_MIN_SQM = number("services.deepcleaning.minSqm");

/** Homes larger than this are quoted, not priced online. @type {number} */
export const DEEP_CLEANING_QUOTE_ABOVE_AREA = number("services.deepcleaning.quoteAboveSqm");

/**
 * Fixed price by size.
 * @param {number} area Size in m².
 * @returns {number|null} null when the size is quoted instead ("Offereras").
 */
export function deepCleaningBasePrice(area) {
  return tierPrice(DEEP_TIERS, area, DEEP_MIN_SQM);
}

/**
 * Add-on prices, by add-on id; "vaggtvatt" is per wall.
 * @type {Readonly<Record<string, number>>}
 */
export const DEEP_CLEANING_EXTRAS = Object.freeze({
  kylFrys: number("services.deepcleaning.extras.kylFrys.price"),
  kylFrysDefrost: number("services.deepcleaning.extras.kylFrysDefrost.price"),
  diskmaskin: number("services.deepcleaning.extras.diskmaskin.price"),
  kapGarderob: number("services.deepcleaning.extras.kapGarderob.price"),
  forrad: number("services.deepcleaning.extras.forrad.price"),
  tvattmaskin: number("services.deepcleaning.extras.tvattmaskin.price"),
  vaggtvatt: number("services.deepcleaning.extras.vaggtvatt.price"),
});

/* ------------------------------ flyttstädning ---------------------------- */

const MOVE_TIERS = areaTiers("services.movecleaning.tiers");
const MOVE_MIN_SQM = number("services.movecleaning.minSqm");

/** @type {TimeEstimate} */
export const MOVE_TIME_ESTIMATE = timeEstimate("services.movecleaning.timeEstimate");

/**
 * Price by size, never below the top of the previous band (Q22).
 * @param {number} area Size in m².
 * @returns {number|null} null only for a size below the smallest band.
 */
export function moveCleaningBasePrice(area) {
  return tierPrice(MOVE_TIERS, area, MOVE_MIN_SQM);
}

/**
 * Add-on prices, by add-on id; "biytor" is per estimated hour of the home.
 * @type {Readonly<Record<string, number>>}
 */
export const MOVE_CLEANING_EXTRAS = Object.freeze({
  kylFrysDefrost: number("services.movecleaning.extras.kylFrysDefrost.price"),
  persienner: number("services.movecleaning.extras.persienner.price"),
  biytor: number("services.movecleaning.extras.biytor.hourlyRate"),
  inglasadBalkong: number("services.movecleaning.extras.inglasadBalkong.price"),
});

/* ----------------------------- fönsterputsning --------------------------- */

/**
 * Price by number of rooms, from "1 rum och kök" upwards.
 * @type {Readonly<Record<string, number>>}
 */
export const WINDOW_ROOM_PRICES = Object.freeze({
  1: number("services.windowcleaning.rooms.1"),
  2: number("services.windowcleaning.rooms.2"),
  3: number("services.windowcleaning.rooms.3"),
  4: number("services.windowcleaning.rooms.4"),
});

/** Price when only a glassed balcony is cleaned. @type {number} */
export const WINDOW_BALCONY_PRICE = number("services.windowcleaning.balconyOnly.price");

/**
 * Q21 (client, confirmed): "5 rum och kök eller över 120 kvm offereras".
 * @type {number}
 */
export const WINDOW_QUOTE_FROM_ROOMS = number("services.windowcleaning.quote.fromRooms");

/** @type {number} */
export const WINDOW_QUOTE_ABOVE_AREA = number("services.windowcleaning.quote.aboveSqm");

/**
 * Q20 (client, confirmed): each add-on adds this percentage of the base price,
 * and several add up instead of compounding (two add-ons = +50 %, not +56 %).
 * @type {number}
 */
export const WINDOW_SURCHARGE_PERCENT = (() => {
  const combination = text("services.windowcleaning.surcharges.combination");
  if (combination !== "additive") {
    throw new Error(`${FILE}: window add-ons are additive, not "${combination}"`);
  }
  const items = at("services.windowcleaning.surcharges.items");
  const ids = Object.keys(items);
  if (!ids.length) throw new Error(`${FILE}: "services.windowcleaning.surcharges.items" is empty`);
  return sameNumber(
    ids.map((id) => `services.windowcleaning.surcharges.items.${id}.percent`),
    "every window add-on is priced at the same percentage"
  );
})();

/** The same surcharge as a factor of the base price. @type {number} */
export const WINDOW_SURCHARGE_RATE = WINDOW_SURCHARGE_PERCENT / 100;

/* ----------------------------- kontorsstädning --------------------------- */

/** @type {TimeEstimate} */
export const OFFICE_TIME_ESTIMATE = timeEstimate("services.officecleaning.timeEstimate");

/**
 * Visits per month, with the Swedish label the form shows and the hourly rate.
 * Business rates are estimates, exclusive of VAT, and always negotiated
 * (Q26–Q28, client confirmed): see PRICE_FLAGS.officecleaning.
 * @type {Readonly<Record<string, { label: string, hourlyRate: number }>>}
 */
export const OFFICE_FREQUENCIES = Object.freeze(
  Object.fromEntries(
    ["1", "2", "4"].map((id) => [
      id,
      Object.freeze({
        label: text(`services.officecleaning.frequencies.${id}.label`),
        hourlyRate: number(`services.officecleaning.frequencies.${id}.hourlyRate`),
      }),
    ])
  )
);

/* ------------------------------- bodstädning ----------------------------- */

const CONTAINER_TIERS = Object.freeze(
  array("services.containercleaning.tiers").map((_, index) => {
    const entry = `services.containercleaning.tiers[${index}]`;
    return Object.freeze({
      minUnits: number(`${entry}.minUnits`),
      maxUnits: number(`${entry}.maxUnits`),
      byVisitsPerWeek: at(`${entry}.pricePerUnitByVisitsPerWeek`),
    });
  })
);

/** More site huts than this are quoted, not priced online. @type {number} */
export const CONTAINER_MAX_UNITS_ONLINE = number("services.containercleaning.quoteAboveUnits");

/** Weeks the monthly estimate is built on. @type {number} */
export const CONTAINER_WEEKS_PER_MONTH = number("services.containercleaning.weeksPerMonth");

/**
 * Price per site hut and visit, exclusive of VAT.
 * @param {number} units Number of site huts.
 * @param {number} visitsPerWeek Cleanings per week.
 * @returns {number|null} null when no band covers the combination.
 */
export function containerCleaningPricePerUnit(units, visitsPerWeek) {
  const tier = CONTAINER_TIERS.find((t) => units >= t.minUnits && units <= t.maxUnits);
  const price = tier && tier.byVisitsPerWeek[visitsPerWeek];
  return typeof price === "number" ? price : null;
}
