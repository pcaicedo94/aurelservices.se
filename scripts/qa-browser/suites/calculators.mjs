// Edge cases of the five price calculators. Each test states the CORRECT
// behaviour: nothing bookable at 0 kr or below, no weekends or past dates,
// "Offereras" never booked as 0 kr. A booking counts as made only when a POST
// to /api/booking leaves the page (the API is mocked).
import { sleep } from "../lib/browser.mjs";
import { defineSuite } from "../lib/runner.mjs";
import { CALCULATORS, attemptBooking, fillFields, findBookButton, payloadPrice, readSummary, withFields } from "../lib/flows.mjs";

const priceLine = (s) => (s ? s.priceLine || "sin línea de precio" : "sin resumen");
const posted = (a) => a.posts.map((p) => `totalPrice=${JSON.stringify(p.json?.totalPrice)}`).join(", ");

function expectNotBookable(expect, attempt, what) {
  expect(!attempt.bookable, `${what} y aun así se envió la reserva (${posted(attempt)}; ${priceLine(attempt.summary)})`);
}

function expectNoNegative(expect, attempt) {
  expect(!attempt.summary?.negative, `muestra un precio negativo: ${priceLine(attempt.summary)}`);
  for (const p of attempt.posts) expect(!(payloadPrice(p.json) < 0), `envía un precio negativo (${p.json?.totalPrice})`);
}

function expectNoZeroPrice(expect, attempt) {
  const s = attempt.summary;
  expect(!(s && s.price === 0 && !s.quote && !attempt.bookDisabled), `muestra 0 kr con el botón de reservar activo (${priceLine(s)})`);
  for (const p of attempt.posts) expect(payloadPrice(p.json) !== 0, `envía la reserva con totalPrice=${JSON.stringify(p.json?.totalPrice)}`);
}

const STYLE_PROPS = ["backgroundColor", "backgroundImage", "color", "opacity", "filter", "boxShadow", "borderColor", "textDecorationLine"];

export default defineSuite("calculators", async (test, ctx) => {
  const d = ctx.dates;

  for (const [key, calc] of Object.entries(CALCULATORS)) {
    test(`${calc.route} caso válido se puede reservar (control)`, async ({ page, api, expect, note }) => {
      const a = await attemptBooking(page, api, { route: calc.route, fields: calc.valid(d) });
      expect(a.bookable && a.posts.length === 1, `se esperaba 1 POST y hubo ${a.posts.length} (${a.reason}; ${priceLine(a.summary)})`);
      expect(a.posts.every((p) => payloadPrice(p.json) > 0), `precio enviado no positivo: ${posted(a)}`);
      note(priceLine(a.summary));
    });

    test(`${calc.route} fecha pasada no se puede reservar`, { bug: "QA-13" }, async ({ page, api, expect }) => {
      const a = await attemptBooking(page, api, { route: calc.route, fields: withFields(calc.valid(d), [["#dateTime", d.past]]) });
      expectNotBookable(expect, a, `fecha ${d.past}`);
    });

    test(`${calc.route} domingo no se puede reservar`, { bug: "QA-13" }, async ({ page, api, expect }) => {
      const a = await attemptBooking(page, api, { route: calc.route, fields: withFields(calc.valid(d), [["#dateTime", d.sunday]]) });
      expectNotBookable(expect, a, `domingo ${d.sunday}`);
    });

    if (!calc.size) continue;
    const unit = key === "container" ? "bodar" : "m²";
    for (const value of ["0", "-10", "99999999"]) {
      test(`${calc.route} ${value} ${unit} no se puede reservar`, { bug: "QA-10" }, async ({ page, api, expect }) => {
        const a = await attemptBooking(page, api, { route: calc.route, fields: withFields(calc.valid(d), [[calc.size, value]]) });
        expectNotBookable(expect, a, `${value} ${unit}`);
        expectNoNegative(expect, a);
      });
    }
  }

  test("/homecleaning sábado no da 0 kr ni se puede reservar", { bug: "QA-03" }, async ({ page, api, expect }) => {
    const a = await attemptBooking(page, api, { route: "/homecleaning", fields: withFields(CALCULATORS.home.valid(d), [["#dateTime", d.saturday]]) });
    expectNoZeroPrice(expect, a);
    expectNotBookable(expect, a, `sábado ${d.saturday}`);
  });

  test("/deepcleaning väggtvätt negativo no da precio negativo", { bug: "QA-04" }, async ({ page, api, expect, note }) => {
    const a = await attemptBooking(page, api, { route: "/deepcleaning", fields: withFields(CALCULATORS.deep.valid(d), [["#vaggtvatt", "-20"]]) });
    expectNoNegative(expect, a);
    note(priceLine(a.summary));
  });

  test("/homecleaning vaciar m² o frecuencia no deja el precio anterior", { bug: "QA-05" }, async ({ page, expect }) => {
    await page.goto("/homecleaning");
    await fillFields(page, withFields(CALCULATORS.home.valid(d), [["#size", "100"]]));
    const full = await readSummary(page);
    if (!full || !(full.price > 0)) throw new Error(`el cálculo inicial no dio precio (${priceLine(full)})`);
    await fillFields(page, [["#size", ""]]);
    const noSize = await readSummary(page);
    expect(noSize.price !== full.price, `sin m² sigue mostrando ${noSize.priceLine}`);
    await fillFields(page, [["#size", "100"], ["#frequency", ""]]);
    const noFreq = await readSummary(page);
    expect(noFreq.price !== full.price, `sin frecuencia sigue mostrando ${noFreq.priceLine}`);
    const book = await findBookButton(page);
    expect(book.found && book.disabled, "el botón de reservar no queda desactivado con datos incompletos");
  });

  test("/movecleaning vaciar m² reinicia el precio (control)", async ({ page, expect }) => {
    await page.goto("/movecleaning");
    await fillFields(page, withFields(CALCULATORS.move.valid(d), [["#size", "100"]]));
    const full = await readSummary(page);
    if (!full || !(full.price > 0)) throw new Error(`el cálculo inicial no dio precio (${priceLine(full)})`);
    await fillFields(page, [["#size", ""]]);
    const empty = await readSummary(page);
    expect(empty.price !== full.price, `sin m² sigue mostrando ${empty.priceLine}`);
  });

  for (const units of ["51", "1000"]) {
    test(`/containercleaning ${units} bodar no da 0 kr`, { bug: "QA-11" }, async ({ page, api, expect, note }) => {
      const a = await attemptBooking(page, api, { route: "/containercleaning", fields: withFields(CALCULATORS.container.valid(d), [["#numberOfUnits", units]]) });
      expectNoZeroPrice(expect, a);
      note(priceLine(a.summary));
    });
  }

  test('/deepcleaning "Offereras" (200 m²) no se reserva a 0 kr', { bug: "QA-12" }, async ({ page, api, expect, note }) => {
    const a = await attemptBooking(page, api, { route: "/deepcleaning", fields: withFields(CALCULATORS.deep.valid(d), [["#size", "200"]]) });
    if (!a.summary?.quote) note(`el resumen no muestra "Offereras" (${priceLine(a.summary)})`);
    for (const p of a.posts) {
      expect(payloadPrice(p.json) !== 0 && Number(p.json?.basePrice) !== 0, `envía la reserva con totalPrice=${JSON.stringify(p.json?.totalPrice)} basePrice=${JSON.stringify(p.json?.basePrice)}`);
    }
  });

  test('/windowcleaning "Offereras" (5 rum) no se reserva a 0 kr', { bug: "QA-12" }, async ({ page, api, expect, note }) => {
    const a = await attemptBooking(page, api, { route: "/windowcleaning", fields: withFields(CALCULATORS.window.valid(d), [["#rooms", "5"]]) });
    for (const p of a.posts) expect(payloadPrice(p.json) !== 0, `envía la reserva con totalPrice=${JSON.stringify(p.json?.totalPrice)}`);
    note(`${a.reason}; ${priceLine(a.summary)}`);
  });

  test("/homecleaning botón Boka desactivado se distingue del activo", { bug: "QA-16" }, async ({ page, expect, note }) => {
    await page.goto("/homecleaning");
    await page.disableAnimations();
    await page.mouseMove(1, 1);
    const style = () =>
      page.eval((props) => {
        const el = [...document.querySelectorAll(".summary-frame button, .summary-frame a")].find((b) => /boka/i.test(b.textContent));
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { disabled: !!el.disabled, ...Object.fromEntries(props.map((p) => [p, cs[p]])) };
      }, STYLE_PROPS);
    const off = await style();
    if (!off) throw new Error('no se encontró "Boka tjänsten"');
    if (!off.disabled) throw new Error("el botón no empieza desactivado sin datos");
    await fillFields(page, CALCULATORS.home.valid(d));
    await sleep(200);
    const on = await style();
    if (on.disabled) throw new Error("el botón sigue desactivado con datos válidos");
    const changed = STYLE_PROPS.filter((p) => off[p] !== on[p]);
    expect(changed.length > 0, `mismo aspecto desactivado y activo (fondo ${on.backgroundColor}, opacidad ${on.opacity})`);
    if (changed.length) note(`cambia: ${changed.join(", ")}`);
  });
});
