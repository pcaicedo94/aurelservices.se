// Safe test mode for the form endpoints (/api/booking and /api/contact).
//
//   APP_TEST_MODE=1 npx next dev -p 3105
//
// With APP_TEST_MODE=1 every side effect is simulated:
//   - mail is rendered by nodemailer's jsonTransport and never sent; only the
//     recipient and subject are logged;
//   - calendar inserts and deletes use fake ids and never reach Google, while
//     the availability check still reads the real calendar (read only);
//   - Supabase inserts are only recorded.
// Every response then carries `X-App-Test-Mode: 1` and a `test` object with
// what would have happened, so the QA scripts can assert on it.
//
// A scenario can be forced per request with the `x-test-scenario` header:
//   conflict        the requested slot is already taken            -> 409
//   race            the slot looks free, but a concurrent booking
//                   that was created first holds it on verification -> 409
//   calendar-error  the calendar API fails                         -> 500
//   mail-error      sending mail fails                             -> 500
// With any scenario the calendar is fully simulated, reads included.
//
// Without the variable none of this is reachable: the header is ignored,
// responses are unchanged and every call goes to the real services.

export const TEST_MODE_HEADER = "X-App-Test-Mode";
export const TEST_SCENARIOS = ["conflict", "race", "calendar-error", "mail-error"];

let productionWarningShown = false;

export function isTestMode(env = process.env) {
  if (env.APP_TEST_MODE !== "1") return false;
  // Left on by mistake in the live deployment it would silently swallow every
  // booking, so it is refused there.
  if (env.VERCEL_ENV === "production") {
    if (!productionWarningShown) {
      console.error("APP_TEST_MODE=1 is ignored in the production deployment.");
      productionWarningShown = true;
    }
    return false;
  }
  return true;
}

// Null outside test mode. In test mode it holds the forced scenario and
// collects every simulated side effect of the request.
export function startTestTrace(req, env = process.env) {
  if (!isTestMode(env)) return null;
  const requested = String(req?.headers?.["x-test-scenario"] || "")
    .trim()
    .toLowerCase();
  return {
    scenario: TEST_SCENARIOS.includes(requested) ? requested : null,
    mails: [],
    calendar: { reads: 0, inserted: [], deleted: [] },
    db: [],
  };
}

// Sends JSON; in test mode it also marks the response and attaches the trace.
export function respond(res, status, body, trace) {
  if (!trace) return res.status(status).json(body);
  res.setHeader(TEST_MODE_HEADER, "1");
  return res.status(status).json({ ...body, test: trace });
}

export function simulatedError(what) {
  const error = new Error(`Simulated ${what} failure (x-test-scenario)`);
  error.code = "TEST_SCENARIO";
  return error;
}
