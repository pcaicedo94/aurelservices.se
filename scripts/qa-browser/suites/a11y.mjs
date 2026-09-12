// Keyboard and colour checks: visible focus in the menu, submenus that open
// without a mouse, and WCAG AA contrast (4.5:1, or 3:1 for large text).
import { sleep } from "../lib/browser.mjs";
import { defineSuite } from "../lib/runner.mjs";
import { CALCULATORS, fillFields } from "../lib/flows.mjs";

async function prepareKeyboardPage(page, route = "/about-us") {
  await page.goto(route);
  await page.disableAnimations();
  await page.mouseMove(720, 880);
  await page.eval(() => {
    document.activeElement?.blur();
    scrollTo({ top: 0, behavior: "instant" });
  });
  await sleep(150);
}

function contrastFailures(items, where) {
  return items.filter((i) => i.measurable && !i.pass).map((i) => `${where} "${i.text}" ${i.ratio}:1 (${i.fg} sobre ${i.bg.join("/")}, mínimo ${i.required})`);
}

async function measure(page, route, scope, { prepare, exclude } = {}) {
  await page.goto(route);
  if (prepare) await prepare(page);
  return page.eval((s, ex) => window.__qa.contrast(s, { exclude: ex }), scope, exclude || "");
}

const SUBMENUS = ["Privata Tjänster", "Företag och BRF", "Andra tjänster"];

function submenuState(page, label) {
  return page.eval((lbl) => {
    const norm = window.__qa.norm;
    const li = [...document.querySelectorAll("#navbar .nav-item")].find(
      (x) => x.querySelector(".dropdown-menu, ul") && norm(x.firstElementChild?.textContent || "").toLowerCase() === lbl.toLowerCase()
    );
    if (!li) return { missing: true };
    const menu = li.querySelector(".dropdown-menu, ul");
    const a = document.activeElement;
    return {
      onParent: !!a && li.contains(a) && !menu.contains(a),
      inMenu: !!a && menu.contains(a),
      menuVisible: window.__qa.isVisible(menu) && [...menu.querySelectorAll("a")].some(window.__qa.isVisible),
      activeTag: a ? a.tagName.toLowerCase() : null,
      activeHref: a ? a.getAttribute("href") : null,
      path: location.pathname,
    };
  }, label);
}

export default defineSuite("a11y", async (test) => {
  test("foco visible al tabular por el menú", { bug: "UX-02" }, async ({ page, expect, note }) => {
    await prepareKeyboardPage(page);
    const items = await page.eval(() =>
      [...document.querySelectorAll("#navbar a, #navbar button")].filter(window.__qa.isVisible).map((el, i) => {
        el.setAttribute("data-qa-nav", String(i));
        const r = el.getBoundingClientRect();
        return {
          i,
          label: window.__qa.norm(el.textContent) || el.getAttribute("aria-label") || window.__qa.describe(el),
          clip: { x: Math.max(0, r.left - 6), y: Math.max(0, r.top + scrollY - 6), width: r.width + 12, height: r.height + 12 },
        };
      })
    );
    if (!items.length) throw new Error("no hay elementos visibles en #navbar");
    const baseline = [];
    for (const it of items) baseline.push(await page.screenshotData({ clip: it.clip }));
    if ((await page.screenshotData({ clip: items[0].clip })) !== baseline[0]) throw new Error("la zona del menú cambia sola; no se puede comparar el foco");

    const checked = new Map();
    for (let n = 0; n < 40 && checked.size < items.length; n++) {
      await page.press("Tab");
      await sleep(80);
      const active = await page.eval(() => ({ nav: document.activeElement?.getAttribute("data-qa-nav") ?? null, inNavbar: !!document.activeElement?.closest("#navbar"), fv: !!document.activeElement?.matches(":focus-visible") }));
      if (active.nav === null) {
        if (!active.inNavbar && checked.size) break;
        continue;
      }
      const it = items[Number(active.nav)];
      if (checked.has(it.i)) continue;
      const shot = await page.screenshotData({ clip: it.clip });
      checked.set(it.i, { label: it.label, changed: shot !== baseline[it.i], focusVisible: active.fv });
    }
    const invisible = [...checked.values()].filter((c) => !c.changed).map((c) => c.label);
    const unreachable = items.filter((it) => !checked.has(it.i)).map((it) => it.label);
    expect(!invisible.length, `sin indicador de foco visible: ${invisible.join(", ")}`);
    expect(!unreachable.length, `no se alcanzan con Tab: ${unreachable.join(", ")}`);
    note(`${checked.size} elementos del menú revisados`);
  });

  for (const label of SUBMENUS) {
    test(`submenú "${label}" se abre con el teclado`, async ({ page, expect, note }) => {
      await prepareKeyboardPage(page);
      let st = await submenuState(page, label);
      if (st.missing) throw new Error(`no se encontró el submenú "${label}"`);
      for (let n = 0; n < 30 && !st.onParent; n++) {
        await page.press("Tab");
        await sleep(60);
        st = await submenuState(page, label);
      }
      if (!expect(st.onParent, `"${label}" no recibe el foco con Tab`)) return;

      let how = null;
      if (st.menuVisible) how = "al recibir el foco";
      if (!how) {
        await page.press("ArrowDown");
        await sleep(150);
        st = await submenuState(page, label);
        if (st.menuVisible) how = "con flecha abajo";
      }
      const navigates = st.activeTag === "a" && st.activeHref && st.activeHref !== "#" && !st.activeHref.endsWith("#");
      if (!how && st.onParent && !navigates) {
        const path = st.path;
        await page.press("Enter");
        await sleep(250);
        st = await submenuState(page, label);
        if (st.menuVisible && st.path === path) how = "con Enter";
      }
      if (!how && st.onParent) {
        // A separate toggle button next to the parent link.
        await page.press("Tab");
        await sleep(80);
        st = await submenuState(page, label);
        if (st.inMenu && st.menuVisible) how = "al tabular dentro";
        else if (st.onParent && st.activeTag === "button") {
          await page.press("Enter");
          await sleep(250);
          st = await submenuState(page, label);
          if (st.menuVisible) how = "con el botón desplegable";
        }
      }
      if (!expect(how, "el submenú no se abre sin ratón")) return;
      if (!st.inMenu) {
        await page.press("Tab");
        await sleep(80);
        st = await submenuState(page, label);
      }
      expect(st.inMenu && st.menuVisible, "las opciones del submenú no se recorren con Tab");
      note(`se abre ${how}`);
    });
  }

  test("contraste de .default-btn ≥ 4,5:1", { bug: "UX-03" }, async ({ page, expect, note, ctx }) => {
    const failures = [];
    let measured = 0;
    const cases = [
      ["/carpetwashing", {}],
      ["/contact", {}],
      ["/homecleaning", { prepare: (p) => fillFields(p, CALCULATORS.home.valid(ctx.dates)) }],
    ];
    for (const [route, opts] of cases) {
      const items = await measure(page, route, ".default-btn", opts);
      measured += items.filter((i) => i.measurable).length;
      failures.push(...contrastFailures(items, route));
    }
    if (!measured) throw new Error("no se pudo medir ningún .default-btn activo");
    expect(!failures.length, [...new Set(failures)].join("; "));
    note(`${measured} textos medidos`);
  });

  test("contraste del footer ≥ 4,5:1 (3:1 texto grande)", async ({ page, expect, note }) => {
    const items = await measure(page, "/contact", "footer", { exclude: ".footer-bubbles" });
    const measurable = items.filter((i) => i.measurable);
    if (!measurable.length) throw new Error("no se pudo medir el texto del footer");
    const failures = contrastFailures(items, "footer");
    expect(!failures.length, `${failures.length}/${measurable.length} textos por debajo: ${[...new Set(failures)].slice(0, 5).join("; ")}`);
    note(`${measurable.length} textos medidos`);
  });

  test("contraste del aviso amarillo ≥ 4,5:1", async ({ page, expect, note }) => {
    const failures = [];
    let measured = 0;
    for (const route of ["/homecleaning", "/deepcleaning", "/movecleaning"]) {
      const items = await measure(page, route, ".brand-card-warning, .alert-warning");
      measured += items.filter((i) => i.measurable).length;
      failures.push(...contrastFailures(items, route));
    }
    if (!measured) throw new Error("no se encontró el aviso amarillo (.brand-card-warning / .alert-warning)");
    expect(!failures.length, [...new Set(failures)].slice(0, 4).join("; "));
    note(`${measured} textos medidos`);
  });
});
