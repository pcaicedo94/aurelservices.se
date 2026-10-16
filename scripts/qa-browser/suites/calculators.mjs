// Edge cases of the five price calculators. Each test states the CORRECT
// behaviour: nothing bookable at 0 kr or below, no weekends or past dates,
// "Offereras" never booked as 0 kr. A booking counts as made only when a POST
// to /api/booking leaves the page (the API is mocked).
import { sleep } from "../lib/browser.mjs";
import { defineSuite } from "../lib/runner.mjs";
import {
  CALCULATORS,
  DAY_FIELD,
  TIME_FIELD,
  attemptBooking,
  dateTimeFields,
  fillFields,
  findBookButton,
  payloadPrice,
  readStartTimes,
  readSummary,
  withFields,
} from "../lib/flows.mjs";

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

// Client Q16: a booking starts on the hour, from 07:00 to 15:00 included. The
// field used to take any time typed by hand and complain afterwards, so these
// are the values that must not even be on offer any more.
const START_HOURS = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
const NOT_OFFERED = ["06:00", "06:30", "07:30", "09:47", "14:30", "15:30", "16:00", "23:00"];

export default defineSuite("calculators", async (test, ctx) => {
  const d = ctx.dates;

  for (const [key, calc] of Object.entries(CALCULATORS)) {
    if (calc.quoteOnly) {
      test(`${calc.route} da precio estimado y pide oferta, sin reservar`, async ({ page, api, expect, note }) => {
        const a = await attemptBooking(page, api, { route: calc.route, fields: calc.valid(d) });
        expect(!a.bookable && a.posts.length === 0, `no debe reservar (${a.reason}; ${posted(a)})`);
        expect(!a.summary?.quote && a.summary?.price > 0, `falta el precio estimado: ${priceLine(a.summary)}`);
        note(priceLine(a.summary));
      });
      continue;
    }

    test(`${calc.route} caso válido se puede reservar (control)`, async ({ page, api, expect, note }) => {
      const a = await attemptBooking(page, api, { route: calc.route, fields: calc.valid(d) });
      expect(a.bookable && a.posts.length === 1, `se esperaba 1 POST y hubo ${a.posts.length} (${a.reason}; ${priceLine(a.summary)})`);
      expect(a.posts.every((p) => payloadPrice(p.json) > 0), `precio enviado no positivo: ${posted(a)}`);
      note(priceLine(a.summary));
    });

    test(`${calc.route} fecha pasada no se puede reservar`, { bug: "QA-13" }, async ({ page, api, expect }) => {
      const a = await attemptBooking(page, api, { route: calc.route, fields: withFields(calc.valid(d), dateTimeFields(d.past)) });
      expectNotBookable(expect, a, `fecha ${d.past}`);
    });

    test(`${calc.route} domingo no se puede reservar`, { bug: "QA-13" }, async ({ page, api, expect }) => {
      const a = await attemptBooking(page, api, { route: calc.route, fields: withFields(calc.valid(d), dateTimeFields(d.sunday)) });
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

  // Replaces what used to be checked by typing an impossible time by hand: the
  // interface no longer lets it be typed, so the check is that it is not
  // offered either.
  test("la hora solo se elige en punto entre 07:00 y 15:00", { bug: "QA-19" }, async ({ page, expect, note }) => {
    const wrong = [];
    for (const calc of Object.values(CALCULATORS)) {
      await page.goto(calc.route);
      const select = await readStartTimes(page);
      if (!select) throw new Error(`${calc.route}: no se encontró el selector de hora (${TIME_FIELD})`);
      if (select.options.join(" ") !== START_HOURS.join(" ")) wrong.push(`${calc.route} ofrece ${select.options.join(", ") || "nada"}`);
      const offered = NOT_OFFERED.filter((t) => select.options.includes(t));
      if (offered.length) wrong.push(`${calc.route} sigue ofreciendo ${offered.join(", ")}`);
    }
    expect(!wrong.length, wrong.join("; "));
    note(`${START_HOURS.length} horas de ${START_HOURS[0]} a ${START_HOURS[START_HOURS.length - 1]} en ${Object.keys(CALCULATORS).length} calculadoras`);
  });

  test("el campo de fecha no ofrece días antes de la antelación mínima", { bug: "QA-19" }, async ({ page, expect, note }) => {
    const wrong = [];
    for (const calc of Object.values(CALCULATORS)) {
      await page.goto(calc.route);
      const min = await page.eval((sel) => document.querySelector(sel)?.getAttribute("min") ?? null, DAY_FIELD);
      if (min !== d.earliestDay) wrong.push(`${calc.route} min="${min}"`);
    }
    expect(!wrong.length, `se esperaba min="${d.earliestDay}": ${wrong.join("; ")}`);
    note(`min="${d.earliestDay}"`);
  });

  test("con un sábado elegido la hora queda bloqueada y el aviso enlaza a /kontakt", { bug: "QA-03" }, async ({ page, expect, note }) => {
    await page.goto("/tjanster/hemstadning");
    await fillFields(page, CALCULATORS.home.valid(d));
    const weekdayState = await readStartTimes(page);
    if (weekdayState.disabled) throw new Error("la hora ya está bloqueada con un día laborable");
    await fillFields(page, [[DAY_FIELD, d.saturday.slice(0, 10)]]);
    const state = await readStartTimes(page);
    expect(state.disabled, "con un sábado elegido la hora sigue activa");
    const notice = await page.eval((sel) => {
      const group = document.querySelector(sel)?.closest("fieldset") || document.body;
      const error = group.querySelector("[role=alert]");
      if (!error) return null;
      const link = error.querySelector("a");
      return { text: window.__qa.norm(error.innerText), href: link ? link.getAttribute("href") : null };
    }, DAY_FIELD);
    if (expect(notice, "no se muestra ningún aviso con un sábado elegido")) {
      expect(/måndag till fredag/i.test(notice.text), `el aviso no explica el horario online: "${notice.text}"`);
      expect(notice.href === "/kontakt", `el aviso no enlaza a /kontakt (href "${notice.href}")`);
      note(`"${notice.text}"`);
    }
    const book = await findBookButton(page);
    expect(book.found && book.disabled, "el botón de reservar sigue activo con un sábado elegido");
  });

  test("/tjanster/hemstadning sábado no da 0 kr ni se puede reservar", { bug: "QA-03" }, async ({ page, api, expect }) => {
    const a = await attemptBooking(page, api, { route: "/tjanster/hemstadning", fields: withFields(CALCULATORS.home.valid(d), dateTimeFields(d.saturday)) });
    expectNoZeroPrice(expect, a);
    expectNotBookable(expect, a, `sábado ${d.saturday}`);
  });

  test("/tjanster/storstadning väggtvätt negativo no da precio negativo", { bug: "QA-04" }, async ({ page, api, expect, note }) => {
    const a = await attemptBooking(page, api, { route: "/tjanster/storstadning", fields: withFields(CALCULATORS.deep.valid(d), [["#vaggtvatt", "-20"]]) });
    expectNoNegative(expect, a);
    note(priceLine(a.summary));
  });

  test("/tjanster/hemstadning vaciar m² o frecuencia no deja el precio anterior", { bug: "QA-05" }, async ({ page, expect }) => {
    await page.goto("/tjanster/hemstadning");
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

  test("/tjanster/flyttstadning vaciar m² reinicia el precio (control)", async ({ page, expect }) => {
    await page.goto("/tjanster/flyttstadning");
    await fillFields(page, withFields(CALCULATORS.move.valid(d), [["#size", "100"]]));
    const full = await readSummary(page);
    if (!full || !(full.price > 0)) throw new Error(`el cálculo inicial no dio precio (${priceLine(full)})`);
    await fillFields(page, [["#size", ""]]);
    const empty = await readSummary(page);
    expect(empty.price !== full.price, `sin m² sigue mostrando ${empty.priceLine}`);
  });

  for (const units of ["51", "1000"]) {
    test(`/foretag/bodstadning ${units} bodar no da 0 kr`, { bug: "QA-11" }, async ({ page, api, expect, note }) => {
      const a = await attemptBooking(page, api, { route: "/foretag/bodstadning", fields: withFields(CALCULATORS.container.valid(d), [["#numberOfUnits", units]]) });
      expectNoZeroPrice(expect, a);
      note(priceLine(a.summary));
    });
  }

  test('/tjanster/storstadning "Offereras" (200 m²) no se reserva a 0 kr', { bug: "QA-12" }, async ({ page, api, expect, note }) => {
    const a = await attemptBooking(page, api, { route: "/tjanster/storstadning", fields: withFields(CALCULATORS.deep.valid(d), [["#size", "200"]]) });
    if (!a.summary?.quote) note(`el resumen no muestra "Offereras" (${priceLine(a.summary)})`);
    for (const p of a.posts) {
      expect(payloadPrice(p.json) !== 0 && Number(p.json?.basePrice) !== 0, `envía la reserva con totalPrice=${JSON.stringify(p.json?.totalPrice)} basePrice=${JSON.stringify(p.json?.basePrice)}`);
    }
  });

  test('/tjanster/fonsterputs "Offereras" (5 rum) no se reserva a 0 kr', { bug: "QA-12" }, async ({ page, api, expect, note }) => {
    const a = await attemptBooking(page, api, { route: "/tjanster/fonsterputs", fields: withFields(CALCULATORS.window.valid(d), [["#rooms", "5"]]) });
    for (const p of a.posts) expect(payloadPrice(p.json) !== 0, `envía la reserva con totalPrice=${JSON.stringify(p.json?.totalPrice)}`);
    note(`${a.reason}; ${priceLine(a.summary)}`);
  });

  test("/tjanster/hemstadning botón Boka desactivado se distingue del activo", { bug: "QA-16" }, async ({ page, expect, note }) => {
    await page.goto("/tjanster/hemstadning");
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
