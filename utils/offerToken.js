import crypto from "crypto";

// The secret half of the offer link. Split out of utils/offerRules.js because
// that module is imported by the offer PAGE, which also runs in the browser,
// and a module that pulls in node's crypto cannot be bundled for the browser.
// The split is not only a build fix: nothing here has any business reaching a
// customer's machine, and keeping it in its own server-only file makes an
// accidental client import fail loudly instead of shipping quietly.
//
// Selector + hashed verifier, not a single random id:
//   - the selector is indexed and looked up directly, so the lookup does not
//     have to scan or compare secrets;
//   - only the verifier's SHA-256 is stored, so a database dump does not hand
//     anyone a working link;
//   - the comparison is timing safe, so response times leak nothing.
const SELECTOR_BYTES = 8; // 16 hex characters
const VERIFIER_BYTES = 32; // 43 base64url characters

export function createOfferToken() {
  const selector = crypto.randomBytes(SELECTOR_BYTES).toString("hex");
  const verifier = crypto.randomBytes(VERIFIER_BYTES).toString("base64url");
  return { selector, verifier, verifierHash: hashVerifier(verifier) };
}

export function hashVerifier(verifier) {
  return crypto.createHash("sha256").update(String(verifier), "utf8").digest("hex");
}

// Returns false rather than throwing on malformed input, because this runs on
// whatever a stranger put in the URL.
export function verifyOfferToken(providedVerifier, storedHash) {
  if (typeof providedVerifier !== "string" || typeof storedHash !== "string") {
    return false;
  }
  const provided = Buffer.from(hashVerifier(providedVerifier), "utf8");
  const stored = Buffer.from(storedHash, "utf8");
  if (provided.length !== stored.length) return false;
  return crypto.timingSafeEqual(provided, stored);
}
