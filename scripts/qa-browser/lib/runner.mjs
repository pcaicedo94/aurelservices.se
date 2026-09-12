// Test registry and runner: one shared browser, a clean slate per test,
// PASS/FAIL per line and a JSON report.
import fs from "node:fs";
import path from "node:path";

export function defineSuite(name, build) {
  return { name, build };
}

const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 70);

const withTimeout = (promise, ms, label) => {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label}: superó ${Math.round(ms / 1000)} s`)), ms);
    }),
  ]);
};

const fmtMs = (ms) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

export async function runSuites({ suites, browser, ctx, grep, defaultTimeout = 90000, log = console.log }) {
  const { page, api, logs } = browser;
  const results = [];
  const filter = grep ? grep.toLowerCase() : null;

  for (const suite of suites) {
    const tests = [];
    const register = (name, opts, fn) => {
      if (typeof opts === "function") [fn, opts] = [opts, {}];
      tests.push({ suite: suite.name, name, bug: opts.bug || null, timeout: opts.timeout || defaultTimeout, fn });
    };
    await suite.build(register, ctx);
    const selected = tests.filter((t) => !filter || `${t.suite} ${t.name} ${t.bug || ""}`.toLowerCase().includes(filter));
    if (!selected.length) continue;
    log(`\n=== ${suite.name} (${selected.length} pruebas) ===`);

    for (const test of selected) {
      const label = `[${test.suite}] ${test.name}`;
      api.reset();
      api.setContext(label);
      logs.setContext(label);
      page.dialogs = [];
      const failures = [];
      const notes = [];
      const expect = (cond, message) => {
        if (!cond) failures.push(message);
        return !!cond;
      };
      const note = (message) => notes.push(message);
      const started = Date.now();
      let status;
      try {
        await page.setViewport("desktop");
        await withTimeout(Promise.resolve().then(() => test.fn({ page, api, logs, expect, note, ctx })), test.timeout, "tiempo máximo");
        status = failures.length ? "FAIL" : "PASS";
      } catch (e) {
        status = "ERROR";
        failures.push(e.message);
      }
      const ms = Date.now() - started;
      let shot = null;
      if (status !== "PASS") {
        shot = await page.shot(`${String(results.length + 1).padStart(3, "0")}-${test.suite}-${slug(test.name)}`).catch(() => null);
      }
      const bug = test.bug ? ` {${test.bug}}` : "";
      const detail = status === "PASS" ? notes.join(" | ") : failures.join(" | ");
      const shortDetail = detail.length > 320 ? `${detail.slice(0, 317)}...` : detail;
      log(`${status.padEnd(5)} ${label}${bug}${shortDetail ? ` — ${shortDetail}` : ""} (${fmtMs(ms)})`);
      results.push({ suite: test.suite, name: test.name, bug: test.bug, status, ms, failures, notes, shot });
      await page.blank();
    }
  }
  return results;
}

export function summarize({ results, api, startedAt, log = console.log }) {
  const count = (s) => results.filter((r) => r.status === s).length;
  const byBug = new Map();
  for (const r of results) {
    if (r.status === "PASS" || !r.bug) continue;
    byBug.set(r.bug, (byBug.get(r.bug) || 0) + 1);
  }
  const unpaused = api.unpausedRequests();
  const escapedTotal = api.escaped.length + unpaused.length;
  const duration = Date.now() - startedAt;

  log("\n=== Resumen ===");
  log(`Pruebas: ${results.length} · PASS ${count("PASS")} · FAIL ${count("FAIL")} · ERROR ${count("ERROR")} · ${fmtMs(duration)}`);
  if (byBug.size) log(`No superadas por bug: ${[...byBug].map(([b, n]) => `${b}×${n}`).join(", ")}`);
  const bySuite = [...new Set(results.map((r) => r.suite))].map((s) => {
    const rs = results.filter((r) => r.suite === s);
    return `${s} ${rs.filter((r) => r.status === "PASS").length}/${rs.length}`;
  });
  log(`Por suite (PASS/total): ${bySuite.join(" · ")}`);
  log(`API: ${api.calls.length} peticiones a /api/* interceptadas y simuladas · peticiones reales: ${escapedTotal}`);
  if (escapedTotal) {
    log("FAIL  [seguridad] ninguna petición real a /api/* — revisa antes de volver a ejecutar:");
    for (const e of [...api.escaped, ...unpaused]) log(`      ${e.url} (${e.reason || "no pausada por Fetch"}) en ${e.context}`);
  } else {
    log("PASS  [seguridad] ninguna petición real a /api/*");
  }
  return { duration, escapedTotal, passed: count("PASS"), failed: count("FAIL"), errors: count("ERROR"), byBug: Object.fromEntries(byBug) };
}

export function writeReport({ outDir, meta, results, summary, api, logs }) {
  const file = path.join(outDir, "report.json");
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        ...meta,
        summary,
        results,
        api: {
          calls: api.calls.map(({ context, method, path: p, json, response, scenario }) => ({ context, method, path: p, scenario, response, body: json })),
          escaped: api.escaped,
          unpaused: api.unpausedRequests(),
          passedThroughNonGuarded: [...new Set(api.passedThrough)],
        },
        consoleEvents: logs.events.filter((e) => e.kind !== "console.warn"),
      },
      null,
      2
    )
  );
  return file;
}
