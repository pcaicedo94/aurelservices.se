// Site flows shared by the suites: calculators, the booking contact form and
// the feedback shown after a submit. Selectors fall back to generic ones so a
// reworked form keeps being testable.
import { sleep } from "./browser.mjs";

export const CONTACT = {
  name: "QA Testperson",
  email: "qa.test@example.com",
  phone: "0701234567",
  address: "Testgatan 1, 12345 Stockholm",
  message: "Automatiskt test (QA-mock), ignorera.",
  subject: "QA test",
};

export const BOOK_BUTTON = { selector: "button, a", text: "^\\s*Boka( tjänsten)?\\s*$" };

// Valid inputs per calculator; `size` names the free numeric field.
export const CALCULATORS = {
  home: { route: "/homecleaning", size: "#size", valid: (d) => [["#size", "60"], ["#frequency", "2"], ["#dateTime", d.weekday]] },
  deep: { route: "/deepcleaning", size: "#size", valid: (d) => [["#size", "60"], ["#dateTime", d.weekday], ["#contactPreference", "call"]] },
  move: { route: "/movecleaning", size: "#size", valid: (d) => [["#size", "60"], ["#dateTime", d.weekday]] },
  window: { route: "/windowcleaning", size: null, valid: (d) => [["#rooms", "3"], ["#dateTime", d.weekday]] },
  container: {
    route: "/containercleaning",
    size: "#numberOfUnits",
    valid: (d) => [["#numberOfUnits", "10"], ["#frequency", "5"], ["#dateTime", d.weekday], ["#contactPreference", "call"]],
  },
};

// Replaces the value of matching selectors and appends new ones, keeping order.
export function withFields(base, overrides) {
  const out = base.map(([sel, val]) => {
    const o = overrides.find(([s]) => s === sel);
    return o ? o : [sel, val];
  });
  for (const o of overrides) if (!base.some(([s]) => s === o[0])) out.push(o);
  return out;
}

export async function fillFields(page, fields) {
  for (const [sel, val] of fields) {
    if (typeof val === "boolean") await page.setChecked(sel, val);
    else await page.setValue(sel, val);
    // Let React commit before the next handler reads state.
    await sleep(120);
  }
  await sleep(250);
}

export function parsePrice(line) {
  if (!line) return { price: null, quote: false, negative: false };
  const value = (line.includes(":") ? line.slice(line.indexOf(":") + 1) : line).replace(/ /g, " ");
  const m = value.match(/-?\s?\d[\d ]*(?:[.,]\d+)?/);
  return {
    price: m ? Number(m[0].replace(/\s/g, "").replace(",", ".")) : null,
    quote: /offer/i.test(value),
    negative: /-\s?\d/.test(value),
  };
}

export const payloadPrice = (body) => {
  const raw = body ? body.totalPrice ?? body.price ?? null : null;
  if (raw === null || raw === undefined || raw === "") return NaN;
  return Number(String(raw).replace(/\s/g, "").replace(",", "."));
};

export async function readSummary(page) {
  const s = await page.eval(() => {
    const frame = document.querySelector(".summary-frame");
    if (!frame) return null;
    const lines = [...frame.querySelectorAll("li")].map((li) => window.__qa.norm(li.innerText));
    const priceLine = [...lines].reverse().find((l) => /(totalpris|uppskattat[^:]*pris|månadspris|^pris)/i.test(l)) || null;
    return { text: window.__qa.norm(frame.innerText), lines, priceLine };
  });
  return s ? { ...s, ...parsePrice(s.priceLine) } : null;
}

export async function findBookButton(page) {
  const inSummary = await page.resolve({ ...BOOK_BUTTON, within: ".summary-frame" });
  if (inSummary.found) return { spec: { ...BOOK_BUTTON, within: ".summary-frame" }, ...inSummary };
  const anywhere = await page.resolve(BOOK_BUTTON);
  return { spec: BOOK_BUTTON, ...anywhere };
}

export function waitContactForm(page, timeout = 3000) {
  return page.waitFor(
    () => {
      const e = [...document.querySelectorAll("input[type=email]")].find((x) => window.__qa.isVisible(x) && !x.closest(".faq-chat-window"));
      return !!e;
    },
    { timeout }
  );
}

// Tags the visible contact form, its fields and submit button with data-qa-*
// attributes, then fills it. Required consent boxes get ticked.
export async function fillContact(page, values = CONTACT) {
  const found = await page.eval(() => {
    const email = [...document.querySelectorAll("input[type=email]")].find((x) => window.__qa.isVisible(x) && !x.closest(".faq-chat-window"));
    const form = email && email.closest("form");
    if (!form) return null;
    document.querySelectorAll("[data-qa-contact-form]").forEach((f) => f.removeAttribute("data-qa-contact-form"));
    form.setAttribute("data-qa-contact-form", "1");
    const pick = (sels) => {
      for (const s of sels) {
        const el = [...form.querySelectorAll(s)].find(window.__qa.isVisible);
        if (el) return el;
      }
      return null;
    };
    const map = {
      name: ["#name", "[name=name]", "[autocomplete=name]", "input[placeholder*='namn' i]"],
      email: ["input[type=email]"],
      phone: ["#phone", "[name=phone]", "[name=number]", "input[type=tel]"],
      address: ["#address", "[name=address]", "input[placeholder*='adress' i]"],
      subject: ["[name=subject]"],
      message: ["textarea"],
    };
    const fields = [];
    for (const [k, sels] of Object.entries(map)) {
      const el = pick(sels);
      if (el) {
        el.setAttribute("data-qa-field", k);
        fields.push(k);
      }
    }
    const consents = [...form.querySelectorAll("input[type=checkbox][required]")].filter((c) => !c.checked);
    consents.forEach((c) => c.click());
    const submit = [...form.querySelectorAll("button[type=submit], input[type=submit], button:not([type])")].find(window.__qa.isVisible);
    if (submit) submit.setAttribute("data-qa-submit", "1");
    return { fields, consents: consents.length, submit: !!submit };
  });
  if (!found) throw new Error("No se encontró un formulario de contacto visible");
  if (!found.submit) throw new Error("El formulario de contacto no tiene botón de envío");
  for (const k of found.fields) {
    if (values[k] === undefined) continue;
    await page.setValue(`[data-qa-contact-form] [data-qa-field="${k}"]`, values[k]);
    await sleep(60);
  }
  return found;
}

// Real clicks on the tagged submit button; extra clicks land on the same spot.
export async function submitContact(page, { clicks = 1, gapMs = 120 } = {}) {
  const t = await page.click("[data-qa-contact-form] [data-qa-submit]");
  for (let i = 1; i < clicks; i++) {
    await sleep(gapMs);
    await page.mouseClick(t.cx, t.cy);
  }
  return t;
}

export async function waitForApiCall(api, mark, pathPrefix, timeout = 3000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (api.callsSince(mark, pathPrefix).length) return true;
    await sleep(100);
  }
  return false;
}

// Full booking attempt with the API answering `scenario`. `bookable` means a
// POST to /api/booking actually left the page.
export async function attemptBooking(page, api, { route, fields, scenario = "ok" }) {
  await page.goto(route);
  api.setScenario(scenario);
  await fillFields(page, fields);
  const summary = await readSummary(page);
  const book = await findBookButton(page);
  if (!book.found) {
    // Quote-only calculations replace "Boka tjänsten" with "Begär offert", which
    // cannot create a booking: that is the not-bookable outcome, not an error.
    const quoteOnly = await page.eval(() =>
      [...document.querySelectorAll("button, a")].some(
        (b) => !b.closest("#navbar, footer") && window.__qa.isVisible(b) && /begär offert/i.test(b.textContent)
      )
    );
    if (quoteOnly) {
      return { summary, bookDisabled: true, reachedContactForm: false, posts: [], otherApi: [], dialogs: [], invalid: [], bookable: false, reason: 'solo oferta ("Begär offert")' };
    }
    throw new Error(`No se encontró el botón "Boka tjänsten" en ${route}`);
  }
  const base = { summary, bookDisabled: book.disabled, reachedContactForm: false, posts: [], otherApi: [], dialogs: [], invalid: [] };
  if (book.disabled) return { ...base, bookable: false, reason: "botón Boka desactivado" };

  const dialogsBefore = page.dialogs.length;
  await page.click(book.spec);
  if (!(await waitContactForm(page))) {
    return { ...base, bookable: false, reason: "no se abrió el formulario de contacto", dialogs: page.dialogs.slice(dialogsBefore).map((d) => d.message) };
  }
  await fillContact(page);
  const mark = api.mark();
  await submitContact(page);
  await waitForApiCall(api, mark, "/api/", 3000);
  await sleep(400);
  const invalid = await page.eval(() =>
    [...document.querySelectorAll("input:invalid, select:invalid, textarea:invalid")].map((el) => `${el.id || el.name}: ${el.validationMessage}`)
  );
  const posts = api.callsSince(mark, "/api/booking");
  return {
    ...base,
    reachedContactForm: true,
    posts,
    otherApi: api.callsSince(mark).filter((c) => !c.path.startsWith("/api/booking")),
    dialogs: page.dialogs.slice(dialogsBefore).map((d) => d.message),
    invalid,
    bookable: posts.length > 0,
    reason: posts.length ? `${posts.length} POST a /api/booking` : "sin POST",
  };
}

// Visible feedback after a submit. Tags its first button as data-qa-dismiss.
export function readFeedback(page) {
  return page.eval(() => {
    const sels = [".popup-window", ".swal2-popup", "[role=alertdialog]", "[role=alert]", ".alert-danger", ".alert-success", "[aria-live=assertive]", "[aria-live=polite]", ".booking-confirmation", "[role=status]"];
    for (const s of sels) {
      const el = [...document.querySelectorAll(s)].find((e) => window.__qa.isVisible(e) && window.__qa.norm(e.innerText) && !e.closest(".faq-chat-window"));
      if (!el) continue;
      const heading = el.querySelector("h1, h2, h3, h4, .swal2-title");
      const btn = [...el.querySelectorAll("button")].find(window.__qa.isVisible);
      document.querySelectorAll("[data-qa-dismiss]").forEach((b) => b.removeAttribute("data-qa-dismiss"));
      if (btn) btn.setAttribute("data-qa-dismiss", "1");
      return { selector: s, text: window.__qa.norm(el.innerText).slice(0, 200), title: heading ? window.__qa.norm(heading.innerText) : null, hasButton: !!btn };
    }
    return null;
  });
}

export function snapshotValues(page, selectors) {
  return page.eval((sels) => {
    const out = {};
    for (const s of sels) {
      const el = document.querySelector(s);
      out[s] = el ? (el.type === "checkbox" ? el.checked : el.value) : null;
    }
    return out;
  }, selectors);
}
