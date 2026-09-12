// The quote popup (QuoteModal) works today on these ten pages and must keep
// working: it opens with the right service, closes with Escape and with a
// click outside, has no grey box around the form, and submits once.
import { sleep } from "../lib/browser.mjs";
import { defineSuite } from "../lib/runner.mjs";
import { fillContact, fillFields, readFeedback, submitContact, waitForApiCall } from "../lib/flows.mjs";

export const QUOTE_PAGES = [
  { route: "/carpetwashing", service: "mattvått" },
  { route: "/construction", service: "bygg" },
  { route: "/floorcare", service: "golvvård" },
  { route: "/gardening", service: "trädgård" },
  { route: "/movecleaningbusiness", service: "flyttstädning" },
  { route: "/movinghelp", service: "flytthjälp" },
  { route: "/snowremoval", service: "snöröjning" },
  { route: "/staircleaning", service: "trappstädning" },
  { route: "/windowcleaningbusiness", service: "fönsterputs" },
  { route: "/officecleaning", service: "kontorsstädning", button: "Boka tjänsten", prepare: [["#size", "120"], ["#frequency", "2"]] },
];

const DIALOG = ".quote-modal, [role=dialog][aria-modal=true]";

const modalOpen = (page) => page.eval((sel) => [...document.querySelectorAll(sel)].some(window.__qa.isVisible), DIALOG);

async function openModal(page, cfg) {
  const spec = { selector: "button, a", text: `^\\s*${cfg.button || "Begär offert"}\\s*$` };
  const btn = await page.resolve(spec);
  if (!btn.found) throw new Error(`no se encontró el botón "${cfg.button || "Begär offert"}"`);
  if (btn.disabled) throw new Error(`el botón "${cfg.button || "Begär offert"}" está desactivado`);
  await page.click(spec);
  return !!(await page.waitFor(() => [...document.querySelectorAll(".quote-modal, [role=dialog][aria-modal=true]")].some(window.__qa.isVisible), { timeout: 3000 }));
}

function modalInfo(page) {
  return page.eval((sel) => {
    const dlg = [...document.querySelectorAll(sel)].find(window.__qa.isVisible);
    if (!dlg) return null;
    const r = dlg.getBoundingClientRect();
    const dlgBg = window.__qa.toRgba(getComputedStyle(dlg).backgroundColor).join();
    // The old bug: page-level form styles painted a grey framed box inside the popup.
    const greyBoxes = [...dlg.querySelectorAll("form")].filter(window.__qa.isVisible).map((form) => {
      const cs = getComputedStyle(form);
      const bg = window.__qa.toRgba(cs.backgroundColor);
      const ownBg = bg[3] > 0.05 && bg.join() !== dlgBg;
      const border = ["Top", "Right", "Bottom", "Left"].some((s) => cs[`border${s}Style`] !== "none" && parseFloat(cs[`border${s}Width`]) > 0);
      const shadow = cs.boxShadow !== "none";
      return ownBg || border || shadow ? `${window.__qa.describe(form)} fondo=${cs.backgroundColor} borde=${cs.borderTopStyle} ${cs.borderTopWidth} sombra=${shadow}` : null;
    }).filter(Boolean);
    const title = dlg.querySelector("[id$='title'], h1, h2, h3, h4");
    const header = dlg.querySelector(".quote-modal-header") || title?.parentElement || dlg;
    const active = document.activeElement;
    return {
      title: title ? window.__qa.norm(title.innerText) : null,
      header: window.__qa.norm(header.innerText).slice(0, 160),
      text: window.__qa.norm(dlg.innerText).slice(0, 400),
      rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom },
      focusInside: !!active && dlg.contains(active),
      greyBoxes,
    };
  }, DIALOG);
}

export default defineSuite("quote", async (test) => {
  for (const cfg of QUOTE_PAGES) {
    test(`${cfg.route} popup abre con el servicio correcto y sin caja gris`, async ({ page, expect, note }) => {
      await page.goto(cfg.route);
      if (cfg.prepare) await fillFields(page, cfg.prepare);
      if (!expect(await openModal(page, cfg), "el popup no se abrió")) return;
      await sleep(250);
      const info = await modalInfo(page);
      expect(new RegExp(cfg.service, "i").test(info.header), `servicio mostrado: "${info.header}"`);
      expect(/begär offert|boka tjänsten/i.test(info.title || ""), `título: "${info.title}"`);
      expect(info.focusInside, "el foco no entra en el popup");
      expect(!info.greyBoxes.length, `caja dentro del popup: ${info.greyBoxes.join("; ")}`);
      if (cfg.prepare) expect(/\d[\d\s.,]*\s*kr/i.test(info.text), "el popup no incluye el precio calculado");
      note(`"${info.header}"`);
    });

    test(`${cfg.route} popup cierra con Escape y con clic fuera`, async ({ page, expect }) => {
      await page.goto(cfg.route);
      if (cfg.prepare) await fillFields(page, cfg.prepare);
      if (!expect(await openModal(page, cfg), "el popup no se abrió")) return;
      await sleep(250);
      await page.press("Escape");
      await sleep(350);
      const closedByEscape = !(await modalOpen(page));
      if (expect(closedByEscape, "Escape no cierra el popup")) {
        expect((await page.eval(() => getComputedStyle(document.body).overflow)) !== "hidden", "el scroll de la página sigue bloqueado tras cerrar");
      } else {
        // Close it another way so the click-outside check still runs.
        await page.click({ selector: "button", text: "^(×|✕|stäng)$", within: ".quote-modal, [role=dialog]" }).catch(() => {});
        await sleep(350);
      }

      if (!expect(await openModal(page, cfg), "el popup no se volvió a abrir")) return;
      await sleep(250);
      const point = await page.eval((sel) => {
        const dlg = [...document.querySelectorAll(sel)].find(window.__qa.isVisible);
        const r = dlg.getBoundingClientRect();
        const candidates = [
          [8, innerHeight / 2],
          [innerWidth - 8, innerHeight / 2],
          [innerWidth / 2, 8],
          [innerWidth / 2, innerHeight - 8],
        ];
        for (const [x, y] of candidates) {
          const hit = document.elementFromPoint(x, y);
          if (hit && !dlg.contains(hit) && (x < r.left || x > r.right || y < r.top || y > r.bottom)) return { x, y, hit: window.__qa.describe(hit) };
        }
        return null;
      }, DIALOG);
      if (!expect(point, "no hay zona libre fuera del popup donde hacer clic")) return;
      await page.mouseClick(point.x, point.y);
      await sleep(350);
      expect(!(await modalOpen(page)), `clic fuera (${point.hit}) no cierra el popup`);
    });
  }

  test("/carpetwashing popup: triple clic en enviar = 1 POST y confirmación (control)", async ({ page, api, expect }) => {
    await page.goto("/carpetwashing");
    if (!(await openModal(page, QUOTE_PAGES[0]))) throw new Error("el popup no se abrió");
    await fillContact(page);
    api.setScenario("slow");
    const mark = api.mark();
    await submitContact(page, { clicks: 3, gapMs: 150 });
    await sleep(3500);
    const n = api.callsSince(mark, "/api/contact").length;
    expect(n === 1, `${n} POST a /api/contact`);
    const done = await page.eval(() => window.__qa.norm(document.querySelector(".quote-modal, [role=dialog]")?.innerText || ""));
    expect(/tack/i.test(done), "no se muestra la confirmación dentro del popup");
  });

  test("/carpetwashing popup: error 500 muestra el aviso y conserva los datos (control)", async ({ page, api, expect }) => {
    await page.goto("/carpetwashing");
    if (!(await openModal(page, QUOTE_PAGES[0]))) throw new Error("el popup no se abrió");
    await fillContact(page);
    api.setScenario("server-error");
    const mark = api.mark();
    await submitContact(page);
    expect(await waitForApiCall(api, mark, "/api/contact"), "no hubo POST a /api/contact");
    await sleep(800);
    const fb = await readFeedback(page);
    expect(fb, "no se muestra ningún aviso de error");
    const name = await page.eval(() => document.querySelector("[data-qa-contact-form] [data-qa-field='name']")?.value ?? null);
    expect(name === "QA Testperson", `el nombre quedó como "${name}"`);
    expect(await modalOpen(page), "el popup se cerró tras el error");
  });
});
