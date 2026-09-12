import { HONEYPOT_FIELD, STARTED_AT_FIELD } from "./formGuard.js";

// Anti-spam checks shared by /api/booking and /api/contact. Plain functions,
// so the PHP port can mirror them.
//
// Contract with the forms (see utils/formGuard.js):
//   company_website  honeypot. Any content means a bot: answer 200 as if all
//                    went well, and send or store nothing.
//   formStartedAt    browser Date.now() when the form was shown. Submitting
//                    less than 3 s later gets a generic 400. Forms that do not
//                    send it yet are let through.
// Plus a per-IP limit and, only when both of its keys exist, Cloudflare
// Turnstile.

export { HONEYPOT_FIELD, STARTED_AT_FIELD };
export const TURNSTILE_FIELD = "cf-turnstile-response";
// Form plumbing: never shown to the office or stored with a booking.
export const ANTI_SPAM_FIELDS = [HONEYPOT_FIELD, STARTED_AT_FIELD, TURNSTILE_FIELD];

export const MIN_FILL_MS = 3000;
export const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

export const GENERIC_REJECTION_MESSAGE = "Vänligen kontrollera uppgifterna och försök igen.";
export const RATE_LIMIT_MESSAGE =
  "Du har skickat för många förfrågningar. Vänta en stund och försök igen, eller ring oss på 076-045 02 28.";

export function isHoneypotFilled(body) {
  const value = body?.[HONEYPOT_FIELD];
  if (value === undefined || value === null) return false;
  return String(value).trim() !== "";
}

// "ok", "too-fast" or "invalid". A missing timestamp is "ok" so that forms not
// sending one yet keep working; a present but unusable one is "invalid".
export function checkFillTime(body, now = Date.now()) {
  const raw = body?.[STARTED_AT_FIELD];
  if (raw === undefined || raw === null || raw === "") return "ok";

  const startedAt = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(startedAt) || startedAt <= 0) return "invalid";

  // The timestamp comes from the visitor's clock. A clock ahead of the server
  // gives a negative value, which says nothing about bots, so it passes.
  const elapsed = now - startedAt;
  return elapsed >= 0 && elapsed < MIN_FILL_MS ? "too-fast" : "ok";
}

// Sliding window counter kept in memory, one per endpoint.
// On serverless hosting (Vercel) each instance has its own memory, so the
// limit applies per instance and resets on a cold start: it slows a burst
// down, it is not a hard guarantee. The PHP version on Simply will keep these
// counters in the database.
export function createRateLimiter({
  limit = RATE_LIMIT.limit,
  windowMs = RATE_LIMIT.windowMs,
  maxKeys = 5000,
} = {}) {
  const hits = new Map(); // key -> timestamps in ms, oldest first

  return {
    hit(key, now = Date.now()) {
      const recent = (hits.get(key) || []).filter((time) => time > now - windowMs);

      if (recent.length >= limit) {
        hits.set(key, recent);
        const retryAfterSeconds = Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
        return { allowed: false, retryAfterSeconds };
      }

      recent.push(now);
      // Re-inserting keeps the Map ordered by last use, so the oldest key is
      // the one dropped when the map grows too large.
      hits.delete(key);
      hits.set(key, recent);
      if (hits.size > maxKeys) hits.delete(hits.keys().next().value);

      return { allowed: true, remaining: limit - recent.length };
    },
  };
}

// Vercel's proxy sets x-real-ip / x-forwarded-for itself. Anywhere else those
// headers come straight from the client, so only the socket address counts.
export function clientIp(req, env = process.env) {
  if (env.VERCEL) {
    const realIp = String(req.headers?.["x-real-ip"] || "").trim();
    const forwarded = String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
    if (realIp || forwarded) return realIp || forwarded;
  }
  return req.socket?.remoteAddress || "unknown";
}

// In test mode the QA scripts name their own client, so each test gets its own
// budget; the header is ignored otherwise.
export function rateLimitKey(req, { testMode = false, env = process.env } = {}) {
  const testClient = testMode ? String(req.headers?.["x-test-client-id"] || "").trim() : "";
  return testClient ? `test:${testClient.slice(0, 100)}` : clientIp(req, env);
}

// Optional: enforced only when both keys are configured (neither is today).
// The forms must render the Turnstile widget before the keys are added, or
// every submission will be refused.
export function turnstileEnabled(env = process.env) {
  return Boolean(env.TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export async function verifyTurnstile(token, ip, { secret, fetchImpl = fetch } = {}) {
  if (!token || !secret) return false;
  try {
    const params = new URLSearchParams({ secret, response: String(token) });
    if (ip) params.set("remoteip", ip);
    const response = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error("Turnstile verification failed:", error?.message);
    return false;
  }
}

// The checks that run before validation. Resolves to null when the request may
// continue, or to { status, reason } to answer with: 200 for the honeypot (the
// caller replies with its normal success message), 400 otherwise.
export async function screenSubmission(req, body, { testMode = false, now = Date.now(), env = process.env } = {}) {
  if (isHoneypotFilled(body)) return { status: 200, reason: "honeypot" };

  const fill = checkFillTime(body, now);
  if (fill !== "ok") return { status: 400, reason: fill };

  // Test mode never calls Cloudflare: the QA scripts have no widget token.
  if (turnstileEnabled(env) && !testMode) {
    const verified = await verifyTurnstile(body?.[TURNSTILE_FIELD], clientIp(req, env), {
      secret: env.TURNSTILE_SECRET_KEY,
    });
    if (!verified) return { status: 400, reason: "turnstile" };
  }

  return null;
}

const MAX_GREETING_NAME = 40;

// A confirmation goes to whatever address was typed in, so it must not carry a
// stranger's text. The name is the one thing it still repeats, and only when
// it is short and looks nothing like a link or an address.
export function greetingName(name) {
  const value = String(name || "").trim();
  if (!value || value.length > MAX_GREETING_NAME) return "";
  if (/https?:|www\.|:\/\/|@|\.(com|se|nu|net|org|info|io|biz|ru|xyz)\b/i.test(value)) return "";
  return value;
}
