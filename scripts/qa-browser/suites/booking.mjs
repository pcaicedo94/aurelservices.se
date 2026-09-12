// Booking submit behaviour with a mocked /api/booking: duplicate submits,
// error answers that must keep the page and the data, and the contact form on
// mobile. /contact is included as the reference that already behaves.
import { sleep } from "../lib/browser.mjs";
import { defineSuite } from "../lib/runner.mjs";
import {
  CALCULATORS,
  CONTACT,
  fillContact,
  fillFields,
  findBookButton,
  readFeedback,
  submitContact,
  waitContactForm,
  waitForApiCall,
} from "../lib/flows.mjs";

const ERROR_LABELS = { "bad-request": "400", conflict: "409", "server-error": "500", offline: "red caída" };

async function openBookingForm(page, calc, dates) {
  await page.goto(calc.route);
  const fields = calc.valid(dates);
  await fillFields(page, fields);
  const book = await findBookButton(page);
  if (!book.found || book.disabled) throw new Error(`"Boka tjänsten" ${book.found ? "desactivado con datos válidos" : "no encontrado"}`);
  await page.click(book.spec);
  if (!(await waitContactForm(page))) throw new Error("no se abrió el formulario de contacto");
  await fillContact(page);
  return fields;
}

async function waitFeedback(page, timeout = 5000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const fb = await readFeedback(page).catch(() => null);
    if (fb) return fb;
    await sleep(200);
  }
  return null;
}

function readContactValues(page) {
  return page.eval(() => {
    const email = [...document.querySelectorAll("input[type=email]")].find((x) => !x.closest(".faq-chat-window"));
    const form = email && email.closest("form");
    if (!form) return null;
    const val = (k) => form.querySelector(`[data-qa-field="${k}"]`)?.value ?? null;
    return { name: val("name"), email: val("email"), phone: val("phone") };
  });
}

// Submits, dismisses whatever feedback appears, then checks that the page did
// not reload and that the visitor's data is still there.
async function submitAndCheckKept({ page, api, expect, note }, { calcFields = [], scenario, allowEmpty = [] }) {
  const marker = await page.eval(() => (window.__qaMarker = Math.random().toString(36).slice(2)));
  const navigations = page.navigations;
  const mark = api.mark();
  await submitContact(page);
  if (!(await waitForApiCall(api, mark, "/api/", 3000))) throw new Error("el envío no llegó a la API");

  const fb = await waitFeedback(page);
  if (expect(fb, "no se muestra ningún mensaje de error")) {
    note(`aviso: "${fb.text.slice(0, 90)}"`);
    expect(!/^bekräftelse$/i.test(fb.title || ""), `el error se presenta con el título "${fb.title}"`);
    if (fb.hasButton) await page.click("[data-qa-dismiss]").catch(() => {});
  }
  await sleep(2000);

  const alive = await page.eval((m) => window.__qaMarker === m, marker).catch(() => false);
  const reloaded = !alive || page.navigations > navigations;
  expect(!reloaded, `la página se recargó tras el error ${ERROR_LABELS[scenario] || scenario}`);
  if (reloaded) await page.waitFor(() => window.__qa && window.__qa.hydrated(), { timeout: 30000 });

  const values = await page.eval(
    (sels) => Object.fromEntries(sels.map((s) => [s, document.querySelector(s)?.value ?? null])),
    calcFields.map(([s]) => s)
  );
  for (const [sel, expected] of calcFields) {
    const got = values[sel];
    if (allowEmpty.includes(sel) && got === "") {
      note(`${sel} vaciado para elegir otra hora`);
      continue;
    }
    expect(got === expected, `${sel} = "${got}" (se esperaba "${expected}")`);
  }
  const contact = await readContactValues(page);
  if (expect(contact, "el formulario de contacto desapareció")) {
    expect(contact.name === CONTACT.name && contact.email === CONTACT.email, `datos de contacto perdidos (nombre "${contact.name}", e-post "${contact.email}")`);
  }
}

export default defineSuite("booking", async (test, ctx) => {
  const d = ctx.dates;

  for (const calc of Object.values(CALCULATORS)) {
    test(`${calc.route} triple clic en Skicka envía 1 POST`, { bug: "QA-01" }, async ({ page, api, expect }) => {
      await openBookingForm(page, calc, d);
      api.setScenario("slow");
      const mark = api.mark();
      await submitContact(page, { clicks: 3, gapMs: 150 });
      await sleep(3500);
      const n = api.callsSince(mark, "/api/booking").length;
      expect(n === 1, `${n} POST a /api/booking`);
    });
  }

  test("/homecleaning respuesta 200 muestra confirmación (control)", async ({ page, api, expect, note }) => {
    await openBookingForm(page, CALCULATORS.home, d);
    api.setScenario("ok");
    const mark = api.mark();
    await submitContact(page);
    expect(await waitForApiCall(api, mark, "/api/booking"), "no hubo POST a /api/booking");
    const fb = await waitFeedback(page);
    if (expect(fb, "no se mostró confirmación")) note(`"${fb.text.slice(0, 80)}"`);
  });

  for (const scenario of ["bad-request", "conflict", "server-error", "offline"]) {
    test(`/homecleaning error ${ERROR_LABELS[scenario]}: sin recarga y con los datos`, { bug: "QA-02" }, async (t) => {
      const calcFields = await openBookingForm(t.page, CALCULATORS.home, d);
      t.api.setScenario(scenario);
      await submitAndCheckKept(t, { calcFields, scenario, allowEmpty: scenario === "conflict" ? ["#dateTime"] : [] });
    });
  }

  for (const key of ["deep", "move", "window", "container"]) {
    const calc = CALCULATORS[key];
    test(`${calc.route} error 409: sin recarga y con los datos`, { bug: "QA-02" }, async (t) => {
      const calcFields = await openBookingForm(t.page, calc, d);
      t.api.setScenario("conflict");
      await submitAndCheckKept(t, { calcFields, scenario: "conflict", allowEmpty: ["#dateTime"] });
    });
  }

  for (const scenario of ["bad-request", "server-error", "offline"]) {
    test(`/contact error ${ERROR_LABELS[scenario]}: sin recarga y con los datos (control)`, async (t) => {
      await t.page.goto("/contact");
      await fillContact(t.page);
      t.api.setScenario(scenario);
      await submitAndCheckKept(t, { scenario });
    });
  }

  test('/contact triple clic en "Skicka meddelande" envía 1 POST', { bug: "QA-01" }, async ({ page, api, expect }) => {
    await page.goto("/contact");
    await fillContact(page);
    api.setScenario("slow");
    const mark = api.mark();
    await submitContact(page, { clicks: 3, gapMs: 150 });
    await sleep(3500);
    const n = api.callsSince(mark, "/api/contact").length;
    expect(n === 1, `${n} POST a /api/contact`);
  });

  for (const calc of Object.values(CALCULATORS)) {
    test(`${calc.route} en móvil el formulario queda visible y con foco`, { bug: "QA-15" }, async ({ page, expect, note }) => {
      await page.setViewport("mobile");
      await page.goto(calc.route);
      await fillFields(page, calc.valid(d));
      const book = await findBookButton(page);
      if (!book.found || book.disabled) throw new Error('"Boka tjänsten" no disponible con datos válidos');
      // A visitor taps the button as soon as it scrolls into view, near the
      // bottom of the screen (kept above the floating chat bubble).
      const tap = await page.eval((spec) => {
        const el = window.__qa.resolve(spec);
        el.scrollIntoView({ block: "end", behavior: "instant" });
        scrollBy({ top: 90, behavior: "instant" });
        const r = window.__qa.rect(el);
        const hit = document.elementFromPoint(r.cx, r.cy);
        return { x: r.cx, y: r.cy, hitSelf: !!hit && (hit === el || el.contains(hit)), hitDesc: hit ? window.__qa.describe(hit) : null };
      }, book.spec);
      if (!tap.hitSelf) throw new Error(`"Boka tjänsten" tapado por ${tap.hitDesc}`);
      await page.mouseClick(tap.x, tap.y);
      if (!(await waitContactForm(page, 3000))) throw new Error("no apareció el formulario de contacto");
      // Leave time for a smooth scroll to finish.
      await sleep(1200);
      const r = await page.eval(() => {
        const email = [...document.querySelectorAll("input[type=email]")].find((x) => window.__qa.isVisible(x) && !x.closest(".faq-chat-window"));
        const form = email.closest("form") || email.parentElement;
        const first = [...form.querySelectorAll("input, select, textarea")].find(window.__qa.isVisible);
        const fr = first.getBoundingClientRect();
        const hit = document.elementFromPoint(fr.left + fr.width / 2, fr.top + fr.height / 2);
        const active = document.activeElement;
        return {
          firstTop: Math.round(fr.top),
          innerHeight,
          inView: fr.top >= 0 && fr.bottom <= innerHeight,
          uncovered: !!hit && (hit === first || first.contains(hit)),
          hitDesc: hit ? window.__qa.describe(hit) : null,
          focusInForm: !!active && form.contains(active),
          active: active ? window.__qa.describe(active) : null,
        };
      });
      expect(r.inView, `primer campo fuera de pantalla (top ${r.firstTop}px, pantalla ${r.innerHeight}px)`);
      if (r.inView) expect(r.uncovered, `primer campo tapado por ${r.hitDesc}`);
      expect(r.focusInForm, `el foco no está en el formulario (está en ${r.active})`);
      note(`primer campo a ${r.firstTop}px`);
    });
  }
});
