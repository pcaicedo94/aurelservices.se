import { stockholmDateParts, stockholmToUtc } from "./timeZone.js";

// Rules for the offer-acceptance flow. Plain constants and pure functions, in
// the shape of utils/bookingRules.js, so a PHP port can copy them one to one
// and so every one of them is testable without a database or a mail server.
//
// Nothing here reads config/prices.json. An offer is priced once, when it is
// created, and the figures are frozen into offers.snapshot. These functions
// decide dates, tokens and which declarations the screen must require -- never
// a price.

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// distansavtalslagen (2005:59) 2 kap. 10 §: fourteen days to withdraw from a
// distance contract, no reason needed. 2 kap. 12 § puts the start of the
// period, for a service, on the day the contract was made -- which here is the
// day the customer presses the button, not the day the offer was sent.
export const ANGERFRIST_DAYS = 14;

// How long an offer stays acceptable. Not a legal figure: a commercial one, so
// a price from three months ago cannot be accepted at today's cost base.
export const OFFER_VALID_DAYS = 14;

// An offer stops being acceptable this long before the cleaning, so the office
// is never holding a slot it cannot staff.
export const OFFER_CUTOFF_HOURS_BEFORE_SERVICE = 48;

// Days the link keeps answering after the withdrawal period has run out.
// 2 kap. 10 a § requires the withdrawal function to be reachable "under hela
// angerfristen"; the margin covers a customer who opens the link on the last
// evening and a clock that disagrees with ours by a few hours.
export const LINK_GRACE_DAYS = 7;

// The label on the accept button, in Swedish, verbatim.
//
// C-249/21 Fuhrmann-2 (CJEU, 7 April 2022), paragraph 28: only the words ON
// the button are taken into account. Paragraph 29: the assessment is made with
// no regard to the surrounding circumstances. So text beside, above or below
// the button cannot cure it, and the sanction for getting it wrong is that the
// consumer is not bound by the order at all -- not a fine.
//
// Directive 2011/83/EU art. 8.2 says the button is to be marked "endast med
// orden", only with the words. That is why nothing else may go inside the
// button: no price, no tick, no "(moms ingar)".
export const ACCEPT_BUTTON_LABEL = "Beställning förenad med betalningsskyldighet";

// The two labels of the withdrawal function. Directive (EU) 2023/2673, which
// inserted art. 11a into 2011/83, fixes these words; Swedish 2 kap. 10 a § only
// asks for "tydligt och lattlast", so we follow the stricter European text.
export const WITHDRAW_ENTRY_LABEL = "Ångra avtalet här";
export const WITHDRAW_CONFIRM_LABEL = "Bekräfta frånträde";

// ---------------------------------------------------------------------------
// The unique link: selector plus hashed verifier
// ---------------------------------------------------------------------------
//
// The selector is what the lookup uses, so it is indexed and public. The
// verifier only ever exists in the customer's email; the database keeps its
// SHA-256. A dump of public.offers therefore does not let anyone accept an
// offer, which a single plain token in a URL would.
//
// php/api/calendar.php already compares its one shared token with hash_equals.
// Same idea, sized to one secret per customer.

// Every date in this module goes through here first.
//
// `new Date(null)` is 1970-01-01, not an invalid date, and `new Date("")` and
// `new Date(false)` are the same. A missing contract date would therefore
// produce a withdrawal deadline in 1970, which reads as "already expired" --
// so a customer exercising a right they still hold would be refused. Anything
// that is not a real date has to come back as null and stop the caller.
// Anything before this is a bug upstream, not a date. `0`, `-1` and a stray
// epoch timestamp are all valid Dates in 1970, and the floor catches them
// without special-casing any single value: this system was built in 2026, so a
// contract date in the last century never arrived legitimately.
const EARLIEST_SANE_DATE = Date.UTC(2020, 0, 1);

function toDate(value) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime() < EARLIEST_SANE_DATE ? null : date;
}

// createOfferToken, hashVerifier and verifyOfferToken live in
// utils/offerToken.js. They need node's crypto, and this module is imported
// by the offer page, which is also bundled for the browser.

// The token as it travels in a URL: selector first so a log line that gets
// truncated still identifies the offer without leaking the secret half.
export function formatOfferToken({ selector, verifier }) {
  return `${selector}.${verifier}`;
}

export function parseOfferToken(raw) {
  const match = /^([0-9a-f]{16})\.([A-Za-z0-9_-]{20,64})$/.exec(String(raw || "").trim());
  if (!match) return null;
  return { selector: match[1], verifier: match[2] };
}

// ---------------------------------------------------------------------------
// Swedish non-working days
// ---------------------------------------------------------------------------
//
// lagen (1930:173) om berakning av lagstadgad tid, 2 §: when the last day for
// an action falls on a Sunday, another public holiday, a Saturday, midsummer
// eve, Christmas eve or New Year's eve, the action may be taken on the next
// working day.
//
// This only ever moves a deadline later, which is always to the consumer's
// advantage. Leaving it out would make our withdrawal period SHORTER than the
// law gives in roughly a third of cases, and a period cut short is exactly
// what starts the clock over again (2 kap. 12 §).

// Easter Sunday, anonymous Gregorian algorithm. Returns { month, day }.
export function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function dayNumber(year, month, day) {
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

// The Saturday in a given inclusive window, used for midsommardagen
// (20-26 June) and alla helgons dag (31 October - 6 November).
function saturdayInWindow(year, month, fromDay) {
  for (let day = fromDay; day < fromDay + 7; day += 1) {
    const probe = new Date(Date.UTC(year, month - 1, day));
    if (probe.getUTCDay() === 6) {
      return dayNumber(probe.getUTCFullYear(), probe.getUTCMonth() + 1, probe.getUTCDate());
    }
  }
  return null;
}

// Day numbers that are not working days, for one year. Memoised because the
// withdrawal-period helper walks forward a day at a time.
const nonWorkingCache = new Map();

function nonWorkingDays(year) {
  const cached = nonWorkingCache.get(year);
  if (cached) return cached;

  const easter = easterSunday(year);
  const easterDay = dayNumber(year, easter.month, easter.day);

  const days = new Set([
    dayNumber(year, 1, 1), // nyarsdagen
    dayNumber(year, 1, 6), // trettondedag jul
    easterDay - 2, // langfredagen
    easterDay, // paskdagen
    easterDay + 1, // annandag pask
    dayNumber(year, 5, 1), // forsta maj
    easterDay + 39, // Kristi himmelsfardsdag
    easterDay + 49, // pingstdagen
    dayNumber(year, 6, 6), // nationaldagen
    dayNumber(year, 12, 24), // julafton (1930:173)
    dayNumber(year, 12, 25), // juldagen
    dayNumber(year, 12, 26), // annandag jul
    dayNumber(year, 12, 31), // nyarsafton (1930:173)
  ]);

  const midsummer = saturdayInWindow(year, 6, 20); // midsommardagen
  if (midsummer !== null) {
    days.add(midsummer);
    days.add(midsummer - 1); // midsommarafton (1930:173)
  }
  const allSaints = saturdayInWindow(year, 10, 31); // alla helgons dag
  if (allSaints !== null) days.add(allSaints);

  nonWorkingCache.set(year, days);
  return days;
}

export function isSwedishNonWorkingDay({ year, month, day, weekday }) {
  if (weekday === 0 || weekday === 6) return true; // sondag, lordag
  return nonWorkingDays(year).has(dayNumber(year, month, day));
}

// ---------------------------------------------------------------------------
// The withdrawal period
// ---------------------------------------------------------------------------

// End of the fourteen days, as an instant. The contract day counts as day
// zero, the period ends at the end of day fourteen in Stockholm time, and a
// deadline landing on a non-working day moves to the next working day.
//
// Returns null when the input is not a usable date, so a caller cannot write a
// row with a silently wrong deadline.
export function angerfristEndsAt(contractAt) {
  const start = toDate(contractAt);
  if (!start) return null;

  const { year, month, day } = stockholmDateParts(start);

  // Walk the calendar in Stockholm's own days, not in 24-hour steps: that way
  // the two clock changes a year cannot move the deadline by an hour.
  let end = new Date(Date.UTC(year, month - 1, day + ANGERFRIST_DAYS));

  for (let guard = 0; guard < 14; guard += 1) {
    const parts = {
      year: end.getUTCFullYear(),
      month: end.getUTCMonth() + 1,
      day: end.getUTCDate(),
      weekday: end.getUTCDay(),
    };
    if (!isSwedishNonWorkingDay(parts)) break;
    end = new Date(end.getTime() + 86400000);
  }

  const pad = (n) => String(n).padStart(2, "0");
  const wallClock =
    `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}` +
    "T23:59:59";
  return stockholmToUtc(wallClock);
}

// ---------------------------------------------------------------------------
// Offer and link lifetimes
// ---------------------------------------------------------------------------

// When the offer stops being acceptable: OFFER_VALID_DAYS after it was made,
// or OFFER_CUTOFF_HOURS_BEFORE_SERVICE before the cleaning, whichever comes
// first. A service date already inside the cutoff yields the creation instant,
// which means "not acceptable" rather than a date in the past.
export function offerExpiresAt({ createdAt = new Date(), serviceAt = null } = {}) {
  const created = toDate(createdAt);
  if (!created) return null;

  const byAge = new Date(created.getTime() + OFFER_VALID_DAYS * 86400000);

  const service = toDate(serviceAt);
  if (!service) return byAge;

  const byService = new Date(
    service.getTime() - OFFER_CUTOFF_HOURS_BEFORE_SERVICE * 3600000
  );
  const earliest = byService < byAge ? byService : byAge;
  return earliest < created ? created : earliest;
}

// How long the page keeps answering. It must outlive the longest withdrawal
// period the offer could produce, which is the one starting on its very last
// acceptable day -- so this is measured from expiresAt, never from createdAt.
export function linkValidUntil({ expiresAt } = {}) {
  const expires = toDate(expiresAt);
  if (!expires) return null;

  const angerfristEnd = angerfristEndsAt(expires);
  if (!angerfristEnd) return null;
  return new Date(angerfristEnd.getTime() + LINK_GRACE_DAYS * 86400000);
}

// ---------------------------------------------------------------------------
// Which declarations the screen must require
// ---------------------------------------------------------------------------
//
// Decided when the offer is created and stored on the row, so the screen
// renders what the server says. A browser that omits a field cannot talk its
// way out of a required declaration.

// True when the cleaning is scheduled to happen before the withdrawal period
// runs out. That is the normal case for a one-off: nobody books a cleaning a
// fortnight ahead.
export function serviceFallsInsideAngerfrist({ serviceAt, contractAt = new Date() } = {}) {
  // No agreed date yet: treat it as inside, because the date may still land
  // there and the declarations cost nothing when they turn out unnecessary.
  const service = toDate(serviceAt);
  if (!service) return true;

  const end = angerfristEndsAt(contractAt);
  if (!end) return true;
  return service <= end;
}

// The checkbox set, as flags the offer row stores and the page reads.
//
//   info     always. Confirms the withdrawal information was read
//            (2 kap. 2 § forsta stycket 10).
//
//   start    the express request that the work begin during the period. Without
//   lapse    it, a cleaning carried out inside the fourteen days cannot be
//            billed at all: 2 kap. 15 § is a closed list and a fully performed
//            service is not in it. With it AND the acknowledgement that the
//            right lapses on full performance, 2 kap. 11 § 1 extinguishes the
//            right outright and the full price is due. Both or neither --
//            either one alone leaves the right alive.
//
//   discount the 300 kr introductory clawback. avtalsvillkorslagen (1994:1512)
//            13 §: a term making the consumer pay more than the stated price is
//            without effect unless expressly approved, and anything collected
//            under it is repayable. A general "I accept the terms" is not
//            express approval, so this needs a box of its own.
export function requiredConsents({
  serviceAt = null,
  contractAt = new Date(),
  hasIntroDiscount = false,
} = {}) {
  const inside = serviceFallsInsideAngerfrist({ serviceAt, contractAt });
  return {
    info: true,
    start: inside,
    lapse: inside,
    discount: Boolean(hasIntroDiscount),
  };
}

// Names of the declarations that were required but not given. An acceptance
// with a non-empty result here is refused: the contract is not formed and
// nothing is written.
export function missingConsents(required, given = {}) {
  return Object.keys(required).filter((key) => required[key] && !given[key]);
}

// ---------------------------------------------------------------------------
// Travel fee
// ---------------------------------------------------------------------------

// Five digits, with or without the space Swedes write ("112 21" / "11221").
export function normalisePostnummer(value) {
  const digits = String(value || "").replace(/\s+/g, "");
  return /^\d{5}$/.test(digits) ? digits : null;
}

// Picks the zone row for a postcode. The narrowest matching range wins, so a
// small outer-kommun range can sit inside a broader one without the broader
// one swallowing it.
//
// Returns { zone, feeInclVat, label, manual }. `manual: true` means do not
// price this automatically -- route it to a human. That happens both for a
// known zone with no published figure and for a postcode no row covers; a
// guessed fee is worse than an asked question, because an undisclosed charge
// cannot be billed later (2 kap. 7 §, prisinformationslagen 10 §).
export function travelZoneFor(postnummer, zones = []) {
  const code = normalisePostnummer(postnummer);
  if (!code) return { zone: null, feeInclVat: null, label: null, manual: true };

  const numeric = Number(code);
  const matches = zones
    .filter((row) => !row.valid_to)
    .filter((row) => numeric >= row.postnummer_from && numeric <= row.postnummer_to)
    .sort(
      (a, b) =>
        a.postnummer_to - a.postnummer_from - (b.postnummer_to - b.postnummer_from)
    );

  const row = matches[0];
  if (!row) return { zone: null, feeInclVat: null, label: null, manual: true };

  const fee = row.fee_incl_vat === null || row.fee_incl_vat === undefined
    ? null
    : Number(row.fee_incl_vat);

  return {
    zone: row.zone,
    feeInclVat: fee,
    label: row.label || null,
    manual: fee === null,
  };
}

// ---------------------------------------------------------------------------
// What the customer sees when the link is opened
// ---------------------------------------------------------------------------

// One function decides the state of an opened offer, so the page, the accept
// endpoint and the tests cannot disagree about it. The endpoint re-runs it on
// submit: a page rendered while the offer was still open must not be able to
// accept an offer that has since expired or been cancelled.
//
// States:
//   open       -- can be accepted now
//   accepted   -- already accepted; show the receipt and the withdrawal link
//   expired    -- the acceptance window closed (expires_at passed)
//   cancelled  -- the office withdrew it, or the customer declined
//   unavailable-- never sent, or the link itself has died (link_valid_until)
//
// Note the asymmetry between expired and unavailable: an expired offer still
// renders, because the customer may be coming back to exercise the right of
// withdrawal on one they already accepted, and that right outlives the
// offer. Only link_valid_until closes the page outright.
export function offerViewState(offer, now = new Date()) {
  if (!offer) return "unavailable";

  const at = now instanceof Date ? now : new Date(now);
  const linkDead = toDate(offer.link_valid_until);
  if (linkDead && at.getTime() > linkDead.getTime()) return "unavailable";

  switch (offer.status) {
    case "accepted":
      return "accepted";
    case "declined":
    case "cancelled":
    case "withdrawn":
      return "cancelled";
    case "draft":
      return "unavailable";
    default:
      break;
  }

  const expires = toDate(offer.expires_at);
  if (!expires || at.getTime() > expires.getTime()) return "expired";

  return "open";
}

// True only when an acceptance may be written. The endpoint asks this, never
// the page's own state, so a stale or forged page body cannot create a
// contract out of an offer that is no longer open.
export function canAccept(offer, now = new Date()) {
  return offerViewState(offer, now) === "open";
}
