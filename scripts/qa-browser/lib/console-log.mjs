// Records console errors, uncaught exceptions and failed requests per page
// session, so a test can ask "what went wrong since this mark?".

// Noise that is not actionable in this repo: dev-only warnings emitted by
// third-party packages (no dependency updates are allowed).
export const DEFAULT_IGNORES = [
  { reason: "aviso de dependencia (react-tabs) solo en desarrollo", test: (e) => /defaultProps will be removed/.test(e.text) && /node_modules\//.test(e.text) },
  { reason: "sugerencia de React DevTools", test: (e) => /Download the React DevTools/.test(e.text) },
];

const argText = (a) => {
  if (a.value !== undefined) return typeof a.value === "object" ? JSON.stringify(a.value) : String(a.value);
  return a.description || a.unserializableValue || a.type;
};

export function createConsoleRecorder({ baseUrl, ignores = DEFAULT_IGNORES }) {
  const origin = new URL(baseUrl).origin;
  const events = [];
  const requests = new Map();
  let context = "";

  // Only another http(s) origin is third party: webpack-internal:, data:,
  // blob: and inline scripts are the site's own code.
  const sameOrigin = (url) => {
    try {
      const u = new URL(url);
      return !/^https?:$/.test(u.protocol) || u.origin === origin;
    } catch {
      return true;
    }
  };
  const push = (kind, text, extra = {}) => events.push({ context, kind, text: String(text).slice(0, 800), ...extra });

  return {
    attach(session) {
      session.on((msg) => {
        const p = msg.params || {};
        switch (msg.method) {
          case "Runtime.exceptionThrown": {
            const d = p.exceptionDetails;
            const url = d.url || d.stackTrace?.callFrames?.[0]?.url || "";
            push("exception", d.exception?.description || d.text, { url, thirdParty: !!url && !sameOrigin(url) });
            break;
          }
          case "Runtime.consoleAPICalled": {
            if (!["error", "assert", "warning"].includes(p.type)) break;
            const url = p.stackTrace?.callFrames?.[0]?.url || "";
            push(p.type === "warning" ? "console.warn" : "console.error", p.args.map(argText).join(" "), {
              url,
              thirdParty: !!url && !sameOrigin(url),
            });
            break;
          }
          case "Log.entryAdded": {
            const e = p.entry;
            if (e.level !== "error") break;
            push("log.error", `${e.text}${e.url ? ` <${e.url}>` : ""}`, { url: e.url || "", thirdParty: !!e.url && !sameOrigin(e.url), source: e.source });
            break;
          }
          case "Network.requestWillBeSent":
            requests.set(p.requestId, p.request.url);
            break;
          case "Network.responseReceived": {
            const r = p.response;
            if (r.status < 400) break;
            const mocked = Object.keys(r.headers || {}).some((h) => h.toLowerCase() === "x-qa-mock");
            push("http", `${r.status} ${r.url}`, { url: r.url, status: r.status, mocked, thirdParty: !sameOrigin(r.url) });
            break;
          }
          case "Network.loadingFailed": {
            const url = requests.get(p.requestId) || "";
            push("netfail", `${p.errorText}${p.canceled ? " (cancelada)" : ""} ${url}`, {
              url,
              canceled: !!p.canceled,
              blocked: p.blockedReason || null,
              thirdParty: !!url && !sameOrigin(url),
            });
            break;
          }
        }
      });
    },
    setContext(label) {
      context = label;
    },
    mark: () => events.length,
    since: (mark) => events.slice(mark),
    // Errors a smoke test should fail on: first-party, not a mocked API
    // answer, not a request cancelled by navigation, not an ignored warning.
    errorsSince(mark) {
      const relevant = [];
      const ignored = [];
      const thirdParty = [];
      for (const e of events.slice(mark)) {
        if (e.kind === "console.warn") continue;
        if (e.kind === "netfail" && e.canceled) continue;
        if (e.mocked) continue;
        // Mocked API answers (including simulated network failures) are the
        // test's own doing, and Log.entryAdded repeats them as text.
        if (["netfail", "log.error", "http"].includes(e.kind) && !e.thirdParty && /\/api\//.test(e.url || "")) continue;
        if (e.thirdParty) {
          thirdParty.push(e);
          continue;
        }
        const rule = ignores.find((r) => r.test(e));
        if (rule) ignored.push({ ...e, reason: rule.reason });
        else relevant.push(e);
      }
      return { relevant, ignored, thirdParty };
    },
    get events() {
      return events;
    },
  };
}
