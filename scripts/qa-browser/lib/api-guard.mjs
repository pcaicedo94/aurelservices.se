// SAFETY: every request whose path starts with /api/ on the site under test
// (or on any loopback host, or on the production domains) is paused by the
// Fetch domain and answered locally. Nothing is ever continued to the server.
// Requests that reach a real API anyway are counted as "escaped".

const PROD_HOST_RE = /(^|\.)aurelservices?\.se$/i;
const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
const MOCK_HEADER = "x-qa-mock";

const json = (status, message) => ({ status, body: { message } });

// A scenario maps an intercepted call to a response:
// { status, body, contentType } | { fail: "<Network.ErrorReason>" }, plus optional delayMs.
export const SCENARIOS = {
  ok: (call) =>
    json(200, call.path.startsWith("/api/contact") ? "Tack! Vi återkommer snart. (QA-mock)" : "Bokning skapad! (QA-mock)"),
  "bad-request": () => json(400, "Vänligen fyll i alla uppgifter korrekt."),
  conflict: () => json(409, "Tyvärr är den valda tiden inte tillgänglig. Vänligen välj en annan tid."),
  "server-error": () => json(500, "Något gick fel. Vänligen försök igen eller ring oss på 076-045 02 28."),
  "server-error-html": () => ({
    status: 500,
    contentType: "text/html; charset=utf-8",
    body: "<!DOCTYPE html><html><body><h1>500 Internal Server Error</h1></body></html>",
  }),
  offline: () => ({ fail: "ConnectionRefused" }),
  slow: (call) => ({ ...SCENARIOS.ok(call), delayMs: 2500 }),
};

export const DEFAULT_SCENARIO = "bad-request";

function decodePostData(request) {
  if (typeof request.postData === "string") return request.postData;
  if (Array.isArray(request.postDataEntries)) {
    return request.postDataEntries.map((e) => Buffer.from(e.bytes || "", "base64").toString("utf8")).join("");
  }
  return null;
}

export function createApiGuard({ baseUrl }) {
  const base = new URL(baseUrl);
  let scenario = DEFAULT_SCENARIO;
  let context = "";
  const calls = [];
  const escaped = [];
  const handledNetworkIds = new Set();
  const seen = new Map(); // Network requestId -> { url, context }
  const passedThrough = [];

  const isGuarded = (url) => {
    let u;
    try {
      u = new URL(url);
    } catch {
      return false;
    }
    if (!/^\/api(\/|$)/i.test(u.pathname)) return false;
    return u.host === base.host || LOOPBACK.has(u.hostname) || PROD_HOST_RE.test(u.hostname);
  };

  const recordEscape = (url, reason) => {
    escaped.push({ url, reason, context, at: new Date().toISOString() });
    console.error(`\n[api-guard] ALERTA: petición real a ${url} (${reason}) en "${context}"\n`);
  };

  const onPaused = (session, { requestId, request, networkId }) => {
    const noop = () => {};
    if (!isGuarded(request.url)) {
      passedThrough.push(request.url);
      session.send("Fetch.continueRequest", { requestId }).catch(noop);
      return;
    }
    if (networkId) handledNetworkIds.add(networkId);
    const postData = decodePostData(request);
    let body = null;
    try {
      body = postData ? JSON.parse(postData) : null;
    } catch {}
    const call = {
      context,
      url: request.url,
      path: new URL(request.url).pathname,
      method: request.method,
      postData,
      json: body,
      at: Date.now(),
      scenario: typeof scenario === "function" ? "custom" : scenario,
    };
    calls.push(call);

    const pick = typeof scenario === "function" ? scenario : SCENARIOS[scenario] || SCENARIOS[DEFAULT_SCENARIO];
    const res = pick(call);
    call.response = { status: res.status ?? null, fail: res.fail ?? null, delayMs: res.delayMs ?? 0 };

    const respond = () => {
      if (res.fail) {
        return session.send("Fetch.failRequest", { requestId, errorReason: res.fail });
      }
      const text = typeof res.body === "string" ? res.body : JSON.stringify(res.body ?? {});
      return session.send("Fetch.fulfillRequest", {
        requestId,
        responseCode: res.status,
        responseHeaders: [
          { name: "Content-Type", value: res.contentType || "application/json; charset=utf-8" },
          { name: "Cache-Control", value: "no-store" },
          { name: MOCK_HEADER, value: "1" },
        ],
        body: Buffer.from(text, "utf8").toString("base64"),
      });
    };
    // The page may navigate away while a slow answer is pending; that error is harmless.
    if (res.delayMs) setTimeout(() => respond().catch(noop), res.delayMs);
    else respond().catch(noop);
  };

  return {
    isGuarded,
    // Must be awaited before the session navigates anywhere.
    async attach(session) {
      session.on((msg) => {
        const p = msg.params || {};
        switch (msg.method) {
          case "Fetch.requestPaused":
            onPaused(session, p);
            break;
          case "Network.requestWillBeSent":
            if (isGuarded(p.request.url)) seen.set(p.requestId, { url: p.request.url, context });
            break;
          case "Network.responseReceived": {
            if (!isGuarded(p.response.url)) break;
            const headers = Object.keys(p.response.headers || {}).map((h) => h.toLowerCase());
            if (!headers.includes(MOCK_HEADER)) recordEscape(p.response.url, `respuesta ${p.response.status} sin cabecera ${MOCK_HEADER}`);
            break;
          }
        }
      });
      await session.send("Network.enable");
      await session.send("Fetch.enable", { patterns: [{ urlPattern: "*api/*", requestStage: "Request" }] });
    },
    setScenario(next) {
      scenario = next;
    },
    reset() {
      scenario = DEFAULT_SCENARIO;
    },
    setContext(label) {
      context = label;
    },
    mark: () => calls.length,
    callsSince: (mark, pathPrefix) => calls.slice(mark).filter((c) => !pathPrefix || c.path.startsWith(pathPrefix)),
    // Requests the Network domain saw but Fetch never paused. Only meaningful
    // once the page is idle, so it is checked at the end of the run.
    unpausedRequests: () =>
      [...seen.entries()].filter(([id]) => !handledNetworkIds.has(id)).map(([, v]) => v),
    get calls() {
      return calls;
    },
    get escaped() {
      return escaped;
    },
    get passedThrough() {
      return passedThrough;
    },
  };
}
