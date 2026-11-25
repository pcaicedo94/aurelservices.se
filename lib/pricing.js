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
//
// The rates come from Prislista för privatpersoner Aurel 2027 and, for
// flyttstädning, from the client's own calculation spec (Flyttstädning
// kalkyl.pdf), both received on 2026-11-24. The rules around them — two billed
// hours, bands that never drop, the quote thresholds — were confirmed by the
// client on 2026-09-17 and 2026-10-15 and are unchanged.
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
 * @property {number|null} minPrice    Least the band may charge, or null for none.
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
        return Object.freeze({
          maxSqm,
          price: number(`${entry}.price`),
          pricePerSqm: null,
          minPrice: null,
        });
      }
      if (tier.type === "perSqm") {
        return Object.freeze({
          maxSqm,
          price: null,
          pricePerSqm: number(`${entry}.pricePerSqm`),
          // Optional: only the 2027 flyttstädning bands carry one.
          minPrice: "minPrice" in tier ? number(`${entry}.minPrice`) : null,
        });
      }
      throw new Error(`${FILE}: "${entry}.type" must be "fixed" or "perSqm", got ${JSON.stringify(tier.type)}`);
    })
  );
}

// What one band charges for an area: its fixed price, or its rate per m²
// applied to the whole area and then raised to the band's own minimum. The
// 2027 flyttstädning list is written exactly this way — "el mayor importe;
// nunca sumar ambos valores" — so the two are compared, never added.
function tierAmount(tier, area) {
  if (tier.price !== null) return tier.price;
  const byArea = area * tier.pricePerSqm;
  return tier.minPrice === null ? byArea : Math.max(byArea, tier.minPrice);
}

/**
 * Price of an area band, under two rules that both guard the same cliff: a
 * per-m² rate applies to the whole area, so without a floor a 51 m² home would
 * come out cheaper than a 50 m² one.
 *
 *   - each band may carry its own `minPrice` (the 2027 flyttstädning list);
 *   - and Q22 (client, confirmed) forbids any band from pricing below the top
 *     of the one before it.
 *
 * With the 2027 minimums in place the Q22 floor never binds, which is the
 * point: the list and the client's rule now agree everywhere. It stays because
 * it is the client's decision, not an implementation detail, and it keeps a
 * future band without a minimum from reopening the cliff.
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

/** Saturday, as JS counts weekdays. @type {number} */
const SATURDAY = 6;

/**
 * The monthly plan's rate. The 2027 list gives it one figure for every day it
 * can be booked, Saturday included, unlike the subscription plans below.
 * @type {number}
 */
export const HOME_MONTHLY_RATE = number("services.homecleaning.frequencies.1.hourlyRate");

/**
 * One-off cleaning, which the 2027 list prices by weekday group rather than by
 * weekday: Monday to Friday share one rate and Saturday has its own.
 * @type {Readonly<{ weekday: number, saturday: number }>}
 */
export const HOME_ONETIME_RATES = Object.freeze({
  weekday: number("services.homecleaning.frequencies.onetime.hourlyRate"),
  saturday: number("services.homecleaning.frequencies.onetime.saturdayHourlyRate"),
});

/**
 * The three rates the subscription plans ("2" and "4") are priced at, as the
 * summary names them. Saturday is new in the 2027 list: before it, no weekend
 * day had a rate at all. Sunday still has none and is not bookable.
 * @type {Readonly<{ mondayToWednesday: number, thursdayToFriday: number, saturday: number }>}
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
  saturday: number("services.homecleaning.weekdayRates.byDay.saturday"),
});

/**
 * Hourly rate for hemstädning.
 *
 * Every plan except the monthly one now depends on the day, so a rate needs a
 * date. That is why `weekday` may be null and the answer is then null too: a
 * one-off clean costs 300 kr on a Tuesday and 400 kr on a Saturday, and
 * showing either figure before the customer has picked a day would be a guess.
 *
 * @param {string} frequency Frequency value of the form ("1", "2", "4", "onetime").
 * @param {number|null} weekday JS weekday index (0 = Sunday), or null.
 * @returns {number|null} null when the day carries no rate, i.e. a Sunday, or
 *   when no day has been chosen yet and the plan is priced by day.
 */
export function homeCleaningHourlyRate(frequency, weekday) {
  if (frequency === "1") return HOME_MONTHLY_RATE;
  if (frequency === "onetime") {
    if (weekday === SATURDAY) return HOME_ONETIME_RATES.saturday;
    if (weekday >= 1 && weekday <= 5) return HOME_ONETIME_RATES.weekday;
    return null;
  }
  if (weekday >= 1 && weekday <= 3) return HOME_WEEKDAY_RATES.mondayToWednesday;
  if (weekday >= 4 && weekday <= 5) return HOME_WEEKDAY_RATES.thursdayToFriday;
  if (weekday === SATURDAY) return HOME_WEEKDAY_RATES.saturday;
  return null;
}

/* ------------------------------ storstädning ----------------------------- */

const DEEP_TIERS = areaTiers("services.deepcleaning.tiers");
const DEEP_MIN_SQM = number("services.deepcleaning.minSqm");

/** Homes larger than this are quoted, not priced online. @type {number} */
export const DEEP_CLEANING_QUOTE_ABOVE_AREA = number("services.deepcleaning.quoteAboveSqm");

/**
 * The area bands, in price-list order, for a caller that has to name them one
 * by one (the chatbot) instead of pricing a single home.
 * @type {ReadonlyArray<AreaTier>}
 */
export const DEEP_CLEANING_TIERS = DEEP_TIERS;

/** Smallest size the storstädning list prices. @type {number} */
export const DEEP_CLEANING_MIN_AREA = DEEP_MIN_SQM;

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
 * The area bands, in price-list order.
 * @type {ReadonlyArray<AreaTier>}
 */
export const MOVE_CLEANING_TIERS = MOVE_TIERS;

/** Smallest size the flyttstädning list prices. @type {number} */
export const MOVE_CLEANING_MIN_AREA = MOVE_MIN_SQM;

/**
 * Homes larger than this are quoted, not priced online. New in the 2027 list,
 * which stops at 150 m²; the 2026 list priced any size at 42 kr/m².
 * @type {number}
 */
export const MOVE_CLEANING_QUOTE_ABOVE_AREA = number("services.movecleaning.quoteAboveSqm");

/**
 * Price by size: the band's rate per m² or its minimum, whichever is higher.
 * @param {number} area Size in m².
 * @returns {number|null} null below the smallest band and above
 *   MOVE_CLEANING_QUOTE_ABOVE_AREA, both of which call for a quote.
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

// The three percentage surcharges (spröjs, ceilings over 280 cm, triple
// glazing, +25 % each) are not in the 2027 list and no longer exist. What
// replaced them is priced per window frame instead, below.
//
// A guard, so the removal cannot quietly undo itself: if `surcharges` comes
// back into the JSON, the build stops rather than resuming a 25 % charge the
// current price list does not mention.
(() => {
  let revived = false;
  try {
    at("services.windowcleaning.surcharges");
    revived = true;
  } catch {
    revived = false;
  }
  if (revived) {
    throw new Error(
      `${FILE}: "services.windowcleaning.surcharges" is back. The 2027 list has no percentage ` +
        `surcharges; price the add-ons under windowcleaning.extras instead, or delete this guard ` +
        `on purpose if the client has reinstated them.`
    );
  }
})();

/**
 * Window frames covered by the room price, per rum (Q20b, client, confirmed
 * 2026-11-25: "ett rum har i regel ett fönster med 3 bågar").
 *
 * Counted per rum and not per "rum och kök": the kitchen is not a rum, so a
 * "2 rum och kök" home has 6 frames included. Without this figure the 2027
 * list's price for an EXTRA frame means nothing, which is why the calculator
 * could not charge for one until the client answered.
 * @type {number}
 */
export const WINDOW_INCLUDED_BAGAR_PER_ROOM = number(
  "services.windowcleaning.includedBagarPerRoom.value"
);

/**
 * What one frame beyond the included ones costs. Spröjs is no longer a
 * percentage on the whole job: in the 2027 list it is the difference between
 * these two amounts, and it applies to the extra frames only.
 * @type {Readonly<{ plain: number, sprojs: number }>}
 */
export const WINDOW_EXTRA_BAGE_PRICES = Object.freeze({
  plain: number("services.windowcleaning.extras.extraBageUtanSprojs.price"),
  sprojs: number("services.windowcleaning.extras.extraBageMedSprojs.price"),
});

/**
 * Frames included in a home of `rooms` rum, or 0 when no room count applies
 * (the glassed-balcony-only job).
 * @param {number|string|null} rooms
 * @returns {number}
 */
export function windowIncludedBagar(rooms) {
  const count = Number(rooms);
  if (!Number.isInteger(count) || count < 1) return 0;
  return count * WINDOW_INCLUDED_BAGAR_PER_ROOM;
}

/**
 * Charge for the frames above the included ones.
 * @param {number} totalBagar Frames the customer says the home has.
 * @param {number|string|null} rooms
 * @param {boolean} hasSprojs
 * @returns {number} 0 when the home is within its included frames.
 */
export function windowExtraBagePrice(totalBagar, rooms, hasSprojs = false) {
  const extra = Math.max(0, totalBagar - windowIncludedBagar(rooms));
  const rate = hasSprojs ? WINDOW_EXTRA_BAGE_PRICES.sprojs : WINDOW_EXTRA_BAGE_PRICES.plain;
  return extra * rate;
}

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

/**
 * The site-hut bands, in price-list order. `byVisitsPerWeek` is keyed by the
 * number of cleanings a week, so a caller that has to name the cheapest and
 * the dearest rate (the chatbot) does not have to guess the combinations.
 * @type {ReadonlyArray<{ minUnits: number, maxUnits: number, byVisitsPerWeek: Record<string, number> }>}
 */
export const CONTAINER_CLEANING_TIERS = CONTAINER_TIERS;

/** Cleanings a week the price list covers, ascending. @type {ReadonlyArray<number>} */
export const CONTAINER_VISITS_PER_WEEK = Object.freeze(
  [...new Set(CONTAINER_TIERS.flatMap((tier) => Object.keys(tier.byVisitsPerWeek)))]
    .map(Number)
    .sort((a, b) => a - b)
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

/* ------------------------------ sales terms ------------------------------ */
// Q24 and Q25, confirmed by the client on 2026-09-17, and Q90, Q92 and
// Q101-Q110, confirmed on 2026-10-15. They live here with the rates so that a
// page, the legal documents, the FAQ and the chatbot cannot each carry a
// different figure. The two cancellation fees are ceilings, never flat fees,
// so every sentence that quotes them has to say "upp till".

/** Discount on a customer's first cleaning, in percent (Q25). @type {number} */
export const FIRST_CLEANING_DISCOUNT_PERCENT = number("terms.firstCleaningDiscountPercent.value");

/** How many days before the visit a booking may still be cancelled (Q24). @type {number} */
export const CANCELLATION_NOTICE_DAYS = number("terms.cancellationNoticeDays.value");

/**
 * The same deadline in hours, which is how the client wrote it (Q101). The
 * copy quotes both figures together so the site never looks like it has two
 * different deadlines.
 * @type {number}
 */
export const CANCELLATION_NOTICE_HOURS = number("terms.cancellationNoticeHours.value");

/** Ceiling for a cancellation after the deadline, in percent (Q101). @type {number} */
export const LATE_CANCELLATION_FEE_PERCENT = number("terms.lateCancellationFeePercent.value");

/**
 * Ceiling for a same-day cancellation, and for being denied access, in
 * percent (Q101).
 * @type {number}
 */
export const SAME_DAY_CANCELLATION_FEE_PERCENT = number(
  "terms.sameDayCancellationFeePercent.value"
);

/** Hours within which an enquiry is answered (Q90). @type {number} */
export const RESPONSE_TIME_HOURS = number("terms.responseTimeHours.value");

/**
 * Ceiling for the heavy-soiling surcharge, in percent, by service id (Q104).
 *
 * Until the 2027 list both services capped it at 20 % and this was a single
 * number that threw if the two ever drifted apart. The 2027 list raised
 * flyttstädning to 25 % and left storstädning at 20 %, so they are now read
 * separately and every sentence that quotes one has to name its service.
 * The shape of the rule is unchanged: a ceiling, never a flat rate, approved by
 * the customer on site before any extra work.
 * @type {Readonly<{ deepcleaning: number, movecleaning: number }>}
 */
export const SOILING_SURCHARGE_MAX_PERCENT = Object.freeze({
  deepcleaning: number("services.deepcleaning.soilingSurcharge.maxPercent"),
  movecleaning: number("services.movecleaning.soilingSurcharge.maxPercent"),
});

/** Days to pay an invoice (Q24). @type {number} */
export const PAYMENT_TERMS_DAYS = number("terms.paymentTermsDays.value");

/** Invoice fee in SEK (Q24). @type {number} */
export const INVOICE_FEE = number("terms.invoiceFee.value");

/** Notice period of a recurring agreement, in months (Q24). @type {number} */
export const NOTICE_PERIOD_MONTHS = number("terms.noticePeriodMonths.value");
