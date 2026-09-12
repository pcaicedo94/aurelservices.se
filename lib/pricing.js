// Pure price calculations for the service calculators, driven by
// config/prices.json. No React and no I/O: callers pass the parsed JSON in.
//
//   import prices from "../config/prices.json";
//   import { homeCleaningPrice } from "../lib/pricing";
//
//   homeCleaningPrice({ area: "60", frequency: "4", dateTime: "2026-09-14T09:00" }, prices);
//
// Each function reproduces the formula its page uses today, quirks included,
// so a page can switch to this module without a displayed number changing.
// scripts/qa-pricing.mjs checks that and lists where the formulas disagree
// with Prislista 2026. Inputs accept the raw strings the forms hold.
//
// Every result carries `status`:
//   "ok"          a price was calculated
//   "incomplete"  inputs are missing or fall outside every price band
//   "quote"       the job is quoted individually ("Offereras")
//   "unavailable" inputs are valid but no rate exists (weekend hemstädning)

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// Same parsing the pages apply to their inputs.
function toNumber(value) {
  return typeof value === "number" ? value : parseFloat(value);
}

// The pages show every amount with two decimals.
export function formatAmount(amount) {
  return amount.toFixed(2);
}

export function estimateHours(area, timeEstimate) {
  return timeEstimate.baseHours + timeEstimate.hoursPerSqm * area;
}

// Some pages price the unrounded estimate, others the two-decimal figure they
// display; prices.json records which one each service uses.
function billableHours(hours, timeEstimate) {
  return timeEstimate.priceUsesRoundedHours ? Number(hours.toFixed(2)) : hours;
}

function belowMinHours(service, frequency, hours) {
  const minimum = service.minHours;
  return Boolean(minimum && minimum.appliesTo.includes(String(frequency)) && hours < minimum.value);
}

// Reads the weekday from the date part of a datetime-local value
// ("2026-09-14T09:00"), so the result never depends on the machine's time zone.
export function weekdayOf(dateTime) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateTime ?? ""));
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

// Tiers are sorted by maxSqm: the first starts at minSqm, each later one right
// after the previous maxSqm, and maxSqm null means "and upwards".
export function areaTier(area, service) {
  if (!(area >= service.minSqm)) return null;
  return service.tiers.find((tier) => tier.maxSqm === null || area <= tier.maxSqm) || null;
}

function tierAmount(area, service) {
  const tier = areaTier(area, service);
  if (!tier) return 0;
  return tier.type === "perSqm" ? area * tier.pricePerSqm : tier.price;
}

// `selected` is the visitor's choice for one extra: a boolean for a checkbox,
// a count for per-unit extras.
function extraAmount(extra, selected, hours) {
  switch (extra.type) {
    case "fixed":
      return selected ? extra.price : 0;
    case "perUnit":
      return (Number(selected) || 0) * extra.price;
    case "perEstimatedHour":
      return selected ? hours * extra.hourlyRate : 0;
    default:
      throw new Error(`Unknown extra type "${extra.type}"`);
  }
}

// Adds extras in the order prices.json lists them, which is the order the pages
// add them in; with fractional base prices that order changes the last öre.
function addExtras(basePrice, service, selected, hours = 0) {
  let total = basePrice;
  const chosen = [];
  for (const [id, extra] of Object.entries(service.extras || {})) {
    const amount = extraAmount(extra, (selected || {})[id], hours);
    if (amount) {
      total += amount;
      chosen.push({ id, label: extra.label, amount });
    }
  }
  return { total, chosen };
}

export function homeCleaningPrice({ area, frequency, dateTime } = {}, prices) {
  const service = prices.services.homecleaning;
  const plan = service.frequencies[frequency];
  const sqm = toNumber(area);
  if (!plan || !(sqm > 0) || !dateTime) {
    return { status: "incomplete", hourlyRate: 0, hours: 0, hoursText: null, total: 0, totalText: null };
  }

  const hourlyRate = plan.hourlyRate ?? service.weekdayRates.byDay[weekdayOf(dateTime)] ?? 0;
  const hours = estimateHours(sqm, service.timeEstimate);
  const billed = billableHours(hours, service.timeEstimate);
  // One-off cleaning is a single visit; the other plans are priced per month.
  const total = plan.sessionsPerMonth
    ? billed * hourlyRate * plan.sessionsPerMonth
    : billed * hourlyRate;

  return {
    status: hourlyRate > 0 ? "ok" : "unavailable",
    hourlyRate,
    hours,
    hoursText: hours.toFixed(2),
    sessionsPerMonth: plan.sessionsPerMonth,
    total,
    totalText: formatAmount(total),
    belowMinHours: belowMinHours(service, frequency, hours),
  };
}

export function deepCleaningPrice({ area, extras } = {}, prices) {
  const service = prices.services.deepcleaning;
  const sqm = toNumber(area);
  const quote = sqm > service.quoteAboveSqm;
  const basePrice = sqm > 0 && !quote ? tierAmount(sqm, service) : 0;
  const { total, chosen } = addExtras(basePrice, service, extras);

  return {
    status: quote ? "quote" : basePrice > 0 ? "ok" : "incomplete",
    basePrice,
    extras: chosen,
    total,
    totalText: formatAmount(total),
  };
}

export function moveCleaningPrice({ area, extras } = {}, prices) {
  const service = prices.services.movecleaning;
  const sqm = toNumber(area);
  const valid = sqm > 0;
  const hours = valid ? estimateHours(sqm, service.timeEstimate) : 0;
  const basePrice = valid ? tierAmount(sqm, service) : 0;
  const billed = valid ? billableHours(hours, service.timeEstimate) : 0;
  const { total, chosen } = addExtras(basePrice, service, extras, billed);

  return {
    status: basePrice > 0 ? "ok" : "incomplete",
    basePrice,
    hours,
    hoursText: valid ? hours.toFixed(2) : null,
    extras: chosen,
    total,
    totalText: formatAmount(total),
  };
}

export function windowCleaningPrice({ rooms, balconyOnly = false, surcharges } = {}, prices) {
  const service = prices.services.windowcleaning;
  const basePrice = balconyOnly ? service.balconyOnly.price : service.rooms[rooms] ?? 0;

  if (basePrice > 0) {
    const { stacking, items } = service.surcharges;
    const applied = Object.entries(items).filter(([id]) => surcharges && surcharges[id]);
    let total = basePrice;
    if (stacking === "additive") {
      const percent = applied.reduce((sum, [, item]) => sum + item.percent, 0);
      total = basePrice * (1 + percent / 100);
    } else {
      // The page multiplies once per surcharge: two of them add 56.25 %, not 50 %.
      for (const [, item] of applied) total *= 1 + item.percent / 100;
    }
    return {
      status: "ok",
      basePrice,
      surcharges: applied.map(([id]) => id),
      total,
      totalText: formatAmount(total),
    };
  }

  if (Number(rooms) >= service.quote.fromRooms) {
    return { status: "quote", basePrice: 0, surcharges: [], total: null, totalText: null };
  }
  return { status: "incomplete", basePrice: 0, surcharges: [], total: 0, totalText: null };
}

export function officeCleaningPrice({ area, frequency } = {}, prices) {
  const service = prices.services.officecleaning;
  const plan = service.frequencies[frequency];
  const hourlyRate = plan ? plan.hourlyRate : 0;
  const sqm = toNumber(area);
  if (!(sqm > 0)) {
    return { status: "incomplete", hourlyRate, hours: 0, hoursText: null, total: 0, totalText: null };
  }

  const hours = estimateHours(sqm, service.timeEstimate);
  if (!plan) {
    return { status: "incomplete", hourlyRate, hours, hoursText: hours.toFixed(2), total: 0, totalText: null };
  }

  const total = hourlyRate * billableHours(hours, service.timeEstimate) * plan.sessionsPerMonth;
  return {
    status: "ok",
    hourlyRate,
    hours,
    hoursText: hours.toFixed(2),
    sessionsPerMonth: plan.sessionsPerMonth,
    total,
    totalText: formatAmount(total),
    belowMinHours: belowMinHours(service, frequency, hours),
  };
}

export function containerCleaningPrice({ units, visitsPerWeek } = {}, prices) {
  const service = prices.services.containercleaning;
  const count = parseInt(units, 10);
  const visits = parseInt(visitsPerWeek, 10);
  if (!count || !visits) {
    return { status: "incomplete", pricePerUnit: 0, total: 0, totalText: null };
  }

  const tier = service.tiers.find((t) => count >= t.minUnits && count <= t.maxUnits);
  const pricePerUnit = (tier && tier.pricePerUnitByVisitsPerWeek[visits]) || 0;
  const total = pricePerUnit * count * visits * service.weeksPerMonth;

  let status = "ok";
  if (!pricePerUnit) status = count > service.quoteAboveUnits ? "quote" : "incomplete";
  return { status, pricePerUnit, total, totalText: formatAmount(total) };
}
