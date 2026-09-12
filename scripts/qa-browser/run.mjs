// Browser QA suite for aurelservices.se. Usage:
//   node scripts/qa-browser/run.mjs --url=http://localhost:3100 --suite=all --out=<folder> [--port=9609]
// Every request to /api/* is answered by a local mock; see README.md.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openBrowser } from "./lib/browser.mjs";
import { DEFAULT_CHROME_PATH } from "./lib/chrome.mjs";
import { bookingDates } from "./lib/dates.mjs";
import { runSuites, summarize, writeReport } from "./lib/runner.mjs";
import smoke from "./suites/smoke.mjs";
import calculators from "./suites/calculators.mjs";
import booking from "./suites/booking.mjs";
import quote from "./suites/quote.mjs";
import a11y from "./suites/a11y.mjs";
import nav from "./suites/nav.mjs";

const SUITES = { smoke, calculators, booking, quote, a11y, nav };
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..");

const HELP = `Uso: node scripts/qa-browser/run.mjs [opciones]

  --url=<url>        servidor a probar (por defecto http://localhost:3100)
  --suite=<nombre>   all | ${Object.keys(SUITES).join(" | ")} (admite lista separada por comas)
  --out=<carpeta>    capturas, report.json y perfil de Chrome (fuera del repo)
  --port=<n>         puerto CDP de Chrome (por defecto 9609)
  --grep=<texto>     ejecuta solo las pruebas cuyo nombre o bug contenga el texto
  --routes=<a,b>     rutas para la suite smoke (por defecto, todas las de pages/)
  --chrome=<ruta>    ejecutable de Chrome
  --timeout=<ms>     tiempo máximo por prueba (por defecto 90000)
  --keep-profile     no borra el perfil de Chrome al terminar`;

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) throw new Error(`Argumento no reconocido: ${a}`);
    out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

// Git Bash rewrites a leading "/services" into "C:/Program Files/Git/services",
// so routes may be given without the slash.
function parseRoutes(value) {
  return value
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => {
      if (/^[a-z]:[\\/]/i.test(r)) {
        throw new Error(`Ruta "${r}" convertida por la shell: escribe --routes sin la barra inicial (services,contact) o usa MSYS_NO_PATHCONV=1`);
      }
      return r.startsWith("/") ? r : `/${r}`;
    });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return 0;
  }
  const baseUrl = String(args.url || "http://localhost:3100").replace(/\/$/, "");
  const port = Number(args.port || 9609);
  const names = String(args.suite || "all") === "all" ? Object.keys(SUITES) : String(args.suite).split(",").map((s) => s.trim());
  const unknown = names.filter((n) => !SUITES[n]);
  if (unknown.length) throw new Error(`Suite desconocida: ${unknown.join(", ")}\n\n${HELP}`);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.resolve(args.out ? String(args.out) : path.join(os.tmpdir(), "qa-browser", stamp));
  const rel = path.relative(REPO_ROOT, outDir);
  if (!rel.startsWith("..") && !path.isAbsolute(rel)) throw new Error(`--out no puede estar dentro del repo (${outDir})`);
  fs.mkdirSync(outDir, { recursive: true });

  try {
    const res = await fetch(baseUrl, { signal: AbortSignal.timeout(120000) });
    await res.arrayBuffer();
  } catch (e) {
    console.error(`No se puede conectar con ${baseUrl}: ${e.message}`);
    return 2;
  }

  const startedAt = Date.now();
  console.log(`QA de navegador · ${baseUrl} · suites: ${names.join(", ")} · salida: ${outDir}`);
  const browser = await openBrowser({ chromePath: args.chrome || DEFAULT_CHROME_PATH, port, outDir, baseUrl });

  const shutdown = async (code) => {
    await browser.close().catch(() => {});
    process.exit(code);
  };
  process.once("SIGINT", () => shutdown(130));
  process.once("SIGTERM", () => shutdown(143));

  try {
    const ctx = {
      baseUrl,
      repoRoot: REPO_ROOT,
      outDir,
      dates: bookingDates(),
      routes: args.routes ? parseRoutes(String(args.routes)) : null,
    };
    const results = await runSuites({
      suites: names.map((n) => SUITES[n]),
      browser,
      ctx,
      grep: args.grep ? String(args.grep) : null,
      defaultTimeout: Number(args.timeout || 90000),
    });
    // Late answers to slow mocks must still be accounted for.
    await new Promise((r) => setTimeout(r, 800));
    const summary = summarize({ results, api: browser.api, startedAt });
    const report = writeReport({
      outDir,
      meta: { baseUrl, suites: names, chrome: browser.chromeVersion, startedAt: new Date(startedAt).toISOString(), dates: ctx.dates },
      results,
      summary,
      api: browser.api,
      logs: browser.logs,
    });
    console.log(`Informe: ${report}`);
    console.log(`Capturas de fallos: ${path.join(outDir, "shots")}`);
    return summary.failed + summary.errors > 0 || summary.escapedTotal > 0 ? 1 : 0;
  } finally {
    await browser.close({ removeProfile: !args["keep-profile"] }).catch(() => {});
  }
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(`ERROR: ${e.stack || e.message}`);
    process.exit(2);
  }
);
