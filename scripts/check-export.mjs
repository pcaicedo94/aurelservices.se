#!/usr/bin/env node
// Verifies the static export in out/ before it is uploaded to Simply.
//
//   NEXT_PUBLIC_STATIC_EXPORT=1 npx next build     # writes out/
//   node scripts/check-export.mjs                  # checks it
//
// scripts/deploy-simply.mjs runs this automatically and refuses to upload if it
// fails, but it is useful on its own after a manual export.
//
// What it checks:
//   1. every route in config/seo.js PAGES has its HTML file where Apache will
//      look for it (<route>/index.html, plus 404.html at the root), and no page
//      is missing or unexpected;
//   2. the files Apache and the crawlers need are at the root of the export:
//      .htaccess, robots.txt, sitemap.xml, favicon.ico;
//   3. every page carries a non-empty <title> matching config/seo.js and a
//      <link rel="canonical"> pointing at its own absolute URL in the exact
//      trailing-slash form the export uses;
//   4. no internal href/src points at something the export does not contain
//      (links to the old English routes are reported as warnings, because
//      public/.htaccess answers those with a 301);
//   5. every <loc> in sitemap.xml corresponds to an exported page;
//   6. out/ contains no api/ directory — the export drops pages/api/*, so the
//      booking and contact endpoints must be served by the host (PHP on Simply).
//
// Exit codes: 0 clean, 1 at least one error, 2 the export is not there.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// config/seo.js is ESM inside a package with no "type" field; Node detects it
// but warns. The warning is noise in a build step, so drop just that one.
process.removeAllListeners("warning");
process.on("warning", (warning) => {
  if (warning.code === "MODULE_TYPELESS_PACKAGE_JSON") return;
  console.warn(warning.stack || String(warning));
});

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) {
      console.error(`Argumento no reconocido: ${a}`);
      process.exit(2);
    }
    out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(`Uso: node scripts/check-export.mjs [--dir=out] [--quiet]

  --dir=<carpeta>  salida del export a revisar (por defecto out/)
  --quiet          solo imprime el resumen y los problemas`);
  process.exit(0);
}

const outDir = path.resolve(root, String(args.dir || "out"));
const quiet = Boolean(args.quiet);

const seo = await import(pathToUrl(path.join(root, "config", "seo.js")));

function pathToUrl(p) {
  return new URL(`file:///${p.replace(/\\/g, "/")}`).href;
}

const errors = [];
const warnings = [];
const notes = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);
const say = (msg) => {
  if (!quiet) console.log(msg);
};

if (!fs.existsSync(outDir) || !fs.statSync(outDir).isDirectory()) {
  console.error(
    `No existe ${path.relative(root, outDir) || outDir}. Genera el export antes:\n` +
      "  node scripts/deploy-simply.mjs --build-only"
  );
  process.exit(2);
}

// The layout is read off the export itself, not off next.config.js: this
// script has to tell the truth about the folder it was handed even when it runs
// in a shell where NEXT_PUBLIC_STATIC_EXPORT is not set (that variable is what
// drives `trailingSlash`, and with it the module-level default in config/seo.js).
// Every comparison below therefore passes `trailingSlash` explicitly.
const trailingSlash = fs.existsSync(path.join(outDir, "kontakt", "index.html"));
if (!trailingSlash) {
  fail(
    "el export no usa una carpeta por ruta (falta kontakt/index.html). " +
      "Reconstruye con NEXT_PUBLIC_STATIC_EXPORT=1: sin trailingSlash: true las páginas salen como " +
      "/kontakt.html y Apache necesitaría una regla mod_rewrite para servirlas sin la extensión."
  );
}

/* --------------------------- 1. the 26 HTML files -------------------------- */

const routes = Object.keys(seo.PAGES);

/** Where the export puts the HTML of a route, relative to out/. */
function htmlFor(route) {
  if (route === "/") return "index.html";
  const bare = route.replace(/^\/+|\/+$/g, "");
  return trailingSlash ? `${bare}/index.html` : `${bare}.html`;
}

const expected = new Map(); // relative html path -> route
for (const route of routes) expected.set(htmlFor(route), route);
// Next always writes the 404 at the root as well, which is the file Apache's
// ErrorDocument points at.
expected.set("404.html", "/404");

const found = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_next") continue;
      walk(full);
      continue;
    }
    if (entry.name.endsWith(".html")) {
      found.push(path.relative(outDir, full).split(path.sep).join("/"));
    }
  }
})(outDir);

for (const [rel, route] of expected) {
  if (!found.includes(rel)) fail(`falta la página de ${route}: ${rel}`);
}
const unexpected = found.filter((f) => !expected.has(f));
for (const f of unexpected) warn(`HTML no esperado en el export: ${f}`);

say(`Páginas HTML: ${found.length} encontradas, ${expected.size} esperadas (${routes.length} rutas + 404.html).`);

/* ------------------------ 2. files Apache needs --------------------------- */

for (const name of [".htaccess", "robots.txt", "sitemap.xml", "favicon.ico"]) {
  const full = path.join(outDir, name);
  if (!fs.existsSync(full)) {
    fail(
      `falta ${name} en la raíz del export` +
        (name === ".htaccess"
          ? ". Next copia public/ tal cual; sin este archivo Apache no aplica las 301."
          : "")
    );
  } else if (fs.statSync(full).size === 0) {
    fail(`${name} está vacío`);
  }
}

if (fs.existsSync(path.join(outDir, "api"))) {
  fail("el export contiene una carpeta api/: el sitio estático no puede servir rutas de API.");
} else {
  notes.push(
    "out/ no contiene api/ (lo esperado): /api/booking y /api/contact no existen en el sitio estático " +
      "y tienen que servirse desde el host (PHP en Simply)."
  );
}

/* --------------------- 3. title + canonical per page ---------------------- */

const pages = new Map(); // relative html path -> { route, html }
for (const [rel, route] of expected) {
  const full = path.join(outDir, rel);
  if (!fs.existsSync(full)) continue;
  pages.set(rel, { route, html: fs.readFileSync(full, "utf8") });
}

function firstMatch(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

let seoOk = 0;
for (const [rel, { route, html }] of pages) {
  // 404.html and 404/index.html are the same page; check it once as /404.
  const meta = seo.PAGES[route] || {};

  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!title || !title.trim()) {
    fail(`${rel}: sin <title>`);
  } else if (meta.title && decodeEntities(title) !== meta.title) {
    fail(`${rel}: <title> "${decodeEntities(title)}" no es el de config/seo.js "${meta.title}"`);
  }

  const canonical = firstMatch(
    html,
    /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i
  ) || firstMatch(html, /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  const wanted = seo.absoluteUrl(route, trailingSlash);
  if (!canonical) {
    fail(`${rel}: sin <link rel="canonical">`);
  } else if (canonical !== wanted) {
    fail(`${rel}: canonical "${canonical}" debería ser "${wanted}"`);
  }

  const description = firstMatch(html, /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i);
  if (meta.description && (!description || !description.trim())) {
    fail(`${rel}: sin meta description`);
  }

  if (meta.noindex && !/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
    fail(`${rel}: config/seo.js la marca noindex pero el HTML no lo dice`);
  }

  if (title && canonical === wanted) seoOk += 1;
}
say(`Title + canonical correctos en ${seoOk}/${pages.size} páginas.`);

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&#x2F;/g, "/")
    .trim();
}

/* ----------------------------- 4. dead links ------------------------------ */

// Old English routes answered by public/.htaccess with a 301. A link to one of
// them is not a 404, but it costs a redirect hop, so it is a warning.
const redirectSources = readRedirectSources();

function readRedirectSources() {
  const file = path.join(root, "public", ".htaccess");
  if (!fs.existsSync(file)) return new Set();
  const set = new Set();
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*RedirectMatch\s+\d{3}\s+\^(\S+?)\/\?\$/);
    if (m) set.add(m[1].replace(/\\/g, ""));
  }
  return set;
}

/** Does the export answer this site-absolute path with a file? */
function resolves(urlPath) {
  const clean = urlPath.replace(/[?#].*$/, "");
  const rel = clean.replace(/^\/+/, "");
  if (clean.endsWith("/")) return fs.existsSync(path.join(outDir, rel, "index.html"));
  const asFile = path.join(outDir, rel);
  if (fs.existsSync(asFile) && fs.statSync(asFile).isFile()) return true;
  if (/\.[a-z0-9]{2,5}$/i.test(clean)) return false;
  // Extension-less: Apache serves the directory index, with or without the slash.
  return (
    fs.existsSync(path.join(outDir, rel, "index.html")) || fs.existsSync(`${asFile}.html`)
  );
}

const linkRe = /\s(?:href|src)=["']([^"']+)["']/gi;
let linksChecked = 0;
const broken = new Map(); // target -> pages linking to it

for (const [rel, { html }] of pages) {
  for (const match of html.matchAll(linkRe)) {
    const target = match[1].trim();
    if (!target) continue;
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target)) continue; // http:, mailto:, tel:, data:, //cdn
    if (target.startsWith("#")) continue;
    // Relative paths resolved against the page's own directory.
    const base = rel === "index.html" ? "/" : `/${path.posix.dirname(rel)}/`;
    const abs = target.startsWith("/") ? target : path.posix.normalize(base + target);
    linksChecked += 1;
    if (resolves(abs)) continue;
    const key = abs.replace(/[?#].*$/, "");
    if (!broken.has(key)) broken.set(key, new Set());
    broken.get(key).add(rel);
  }
}

for (const [target, from] of broken) {
  const where = [...from].slice(0, 4).join(", ") + (from.size > 4 ? ` y ${from.size - 4} más` : "");
  const bare = target.replace(/\/+$/, "");
  if (redirectSources.has(bare) || redirectSources.has(target)) {
    warn(`enlace a la ruta antigua ${target} (301 en .htaccess, pero cuesta un salto) en ${where}`);
  } else {
    fail(`enlace roto ${target} en ${where}`);
  }
}
say(`Enlaces internos revisados: ${linksChecked}, destinos rotos: ${[...broken.keys()].length}.`);

/* ----------------------------- 5. sitemap -------------------------------- */

const sitemapFile = path.join(outDir, "sitemap.xml");
if (fs.existsSync(sitemapFile)) {
  const xml = fs.readFileSync(sitemapFile, "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!locs.length) fail("sitemap.xml no tiene ninguna <loc>");
  for (const loc of locs) {
    if (!loc.startsWith(seo.SITE_URL)) {
      fail(`sitemap.xml: ${loc} no está en ${seo.SITE_URL}`);
      continue;
    }
    const urlPath = loc.slice(seo.SITE_URL.length) || "/";
    if (!resolves(urlPath)) fail(`sitemap.xml apunta a ${loc}, que el export no contiene`);
    const wantedSlash = trailingSlash ? urlPath === "/" || urlPath.endsWith("/") : !urlPath.endsWith("/");
    if (!wantedSlash) {
      fail(
        `sitemap.xml: ${loc} no usa la forma con trailingSlash=${trailingSlash}; ` +
          "regenera public/sitemap.xml con la misma variable de entorno que el build."
      );
    }
  }
  const expectedLocs = routes.filter((r) => !(seo.SITEMAP_EXCLUDE || []).includes(r)).length;
  if (locs.length !== expectedLocs) {
    fail(`sitemap.xml tiene ${locs.length} URLs y config/seo.js describe ${expectedLocs} indexables`);
  }
  say(`sitemap.xml: ${locs.length} URLs, todas resueltas en el export.`);
}

/* ------------------------------- summary --------------------------------- */

for (const n of notes) say(`nota: ${n}`);
for (const w of warnings) console.warn(`aviso: ${w}`);
for (const e of errors) console.error(`ERROR: ${e}`);

const label = path.relative(root, outDir) || outDir;
if (errors.length) {
  console.error(`\n${label}: ${errors.length} error(es), ${warnings.length} aviso(s). No subir.`);
  process.exit(1);
}
console.log(`\n${label}: OK — ${pages.size} páginas, ${linksChecked} enlaces, ${warnings.length} aviso(s).`);
