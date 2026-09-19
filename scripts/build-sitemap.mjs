#!/usr/bin/env node
// Generates public/sitemap.xml from the files in pages/.
//
// The site is a static export, so there is no server able to build the sitemap
// on request: it has to be written to disk BEFORE `next build`, otherwise the
// exported output ships the previous (or no) sitemap.
//
//   node scripts/build-sitemap.mjs && npx next build
//
// What it does:
//   - walks pages/, skipping api/, _app, _document, 404 and anything starting
//     with "_" or "[" (there are no dynamic routes today, but if one appears it
//     cannot be expanded from the filesystem alone and must not be guessed);
//   - writes absolute URLs on the production domain (config/seo.js SITE_URL);
//   - applies the same trailing-slash rule as next.config.js, and aborts if
//     next.config.js and config/seo.js disagree about it;
//   - takes <lastmod> from the file's last git commit, and omits it when git is
//     unavailable rather than inventing a date;
//   - fails if a page has no entry in config/seo.js, so a new page cannot ship
//     without a title and a description.
//
// <changefreq> and <priority> are deliberately absent: Google ignores both.

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
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
const pagesDir = path.join(root, "pages");
const outFile = path.join(root, "public", "sitemap.xml");

const require = createRequire(import.meta.url);
const nextConfig = require(path.join(root, "next.config.js"));
const seo = await import(pathToUrl(path.join(root, "config", "seo.js")));

function pathToUrl(p) {
  return new URL(`file:///${p.replace(/\\/g, "/")}`).href;
}

const configTrailingSlash = Boolean(nextConfig.trailingSlash);
if (configTrailingSlash !== seo.TRAILING_SLASH) {
  console.error(
    `next.config.js trailingSlash=${configTrailingSlash} but config/seo.js TRAILING_SLASH=${seo.TRAILING_SLASH}. ` +
      "Canonical URLs and sitemap URLs would disagree; fix one of the two and run again."
  );
  process.exit(1);
}

const SKIP_FILES = new Set(["_app.js", "_document.js", "404.js"]);
const excluded = new Set(seo.SITEMAP_EXCLUDE || []);

function collectRoutes(dir, prefix = "") {
  const routes = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === "api" || entry.name.startsWith("_")) continue;
      routes.push(...collectRoutes(path.join(dir, entry.name), `${prefix}/${entry.name}`));
      continue;
    }
    if (!/\.(js|jsx|ts|tsx|mdx)$/.test(entry.name)) continue;
    if (SKIP_FILES.has(entry.name)) continue;
    if (entry.name.startsWith("_")) continue;
    const base = entry.name.replace(/\.(js|jsx|ts|tsx|mdx)$/, "");
    if (base.includes("[")) {
      console.warn(`aviso: ruta dinámica ${prefix}/${base} omitida; añádela a mano al sitemap.`);
      continue;
    }
    const route = base === "index" ? `${prefix}/` : `${prefix}/${base}`;
    routes.push({ route: route === "" ? "/" : route, file: path.join(dir, entry.name) });
  }
  return routes;
}

function lastModified(file) {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", file], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return out ? out.slice(0, 10) : null;
  } catch {
    return null;
  }
}

const entries = collectRoutes(pagesDir)
  .map(({ route, file }) => ({ route: route.replace(/\/+$/, "") || "/", file }))
  .filter(({ route }) => !excluded.has(route))
  .sort((a, b) => a.route.localeCompare(b.route));

const missing = entries.filter(({ route }) => !seo.PAGES[route]);
if (missing.length) {
  console.error(
    `Sin metadatos en config/seo.js: ${missing.map((e) => e.route).join(", ")}. ` +
      "Cada página necesita title y description antes de entrar en el sitemap."
  );
  process.exit(1);
}

const urls = entries
  .map(({ route, file }) => {
    const loc = seo.absoluteUrl(route, configTrailingSlash);
    const lastmod = lastModified(file);
    return [
      "  <url>",
      `    <loc>${escapeXml(loc)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n");
  })
  .join("\n");

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, xml, "utf8");
console.log(`sitemap.xml escrito con ${entries.length} URLs en ${path.relative(root, outFile)}`);
