/**
 * QA: unit checks for the offer-acceptance rules — link tokens, the Swedish
 * withdrawal period and its non-working-day extension, offer and link
 * lifetimes, which declarations the screen must require, and the travel-fee
 * zone lookup. No network, no side effects.
 *
 *   node scripts/qa-offers.mjs
 */
import {
  ANGERFRIST_DAYS,
  OFFER_VALID_DAYS,
  OFFER_CUTOFF_HOURS_BEFORE_SERVICE,
  LINK_GRACE_DAYS,
  ACCEPT_BUTTON_LABEL,
  WITHDRAW_ENTRY_LABEL,
  WITHDRAW_CONFIRM_LABEL,
  formatOfferToken,
  parseOfferToken,
  easterSunday,
  offerViewState,
  canAccept,
  isSwedishNonWorkingDay,
  angerfristEndsAt,
  offerExpiresAt,
  linkValidUntil,
  serviceFallsInsideAngerfrist,
  requiredConsents,
  missingConsents,
  normalisePostnummer,
  travelZoneFor,
} from "../utils/offerRules.js";
import { createOfferToken, hashVerifier, verifyOfferToken } from "../utils/offerToken.js";
import { stockholmDateParts } from "../utils/timeZone.js";

let passed = 0;
const failures = [];

function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed += 1;
    console.log(`  ok   ${label}`);
  } else {
    failures.push(`${label} — got ${a}, expected ${e}`);
    console.log(`  FAIL ${label} — got ${a}, expected ${e}`);
  }
}

// Stockholm calendar date of an instant, as YYYY-MM-DD.
function stockholmDay(date) {
  const p = stockholmDateParts(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

function weekdayOf(isoDay) {
  const [y, m, d] = isoDay.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

console.log("\n=== the button labels are the legally required words ===");
// C-249/21 Fuhrmann-2: only the words on the button decide whether the
// consumer is bound. A typo here is not cosmetic, so it is pinned.
check("accept button", ACCEPT_BUTTON_LABEL, "Beställning förenad med betalningsskyldighet");
check("withdrawal entry", WITHDRAW_ENTRY_LABEL, "Ångra avtalet här");
check("withdrawal confirm", WITHDRAW_CONFIRM_LABEL, "Bekräfta frånträde");
check("the accept button carries nothing else", /^[A-Za-zÅÄÖåäö ]+$/.test(ACCEPT_BUTTON_LABEL), true);

console.log("\n=== link tokens: selector plus hashed verifier ===");
const token = createOfferToken();
check("selector is 16 hex characters", /^[0-9a-f]{16}$/.test(token.selector), true);
check("verifier is base64url", /^[A-Za-z0-9_-]+$/.test(token.verifier), true);
check("the stored hash is not the verifier", token.verifierHash === token.verifier, false);
check("hash is 64 hex characters", /^[0-9a-f]{64}$/.test(token.verifierHash), true);
check("the right verifier verifies", verifyOfferToken(token.verifier, token.verifierHash), true);
check("a wrong verifier does not", verifyOfferToken("wrong", token.verifierHash), false);
check("the hash cannot be replayed as the verifier", verifyOfferToken(token.verifierHash, token.verifierHash), false);
check("two tokens differ", createOfferToken().selector === createOfferToken().selector, false);
check("hashing is stable", hashVerifier("abc") === hashVerifier("abc"), true);
check("null input is refused, not thrown", verifyOfferToken(null, token.verifierHash), false);
check("a non-string hash is refused", verifyOfferToken(token.verifier, null), false);

const wire = formatOfferToken(token);
check("round trips through the URL form", parseOfferToken(wire), {
  selector: token.selector,
  verifier: token.verifier,
});
check("garbage parses to null", parseOfferToken("nope"), null);
check("empty parses to null", parseOfferToken(""), null);
check("a selector alone parses to null", parseOfferToken(token.selector), null);
check("a selector with the wrong length is refused", parseOfferToken(`abc.${token.verifier}`), null);

console.log("\n=== Swedish non-working days ===");
// Easter Sundays, checked against the published dates.
check("Easter 2024", easterSunday(2024), { month: 3, day: 31 });
check("Easter 2025", easterSunday(2025), { month: 4, day: 20 });
check("Easter 2026", easterSunday(2026), { month: 4, day: 5 });
check("Easter 2027", easterSunday(2027), { month: 3, day: 28 });

function nonWorking(y, m, d) {
  const probe = new Date(Date.UTC(y, m - 1, d));
  return isSwedishNonWorkingDay({ year: y, month: m, day: d, weekday: probe.getUTCDay() });
}
check("nyarsdagen", nonWorking(2027, 1, 1), true);
check("trettondedag jul", nonWorking(2027, 1, 6), true);
check("langfredagen 2026", nonWorking(2026, 4, 3), true);
check("annandag pask 2026", nonWorking(2026, 4, 6), true);
check("Kristi himmelsfardsdag 2026", nonWorking(2026, 5, 14), true);
check("pingstdagen 2026", nonWorking(2026, 5, 24), true);
check("forsta maj", nonWorking(2027, 5, 1), true);
check("nationaldagen", nonWorking(2027, 6, 6), true);
check("julafton", nonWorking(2027, 12, 24), true);
check("juldagen", nonWorking(2027, 12, 25), true);
check("annandag jul", nonWorking(2027, 12, 26), true);
check("nyarsafton", nonWorking(2027, 12, 31), true);
check("an ordinary Wednesday is a working day", nonWorking(2027, 3, 10), false);

console.log("\n=== the withdrawal period ===");
check("the constant is fourteen", ANGERFRIST_DAYS, 14);

// Property that must hold for every contract day of a whole year: the period
// is at least fourteen days long and never ends on a non-working day.
let tooShort = 0;
let endedOnClosedDay = 0;
for (let offset = 0; offset < 365; offset += 1) {
  const contractAt = new Date(Date.UTC(2027, 0, 1 + offset, 12, 0, 0));
  const end = angerfristEndsAt(contractAt);
  if (!end) {
    endedOnClosedDay += 1;
    continue;
  }
  const days = (end.getTime() - contractAt.getTime()) / 86400000;
  if (days < ANGERFRIST_DAYS) tooShort += 1;
  if (nonWorking(...stockholmDay(end).split("-").map(Number))) endedOnClosedDay += 1;
}
check("never shorter than fourteen days, over a whole year", tooShort, 0);
check("never ends on a non-working day, over a whole year", endedOnClosedDay, 0);

// The period ends at the end of the day, in Stockholm time, so a customer who
// opens the link at 23:30 on the last day is still inside it.
const endOfPeriod = angerfristEndsAt(new Date(Date.UTC(2027, 2, 1, 9, 0, 0)));
check("ends at 23:59 Stockholm time", stockholmDateParts(endOfPeriod).hour, 23);
check("and on the minute", stockholmDateParts(endOfPeriod).minute, 59);

// Two cleanings booked a minute apart across the March clock change must not
// land on different deadlines.
const beforeDst = angerfristEndsAt(new Date(Date.UTC(2027, 2, 28, 0, 59, 0)));
const afterDst = angerfristEndsAt(new Date(Date.UTC(2027, 2, 28, 1, 1, 0)));
check("the spring clock change does not split the deadline", stockholmDay(beforeDst), stockholmDay(afterDst));

// A missing date must stop the caller, not produce a 1970 deadline that reads
// as "already expired" and gets a valid withdrawal refused.
check("a bad date yields null rather than a wrong deadline", angerfristEndsAt("not a date"), null);
check("null yields null, not 1970", angerfristEndsAt(null), null);
check("undefined yields null", angerfristEndsAt(undefined), null);
check("an empty string yields null", angerfristEndsAt(""), null);
check("false yields null", angerfristEndsAt(false), null);
check("the epoch yields null", angerfristEndsAt(0), null);
check("a date before this system existed yields null", angerfristEndsAt("2014-06-01T10:00:00Z"), null);
check("a real date still works", angerfristEndsAt("2027-06-01T10:00:00Z") !== null, true);

console.log("\n=== offer and link lifetimes ===");
const created = new Date(Date.UTC(2027, 1, 1, 10, 0, 0));

// No service date: the offer simply ages out.
check(
  "without a service date it lasts the full window",
  offerExpiresAt({ createdAt: created }).toISOString(),
  new Date(created.getTime() + OFFER_VALID_DAYS * 86400000).toISOString()
);

// A cleaning next week closes the offer 48 h before it, not in two weeks.
const serviceSoon = new Date(Date.UTC(2027, 1, 6, 8, 0, 0));
check(
  "a near service date closes the offer 48 h before it",
  offerExpiresAt({ createdAt: created, serviceAt: serviceSoon }).toISOString(),
  new Date(serviceSoon.getTime() - OFFER_CUTOFF_HOURS_BEFORE_SERVICE * 3600000).toISOString()
);

// A cleaning two months out does not extend the offer past its own age limit.
const serviceFar = new Date(Date.UTC(2027, 3, 1, 8, 0, 0));
check(
  "a far service date does not extend the offer",
  offerExpiresAt({ createdAt: created, serviceAt: serviceFar }).toISOString(),
  new Date(created.getTime() + OFFER_VALID_DAYS * 86400000).toISOString()
);

// Already inside the cutoff: the offer is not acceptable, and we say so with
// the creation instant rather than a date in the past.
const serviceTomorrow = new Date(created.getTime() + 12 * 3600000);
check(
  "a service inside the cutoff is never acceptable",
  offerExpiresAt({ createdAt: created, serviceAt: serviceTomorrow }).toISOString(),
  created.toISOString()
);

// The link has to outlive the withdrawal period of the last acceptable day.
const expires = offerExpiresAt({ createdAt: created });
const linkEnd = linkValidUntil({ expiresAt: expires });
check("the link outlives the offer", linkEnd > expires, true);
check(
  "by the whole withdrawal period plus the grace days",
  linkEnd >= new Date(angerfristEndsAt(expires).getTime() + LINK_GRACE_DAYS * 86400000),
  true
);
check(
  "so a customer accepting on the last day keeps a working link",
  linkEnd > angerfristEndsAt(expires),
  true
);
check("a bad expiry yields null", linkValidUntil({ expiresAt: "nope" }), null);
check("a null expiry yields null", linkValidUntil({ expiresAt: null }), null);
check("a null creation date yields null", offerExpiresAt({ createdAt: null }), null);
check("a bad creation date yields null", offerExpiresAt({ createdAt: "nope" }), null);
check(
  "a null service date just means no cutoff",
  offerExpiresAt({ createdAt: created, serviceAt: null }).toISOString(),
  new Date(created.getTime() + OFFER_VALID_DAYS * 86400000).toISOString()
);

console.log("\n=== which declarations the screen requires ===");
const contractAt = new Date(Date.UTC(2027, 1, 1, 10, 0, 0));

// The normal one-off: cleaning in three days, inside the fourteen.
check(
  "a cleaning in three days is inside the period",
  serviceFallsInsideAngerfrist({
    serviceAt: new Date(Date.UTC(2027, 1, 4, 8, 0, 0)),
    contractAt,
  }),
  true
);
check(
  "a cleaning in five weeks is outside it",
  serviceFallsInsideAngerfrist({
    serviceAt: new Date(Date.UTC(2027, 2, 8, 8, 0, 0)),
    contractAt,
  }),
  false
);
check(
  "no agreed date counts as inside",
  serviceFallsInsideAngerfrist({ serviceAt: null, contractAt }),
  true
);

check(
  "inside the period: both halves of 11 § 1 are required",
  requiredConsents({ serviceAt: new Date(Date.UTC(2027, 1, 4, 8, 0, 0)), contractAt }),
  { info: true, start: true, lapse: true, discount: false }
);
check(
  "outside it: only the information box",
  requiredConsents({ serviceAt: new Date(Date.UTC(2027, 2, 8, 8, 0, 0)), contractAt }),
  { info: true, start: false, lapse: false, discount: false }
);
check(
  "with the intro discount its own box appears",
  requiredConsents({
    serviceAt: new Date(Date.UTC(2027, 2, 8, 8, 0, 0)),
    contractAt,
    hasIntroDiscount: true,
  }),
  { info: true, start: false, lapse: false, discount: true }
);

const needed = requiredConsents({ serviceAt: new Date(Date.UTC(2027, 1, 4, 8, 0, 0)), contractAt });
check(
  "all four ticked: nothing missing",
  missingConsents(needed, { info: true, start: true, lapse: true, discount: true }),
  []
);
check(
  "start alone does not extinguish the right, so lapse is still missing",
  missingConsents(needed, { info: true, start: true }),
  ["lapse"]
);
check("nothing ticked: all three required ones are missing", missingConsents(needed, {}), [
  "info",
  "start",
  "lapse",
]);
check(
  "a box that was not required cannot be missing",
  missingConsents({ info: true, start: false, lapse: false, discount: false }, { info: true }),
  []
);

console.log("\n=== travel-fee zones ===");
check("five digits pass", normalisePostnummer("11221"), "11221");
check("the Swedish space is accepted", normalisePostnummer("112 21"), "11221");
check("four digits are refused", normalisePostnummer("1122"), null);
check("letters are refused", normalisePostnummer("11A21"), null);
check("empty is refused", normalisePostnummer(""), null);

const zones = [
  { postnummer_from: 10000, postnummer_to: 19299, zone: 1, fee_incl_vat: 150, label: "Stockholm" },
  { postnummer_from: 14000, postnummer_to: 14899, zone: 2, fee_incl_vat: 250, label: "Ytterforort syd" },
  { postnummer_from: 14900, postnummer_to: 14999, zone: 3, fee_incl_vat: null, label: "Nynashamn" },
  { postnummer_from: 10000, postnummer_to: 10100, zone: 9, fee_incl_vat: 1, label: "retired", valid_to: "2026-01-01" },
];

check("central Stockholm gets zone 1", travelZoneFor("112 21", zones), {
  zone: 1,
  feeInclVat: 150,
  label: "Stockholm",
  manual: false,
});
check("the narrower outer range wins over the broad one", travelZoneFor("14150", zones), {
  zone: 2,
  feeInclVat: 250,
  label: "Ytterforort syd",
  manual: false,
});
check("a zone with no published figure is quoted by hand", travelZoneFor("14950", zones), {
  zone: 3,
  feeInclVat: null,
  label: "Nynashamn",
  manual: true,
});
check("an uncovered postcode is quoted by hand", travelZoneFor("90210", zones), {
  zone: null,
  feeInclVat: null,
  label: null,
  manual: true,
});
check("a malformed postcode is quoted by hand", travelZoneFor("abc", zones), {
  zone: null,
  feeInclVat: null,
  label: null,
  manual: true,
});
check("a retired row is ignored", travelZoneFor("10050", zones).zone, 1);

console.log("");
console.log("=== what an opened link shows ===");

const T0 = new Date("2026-03-02T10:00:00Z");
const openOffer = {
  status: "sent",
  expires_at: "2026-03-16T22:59:59Z",
  link_valid_until: "2026-03-23T22:59:59Z",
};
const at = (iso) => new Date(iso);

check("a sent offer inside its window is open", offerViewState(openOffer, T0), "open");
check("and may be accepted", canAccept(openOffer, T0), true);

check("past expires_at it is expired", offerViewState(openOffer, at("2026-03-17T00:00:00Z")), "expired");
check("an expired offer cannot be accepted", canAccept(openOffer, at("2026-03-17T00:00:00Z")), false);

// The page must outlive the offer: whoever accepted on the last day still has
// 14 days of withdrawal left, and this link is how they use it.
check("the link still answers after expiry", offerViewState(openOffer, at("2026-03-20T00:00:00Z")), "expired");
check("but dies at link_valid_until", offerViewState(openOffer, at("2026-03-24T00:00:00Z")), "unavailable");

check("an accepted offer shows as accepted", offerViewState({ ...openOffer, status: "accepted" }, T0), "accepted");
check("and cannot be accepted twice", canAccept({ ...openOffer, status: "accepted" }, T0), false);
check(
  "an accepted offer is still readable after expiry",
  offerViewState({ ...openOffer, status: "accepted" }, at("2026-03-20T00:00:00Z")),
  "accepted"
);
check(
  "and gone once the link dies",
  offerViewState({ ...openOffer, status: "accepted" }, at("2026-03-24T00:00:00Z")),
  "unavailable"
);

check("a cancelled offer is cancelled", offerViewState({ ...openOffer, status: "cancelled" }, T0), "cancelled");
check("a declined offer reads the same", offerViewState({ ...openOffer, status: "declined" }, T0), "cancelled");
check("a withdrawn offer reads the same", offerViewState({ ...openOffer, status: "withdrawn" }, T0), "cancelled");

// A draft is a document the office is still writing. A leaked draft link must
// never be acceptable.
check("a draft is never visible", offerViewState({ ...openOffer, status: "draft" }, T0), "unavailable");
check("and never acceptable", canAccept({ ...openOffer, status: "draft" }, T0), false);

check("no offer at all is unavailable", offerViewState(null, T0), "unavailable");
check("and not acceptable", canAccept(null, T0), false);

// Guessing the other way would form a contract on an offer nobody set a
// deadline for, so a missing or absurd expiry counts as expired.
check("a missing expires_at is expired", offerViewState({ ...openOffer, expires_at: null }, T0), "expired");
check("a 1970 expires_at is expired", offerViewState({ ...openOffer, expires_at: 0 }, T0), "expired");

console.log(`\n=== ${passed}/${passed + failures.length} OK ===`);
if (failures.length) {
  console.log(failures.map((f) => `  FAIL: ${f}`).join("\n"));
  process.exit(1);
}
