// Every page: HTTP 200, clean console and network, no horizontal scroll at
// four widths, internal links that resolve, and at least one visible H1.
import fs from "node:fs";
import path from "node:path";
import { sleep } from "../lib/browser.mjs";
import { defineSuite } from "../lib/runner.mjs";

const WIDTHS = [
  ["mobile", 390],
  ["tablet", 768],
  ["laptop", 1024],
  ["desktop", 1440],
];

export function discoverRoutes(pagesDir) {
  const routes = [];
  const walk = (dir, prefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name !== "api") walk(path.join(dir, entry.name), `${prefix}/${entry.name}`);
        continue;
      }
      const m = entry.name.match(/^(.+)\.(jsx?|tsx?)$/);
      if (!m || m[1].startsWith("_") || m[1].includes("[") || ["404", "500"].includes(m[1])) continue;
      routes.push(m[1] === "index" ? prefix || "/" : `${prefix}/${m[1]}`);
    }
  };
  walk(pagesDir, "");
  return routes.sort();
}

const statusCache = new Map();
async function httpStatus(baseUrl, pathname) {
  if (!statusCache.has(pathname)) {
    statusCache.set(
      pathname,
      fetch(new URL(pathname, baseUrl), { redirect: "manual", signal: AbortSignal.timeout(120000) })
        .then(async (res) => {
          await res.arrayBuffer();
          const loc = res.headers.get("location");
          if (res.status >= 300 && res.status < 400 && loc && new URL(loc, baseUrl).origin === new URL(baseUrl).origin) {
            return httpStatus(baseUrl, new URL(loc, baseUrl).pathname);
          }
          return res.status;
        })
        .catch((e) => `error (${e.message})`)
    );
  }
  return statusCache.get(pathname);
}

// Scrolls the whole page (AOS animations slide content in from the sides)
// and reports the largest horizontal scroll the document allows.
async function scanOverflow() {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const vw = document.documentElement.clientWidth;
  let maxScrollX = 0;
  let offenders = [];
  for (let i = 0, y = 0; i < 60; i++, y += Math.round(innerHeight * 0.9)) {
    scrollTo({ top: y, left: 0, behavior: "instant" });
    await wait(60);
    scrollTo({ top: scrollY, left: 99999, behavior: "instant" });
    const sx = scrollX;
    scrollTo({ top: scrollY, left: 0, behavior: "instant" });
    if (sx > maxScrollX) {
      maxScrollX = sx;
      const wide = [...document.body.querySelectorAll("*")].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > vw + 1 && getComputedStyle(el).position !== "fixed";
      });
      const set = new Set(wide);
      offenders = wide.filter((el) => !set.has(el.parentElement)).slice(0, 4).map(window.__qa.describe);
    }
    if (y + innerHeight >= document.documentElement.scrollHeight) break;
  }
  scrollTo({ top: 0, left: 0, behavior: "instant" });
  return { maxScrollX, offenders };
}

function collectPageFacts() {
  const links = [...document.querySelectorAll("a[href]")]
    .map((a) => a.href)
    .filter((h) => h.startsWith(location.origin))
    .map((h) => new URL(h).pathname);
  return {
    h1: [...document.querySelectorAll("h1")].filter(window.__qa.isVisible).map((h) => window.__qa.norm(h.innerText).slice(0, 60)),
    links: [...new Set(links)],
  };
}

const describeEvents = (events) => [...new Set(events.map((e) => `${e.kind}: ${e.text.split("\n")[0].replace(/http:\/\/[^/]+/g, "").slice(0, 140)}`))];

export default defineSuite("smoke", async (test, ctx) => {
  const routes = ctx.routes || discoverRoutes(path.join(ctx.repoRoot, "pages"));
  // Filled by the first load of each route so later tests skip a reload.
  const facts = new Map();
  const loadFacts = async (page, route) => {
    if (!facts.has(route)) {
      await page.goto(route);
      facts.set(route, { ...(await page.eval(collectPageFacts)), overflow1440: null });
    }
    return facts.get(route);
  };

  for (const route of routes) {
    test(`${route} responde HTTP 200`, async ({ expect }) => {
      const status = await httpStatus(ctx.baseUrl, route);
      expect(status === 200, `HTTP ${status}`);
    });

    test(`${route} sin errores de consola ni peticiones fallidas`, async ({ page, logs, expect, note }) => {
      const mark = logs.mark();
      await page.goto(route, { settle: 500 });
      const pageFacts = await page.eval(collectPageFacts);
      const overflow1440 = await page.eval(scanOverflow);
      facts.set(route, { ...pageFacts, overflow1440 });
      await sleep(700);
      const { relevant, ignored, thirdParty } = logs.errorsSince(mark);
      expect(!relevant.length, `${relevant.length} errores: ${describeEvents(relevant).slice(0, 4).join(" ; ")}`);
      if (ignored.length) note(`${ignored.length} avisos ignorados (${[...new Set(ignored.map((e) => e.reason))].join(", ")})`);
      if (thirdParty.length) note(`${thirdParty.length} errores de terceros no evaluados`);
    });

    test(`${route} sin desbordamiento horizontal a 390/768/1024/1440 px`, async ({ page, expect }) => {
      for (const [name, width] of WIDTHS) {
        let result = name === "desktop" ? facts.get(route)?.overflow1440 : null;
        if (!result) {
          await page.setViewport(name);
          await page.goto(route);
          result = await page.eval(scanOverflow);
        }
        expect(result.maxScrollX === 0, `${width}px: se desplaza ${result.maxScrollX}px en horizontal (${result.offenders.join(", ") || "sin culpable visible"})`);
      }
    });

    test(`${route} enlaces internos válidos`, async ({ page, expect, note }) => {
      const { links } = await loadFacts(page, route);
      const broken = [];
      for (const p of links) {
        const status = await httpStatus(ctx.baseUrl, p);
        if (status !== 200) broken.push(`${p} → ${status}`);
      }
      expect(!broken.length, `enlaces rotos: ${broken.join(", ")}`);
      note(`${links.length} destinos internos`);
    });

    test(`${route} tiene al menos un H1 visible`, { bug: "UX-12" }, async ({ page, expect }) => {
      const { h1 } = await loadFacts(page, route);
      expect(h1.length >= 1, "ningún H1 visible");
    });
  }

  test("una ruta inexistente responde 404 con la página de error", async ({ page, expect }) => {
    const route = "/qa-ruta-que-no-existe";
    const status = await httpStatus(ctx.baseUrl, route);
    expect(status === 404, `HTTP ${status}`);
    await page.goto(route);
    const text = await page.eval(() => window.__qa.norm(document.body.innerText));
    expect(/finns ej|inte tillgänglig|404/i.test(text), "no muestra un mensaje de página no encontrada");
  });
});
