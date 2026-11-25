// Acceptance endpoint. This is the moment the contract is formed, so almost
// everything here is about making that moment provable and unrepeatable.
//
// Order matters and is not an accident:
//   1. the offer is found by its token and re-checked for being open NOW,
//      because the page the customer is looking at may have been rendered
//      before it expired;
//   2. the declarations required NOW are recomputed, not read off the offer;
//   3. the acceptance row is written first, and a failure aborts the request;
//   4. only then is the offer marked accepted, and a failure there is logged
//      and swallowed.
//
// Step 3 is the rule carried over from the old BookingStore: the database
// write IS the event. An acceptance that is not in offer_acceptances did not
// happen, whatever the offers table says. The reverse -- a row in
// offer_acceptances with the offer still reading 'sent' -- is recoverable by
// hand and visible in the office panel.
//
// Still to come (step 5 of the build): the confirmation on a durable medium
// that 2 kap. 15 § requires. It needs Aurel's organisationsnummer, address and
// telephone, which are not in the repo yet.
import { randomUUID } from "crypto";
import { startTestTrace, respond } from "../../utils/testMode";
import { createOfferStore, screenHash, hashIp } from "../../utils/offerStore";
import { clientIp, createRateLimiter, rateLimitKey, RATE_LIMIT_MESSAGE } from "../../utils/antiSpam";
import {
  ACCEPT_BUTTON_LABEL,
  angerfristEndsAt,
  canAccept,
  missingConsents,
  offerViewState,
  parseOfferToken,
  requiredConsents,
} from "../../utils/offerRules";

// The token is unguessable (8-byte selector, 32-byte verifier), so this is
// not what keeps an attacker out. It keeps a loop from hammering the database.
const limiter = createRateLimiter({ limit: 20, windowMs: 10 * 60 * 1000 });

const MESSAGES = {
  unavailable: "Länken är inte längre giltig. Kontakta oss så skickar vi en ny offert.",
  expired: "Offerten har gått ut. Kontakta oss så skickar vi en ny.",
  cancelled: "Offerten är inte längre aktuell. Kontakta oss om du har frågor.",
  consents: "Kryssa i samtliga rutor för att kunna beställa.",
  failed:
    "Något gick fel och beställningen registrerades inte. Försök igen, eller ring oss på 076-045 02 28.",
};

export default async function handler(req, res) {
  const trace = startTestTrace(req);
  const reply = (status, body) => respond(res, status, body, trace);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return reply(405, { message: "Method not allowed" });
  }

  const gate = limiter.hit(rateLimitKey(req, { testMode: Boolean(trace) }));
  if (!gate.allowed) {
    res.setHeader("Retry-After", String(gate.retryAfterSeconds));
    return reply(429, { message: RATE_LIMIT_MESSAGE });
  }

  const body = req.body || {};
  const token = parseOfferToken(body.token);
  if (!token) return reply(404, { message: MESSAGES.unavailable });

  const store = createOfferStore({ trace });
  const now = new Date();

  let offer;
  try {
    offer = await store.findByToken(token);
  } catch (error) {
    console.error("Offer lookup failed:", error?.message || error);
    return reply(500, { message: MESSAGES.failed });
  }

  // A bad selector and a bad verifier give the same answer, so the response
  // cannot be used to confirm that a selector exists.
  if (!offer) return reply(404, { message: MESSAGES.unavailable });

  const state = offerViewState(offer, now);

  // Already accepted is a success, not an error. A double click, a retry or a
  // mail client prefetching the link must not look like a failure to someone
  // who has in fact ordered.
  if (state === "accepted") {
    return reply(200, { accepted: true, already: true });
  }

  if (!canAccept(offer, now)) {
    return reply(409, { message: MESSAGES[state] || MESSAGES.unavailable, state });
  }

  // Recomputed here, deliberately, instead of reading offers.requires_*.
  // Those flags were decided when the offer was drafted, and the 14 days run
  // from the contract date, which is now. An offer drafted three weeks before
  // the cleaning can be accepted a fortnight later, by which time the cleaning
  // HAS fallen inside the period -- and then the consent the stored flag says
  // is unnecessary is exactly the one that makes the work billable.
  const required = requiredConsents({
    serviceAt: offer.service_at,
    contractAt: now,
    hasIntroDiscount: Boolean(offer.requires_discount_consent),
  });

  const given = {
    info: Boolean(body.consentInfo),
    start: Boolean(body.consentStart),
    lapse: Boolean(body.consentLapse),
    discount: Boolean(body.consentDiscount),
  };

  const missing = missingConsents(required, given);
  if (missing.length > 0) {
    return reply(422, { message: MESSAGES.consents, missing });
  }

  // The button label is stored verbatim rather than referenced, because
  // C-249/21 Fuhrmann-2 makes the words on the button the thing that decides
  // whether the consumer is bound. The page must send back what it displayed;
  // if it sends something else, the record shows what it actually said.
  const buttonLabel = String(body.buttonLabel || "").trim() || ACCEPT_BUTTON_LABEL;

  const acceptance = {
    id: randomUUID(),
    offer_id: offer.id,
    accepted_at: now.toISOString(),
    consent_info: given.info,
    consent_start: given.start,
    consent_lapse: given.lapse,
    consent_discount: given.discount,
    button_label: buttonLabel,
    screen_snapshot: offer.snapshot,
    screen_sha256: screenHash(offer.snapshot),
    ip_hash: hashIp(clientIp(req)),
    user_agent: String(req.headers?.["user-agent"] || "").slice(0, 500) || null,
    angerfrist_ends_at: angerfristEndsAt(now).toISOString(),
  };

  let result;
  try {
    result = await store.recordAcceptance(acceptance);
  } catch (error) {
    // Nothing was written, so nothing is half-done: the customer is told to
    // try again and the offer is still open.
    console.error("Offer acceptance could not be stored:", offer.id, error?.message || error);
    return reply(500, { message: MESSAGES.failed });
  }

  if (result.duplicate) {
    return reply(200, { accepted: true, already: true });
  }

  const { error: statusError } = await store.markAccepted(offer.id);
  if (statusError) {
    // The acceptance is stored and therefore real. Only the offer's status
    // lagged, which the office panel shows and a human can correct.
    console.error(
      "Acceptance stored but offer status not updated, fix by hand:",
      offer.id,
      statusError.message || statusError
    );
  }

  return reply(200, {
    accepted: true,
    already: false,
    angerfristEndsAt: acceptance.angerfrist_ends_at,
  });
}
