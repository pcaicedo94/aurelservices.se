// Navigation chrome: menu links, footer social icon, the mobile FAQ chat and
// the desktop menu at a laptop width.
import { sleep } from "../lib/browser.mjs";
import { defineSuite } from "../lib/runner.mjs";

const CHAT_OPENER = ".faq-chat-button, button[aria-label*='chat' i]";

async function openAndCloseChat(page, { scrollY }) {
  await page.setViewport("mobile");
  await page.goto("/homecleaning");
  if (scrollY) {
    await page.eval((y) => {
      scrollTo({ top: y, behavior: "instant" });
      document.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("scroll"));
    }, scrollY);
    await sleep(600);
  }
  const opener = await page.eval((sel) => {
    const el = [...document.querySelectorAll(sel)].find(window.__qa.isVisible);
    return el ? window.__qa.rect(el) : null;
  }, CHAT_OPENER);
  if (!opener) throw new Error("no se encontró el botón visible del chat");
  // The opener is position:fixed, so click it where it is without scrolling.
  await page.mouseClick(opener.cx, opener.cy);
  await sleep(900);

  const state = await page.eval(() => {
    const win = [...document.querySelectorAll(".faq-chat-window, [role=dialog]")].find(window.__qa.isVisible);
    if (!win) return { open: false };
    const close = [...win.querySelectorAll("button")].find((b) => /stäng|close|✕|×/i.test(`${b.getAttribute("aria-label") || ""} ${b.textContent}`));
    if (!close) return { open: true, close: null };
    const r = window.__qa.rect(close);
    const hit = document.elementFromPoint(r.cx, r.cy);
    return {
      open: true,
      close: {
        rect: [r.left, r.top, r.width, r.height].map(Math.round),
        inViewport: r.width > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth,
        hitSelf: !!hit && (hit === close || close.contains(hit)),
        hitDesc: hit ? `${window.__qa.describe(hit)}${hit.closest("#navbar") ? " dentro de #navbar" : ""}` : null,
      },
    };
  });
  let closed = false;
  if (state.open && state.close) {
    const [x, y, w, h] = state.close.rect;
    await page.mouseClick(x + w / 2, y + h / 2);
    await sleep(700);
    closed = !(await page.eval(() => [...document.querySelectorAll(".faq-chat-window, [role=dialog]")].some(window.__qa.isVisible)));
  }
  return { state, closed };
}

function checkChat(expect, { state, closed }) {
  if (!expect(state.open, "el chat no se abrió")) return;
  if (!expect(state.close, "el chat no tiene botón de cerrar")) return;
  expect(state.close.inViewport, `botón de cerrar fuera de pantalla (${state.close.rect.join(",")})`);
  expect(state.close.hitSelf, `botón de cerrar tapado por ${state.close.hitDesc}`);
  expect(closed, "el chat sigue abierto tras pulsar cerrar");
}

export default defineSuite("nav", async (test, ctx) => {
  test('"Andra tjänster" no enlaza a "#"', { bug: "QA-17" }, async ({ page, expect, note }) => {
    await page.goto("/homecleaning");
    const info = await page.eval(() => {
      const el = [...document.querySelectorAll("#navbar a, #navbar button")].find((e) => /andra tjänster/i.test(window.__qa.norm(e.textContent)));
      if (!el) return null;
      return { tag: el.tagName.toLowerCase(), href: el.getAttribute("href"), resolved: el.href || null, here: location.href.split("#")[0] };
    });
    if (!expect(info, 'no se encontró "Andra tjänster" en el menú')) return;
    if (info.tag !== "a") return note(`es un <${info.tag}>, no un enlace`);
    const href = (info.href || "").trim();
    const selfHash = !!info.resolved && info.resolved.endsWith("#") && info.resolved.slice(0, -1) === info.here;
    if (!expect(href && href !== "#" && !selfHash, `href="${info.href}" (lleva a ${info.resolved})`)) return;
    const target = new URL(info.resolved);
    if (target.origin === new URL(ctx.baseUrl).origin) {
      const res = await fetch(target, { signal: AbortSignal.timeout(60000) });
      expect(res.status === 200, `${target.pathname} responde HTTP ${res.status}`);
    }
  });

  test("icono de Instagram visible en el footer", { bug: "QA-18" }, async ({ page, expect }) => {
    await page.goto("/contact");
    const r = await page.eval(() => {
      const a = document.querySelector("footer a[href*='instagram']");
      if (!a) return null;
      a.scrollIntoView({ block: "center", behavior: "instant" });
      const ar = a.getBoundingClientRect();
      const icons = [...a.querySelectorAll("svg, img, i, span")].map((el) => {
        const rr = el.getBoundingClientRect();
        return { desc: window.__qa.describe(el), w: Math.round(rr.width), h: Math.round(rr.height), before: getComputedStyle(el, "::before").content };
      });
      const glyph = icons.find((i) => i.w > 0 && i.h > 0 && (/^(svg|img)/.test(i.desc) || !["none", "normal", '""'].includes(i.before)));
      return { w: Math.round(ar.width), h: Math.round(ar.height), icons, glyph: glyph || null };
    });
    if (!expect(r, "no hay enlace a Instagram en el footer")) return;
    const icons = r.icons.map((i) => `${i.desc} ${i.w}×${i.h} before=${i.before}`).join(", ") || "sin icono";
    expect(r.w > 0 && r.h > 0, `el enlace mide ${r.w}×${r.h}px`);
    expect(r.glyph, `icono sin ancho o sin glifo: ${icons}`);
  });

  test("chat móvil sin scroll: se abre y se cierra (control)", async ({ page, expect }) => {
    checkChat(expect, await openAndCloseChat(page, { scrollY: 0 }));
  });

  test("chat móvil tras hacer scroll: botón de cerrar visible y clicable", { bug: "UX-04" }, async ({ page, expect }) => {
    checkChat(expect, await openAndCloseChat(page, { scrollY: 1500 }));
  });

  test("menú de escritorio a 1024 px sin romperse", async ({ page, expect, note }) => {
    await page.setViewport("laptop");
    await page.goto("/homecleaning");
    const r = await page.eval(() => {
      const toggler = document.querySelector(".navbar-toggler");
      const links = [...document.querySelectorAll("#navbar .navbar-nav > .nav-item > .nav-link")].filter(window.__qa.isVisible);
      const box = (document.querySelector("#navbar .container") || document.querySelector("#navbar")).getBoundingClientRect();
      const lineCount = (el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return new Set([...range.getClientRects()].filter((x) => x.width > 1).map((x) => Math.round(x.top))).size;
      };
      const tops = links.map((a) => Math.round(a.getBoundingClientRect().top));
      return {
        collapsed: !!toggler && window.__qa.isVisible(toggler),
        count: links.length,
        wrapped: links.filter((a) => lineCount(a) > 1).map((a) => window.__qa.norm(a.textContent)),
        rowSpread: tops.length ? Math.max(...tops) - Math.min(...tops) : 0,
        outside: links.filter((a) => a.getBoundingClientRect().right > box.right + 1).map((a) => window.__qa.norm(a.textContent)),
        overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    if (r.collapsed && r.count === 0) return note("usa el menú hamburguesa");
    expect(r.count > 0, "no hay enlaces visibles en el menú");
    expect(!r.wrapped.length, `textos partidos en dos líneas: ${r.wrapped.join(", ")}`);
    expect(r.rowSpread <= 6, `los enlaces no están en una sola fila (desnivel ${r.rowSpread}px)`);
    expect(!r.outside.length, `enlaces fuera del contenedor: ${r.outside.join(", ")}`);
    expect(!r.overflowX, "la página se desborda en horizontal");
  });
});
