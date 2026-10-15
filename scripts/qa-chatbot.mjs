/**
 * QA: the chatbot. components/ChatBot/FAQbot.js only walks the conversation in
 * lib/chatbot/tree.js, so the whole bot can be checked here without a browser:
 *
 *   1. Not one amount is written by hand. Every "… kr" the bot says is matched
 *      against the figures lib/pricing.js hands it AND against
 *      config/prices.json itself, and the tree's source may not contain an
 *      amount outside a comment. Until this script existed the bot promised
 *      "180 kr/timme" and "195 kr per timme" for hemstädning while the
 *      calculator on the same site charged 200–270 kr; those figures are now
 *      checked for explicitly so they cannot come back.
 *   2. Every service on the site is reachable. The 16 service pages under
 *      pages/tjanster/ and pages/foretag/ are read from disk, not from a list
 *      kept here, so a new page that the bot does not cover fails the run.
 *   3. Nobody gets stranded. Every node has a way out, and from every node the
 *      visitor can reach the quote node, the contact node and the main menu.
 *   4. Every link the bot shows points at a page that exists.
 *   5. A service that has no rate in the data is never given one, and the
 *      private/business split (moms, RUT, offert) is stated the right way
 *      round — flyttstädning and fönsterputsning exist in both sections and
 *      are not the same page nor the same price.
 *
 * No network, no side effects.
 *
 *   node scripts/qa-chatbot.mjs
 */
import { readdirSync, readFileSync } from "node:fs";
import {
  CHAT_NODES,
  CHAT_SERVICES,
  CHAT_TREE,
  CONTACT_ID,
  QUOTE_ID,
  ROOT_ID,
} from "../lib/chatbot/tree.js";
import {
  containerCleaningPricePerUnit,
  CONTAINER_CLEANING_TIERS,
  CONTAINER_VISITS_PER_WEEK,
  deepCleaningBasePrice,
  DEEP_CLEANING_EXTRAS,
  DEEP_CLEANING_TIERS,
  HOME_FREQUENCY_RATES,
  HOME_WEEKDAY_RATES,
  INVOICE_FEE,
  MOVE_CLEANING_EXTRAS,
  MOVE_CLEANING_TIERS,
  moveCleaningBasePrice,
  OFFICE_FREQUENCIES,
  WINDOW_BALCONY_PRICE,
  WINDOW_ROOM_PRICES,
} from "../lib/pricing.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const prices = JSON.parse(read("config/prices.json"));

let passed = 0;
const failures = [];

function check(name, actual, expected) {
  const ok = actual === expected;
  if (ok) passed += 1;
  else failures.push(name);
  console.log(
    ok ? `PASS  ${name}` : `FAIL  ${name}\n        esperado: ${expected}\n        obtenido: ${actual}`
  );
}

const ok = (name, condition, detail = "") => check(name, condition ? true : detail || false, true);

/* ------------------------------- the tree -------------------------------- */

const nodes = Object.values(CHAT_NODES);
const byId = CHAT_NODES;

console.log("=== Estructura del árbol ===");
check("la raíz existe", Boolean(byId[CHAT_TREE.rootId]), true);
check("la raíz es ROOT_ID", CHAT_TREE.rootId, ROOT_ID);
check("hay nodos", nodes.length > 0, true);

const unknownTargets = nodes.flatMap((node) =>
  node.options.filter((option) => !byId[option.next]).map((option) => `${node.id} → ${option.next}`)
);
check("ningún botón apunta a un nodo inexistente", unknownTargets.join(", ") || "ninguno", "ninguno");

const noExit = nodes.filter((node) => node.options.length === 0).map((n) => n.id);
check("ningún nodo sin salida", noExit.join(", ") || "ninguno", "ninguno");

const emptyMessage = nodes.filter((node) => !node.message || !node.message.trim()).map((n) => n.id);
check("ningún nodo sin texto", emptyMessage.join(", ") || "ninguno", "ninguno");

// Reachability, forwards from the root and from every node.
function reachable(from) {
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    for (const option of byId[queue.shift()].options) {
      if (byId[option.next] && !seen.has(option.next)) {
        seen.add(option.next);
        queue.push(option.next);
      }
    }
  }
  return seen;
}

const fromRoot = reachable(ROOT_ID);
const orphans = nodes.filter((node) => !fromRoot.has(node.id)).map((n) => n.id);
check("todos los nodos son alcanzables desde la raíz", orphans.join(", ") || "ninguno", "ninguno");

const stranded = { [QUOTE_ID]: [], [CONTACT_ID]: [], [ROOT_ID]: [] };
for (const node of nodes) {
  const can = reachable(node.id);
  for (const target of Object.keys(stranded)) {
    if (!can.has(target)) stranded[target].push(node.id);
  }
}
check(`desde cualquier nodo se llega a "${QUOTE_ID}"`, stranded[QUOTE_ID].join(", ") || "sí", "sí");
check(`desde cualquier nodo se llega a "${CONTACT_ID}"`, stranded[CONTACT_ID].join(", ") || "sí", "sí");
check("desde cualquier nodo se vuelve al menú principal", stranded[ROOT_ID].join(", ") || "sí", "sí");

/* ------------------------- 16 servicios cubiertos ------------------------- */

console.log("\n=== Cobertura de servicios ===");

// The list of services is read from pages/, so the bot cannot silently miss one.
function servicePages(dir) {
  return readdirSync(new URL(`../pages/${dir}`, import.meta.url))
    .filter((file) => file.endsWith(".js") && file !== "index.js")
    .map((file) => `/${dir}/${file.replace(/\.js$/, "")}`);
}
const pagesOnDisk = [...servicePages("tjanster"), ...servicePages("foretag")].sort();
check("pages/ contiene 16 páginas de servicio", pagesOnDisk.length, 16);
check("el bot conoce 16 servicios", CHAT_SERVICES.length, 16);

const serviceNodeId = (service) => `tjanst.${service.id}`;
const covered = [...new Set(CHAT_SERVICES.map((service) => service.page))].sort();
check(
  "cada página de servicio tiene su rama en el bot",
  covered.join(", "),
  pagesOnDisk.join(", ")
);

const unreachableServices = CHAT_SERVICES.filter(
  (service) => !fromRoot.has(serviceNodeId(service))
).map((s) => s.id);
check(
  "los 16 servicios son alcanzables desde la raíz",
  unreachableServices.join(", ") || "ninguno",
  "ninguno"
);

// Each service must answer "what is included" and "what does it cost", and the
// page (plus its calculator) must be linked from every one of its answers.
for (const service of CHAT_SERVICES) {
  const base = serviceNodeId(service);
  const branch = nodes.filter((node) => node.id === base || node.id.startsWith(`${base}.`));
  const hrefs = (node) => node.links.map((link) => link.href);
  const missingPage = branch.filter((node) => !hrefs(node).includes(service.page)).map((n) => n.id);
  ok(`${service.id}: todo nodo enlaza a ${service.page}`, missingPage.length === 0, missingPage.join(", "));
  ok(`${service.id}: responde qué incluye y qué cuesta`, Boolean(byId[`${base}.ingar`] && byId[`${base}.pris`]));
  if (service.calculator) {
    const anchor = `${service.page}#berakna-pris`;
    const missingCalc = branch.filter((node) => !hrefs(node).includes(anchor)).map((n) => n.id);
    ok(`${service.id}: enlaza a la calculadora`, missingCalc.length === 0, missingCalc.join(", "));
  }
}

/* ------------------------------ enlaces reales ---------------------------- */

console.log("\n=== Todos los enlaces existen en pages/ ===");

const pageFiles = new Set();
(function collect(dir, prefix) {
  for (const entry of readdirSync(new URL(`../pages${dir}`, import.meta.url), { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === "api") continue;
      collect(`${dir}/${entry.name}`, `${prefix}/${entry.name}`);
    } else if (entry.name.endsWith(".js") && !entry.name.startsWith("_")) {
      pageFiles.add(entry.name === "index.js" ? prefix || "/" : `${prefix}/${entry.name.replace(/\.js$/, "")}`);
    }
  }
})("", "");

const allLinks = nodes.flatMap((node) => node.links.map((link) => ({ node: node.id, ...link })));
check("el bot muestra enlaces", allLinks.length > 0, true);
const brokenLinks = allLinks
  .filter((link) => !pageFiles.has(link.href.split("#")[0]))
  .map((link) => `${link.node}: ${link.href}`);
check("ningún enlace roto", brokenLinks.join(", ") || "ninguno", "ninguno");

const unlabelled = allLinks.filter((link) => !link.label || !link.label.trim()).map((l) => l.href);
check("todo enlace tiene texto", unlabelled.join(", ") || "ninguno", "ninguno");

const wrongSection = CHAT_SERVICES.filter((service) =>
  service.segment === "private"
    ? !service.page.startsWith("/tjanster/")
    : !service.page.startsWith("/foretag/")
).map((s) => s.id);
check("cada servicio apunta a su sección", wrongSection.join(", ") || "ninguno", "ninguno");

/* --------------------- ninguna cifra escrita a mano ---------------------- */

console.log("\n=== Las cifras en kr vienen de los datos ===");

// Every amount the accessors can produce.
const fromPricing = new Set(
  [
    ...Object.values(HOME_WEEKDAY_RATES),
    ...Object.values(HOME_FREQUENCY_RATES),
    ...DEEP_CLEANING_TIERS.map((tier) => deepCleaningBasePrice(tier.maxSqm)),
    ...Object.values(DEEP_CLEANING_EXTRAS),
    ...MOVE_CLEANING_TIERS.flatMap((tier) => [tier.price, tier.pricePerSqm]),
    ...MOVE_CLEANING_TIERS.map((tier) => (tier.maxSqm === null ? null : moveCleaningBasePrice(tier.maxSqm))),
    ...Object.values(MOVE_CLEANING_EXTRAS),
    ...Object.values(WINDOW_ROOM_PRICES),
    WINDOW_BALCONY_PRICE,
    ...Object.values(OFFICE_FREQUENCIES).map((plan) => plan.hourlyRate),
    ...CONTAINER_CLEANING_TIERS.flatMap((tier) =>
      CONTAINER_VISITS_PER_WEEK.flatMap((visits) => [
        containerCleaningPricePerUnit(tier.minUnits, visits),
        containerCleaningPricePerUnit(tier.maxUnits, visits),
      ])
    ),
    INVOICE_FEE,
  ].filter((value) => typeof value === "number")
);

// The same amounts harvested straight from config/prices.json, so the check
// does not depend on lib/pricing.js reading the file correctly.
const fromJson = new Set();
(function harvest(node) {
  if (Array.isArray(node)) return node.forEach(harvest);
  if (!node || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node)) {
    // Amount-bearing keys only: "price", "pricePerSqm", "hourlyRate", the
    // weekday rates under byDay, the room counts under rooms, and the values
    // of the terms block. A percentage or an area is not an amount.
    if (typeof value === "number" && /price|rate|value|day$|^\d+$/i.test(key)) fromJson.add(value);
    else harvest(value);
  }
})(prices);
// Bands that never price below the top of the one before them (Q22).
for (const tier of MOVE_CLEANING_TIERS) {
  if (tier.maxSqm !== null) fromJson.add(moveCleaningBasePrice(tier.maxSqm));
}

const AMOUNT = /(\d[\d\s ]*)\s*kr/g;
const amountsIn = (text) =>
  [...text.matchAll(AMOUNT)].map((match) => Number(match[1].replace(/[\s ]/g, "")));

const quoted = new Map();
for (const node of nodes) {
  for (const amount of amountsIn(node.message)) {
    if (!quoted.has(amount)) quoted.set(amount, []);
    quoted.get(amount).push(node.id);
  }
}
check("el bot cita importes", quoted.size > 0, true);

const notFromPricing = [...quoted.keys()]
  .filter((amount) => !fromPricing.has(amount))
  .map((amount) => `${amount} kr (${quoted.get(amount).join(", ")})`);
check(
  "todo importe del bot sale de lib/pricing.js",
  notFromPricing.join(", ") || "sí",
  "sí"
);

const notInJson = [...quoted.keys()]
  .filter((amount) => !fromJson.has(amount))
  .map((amount) => `${amount} kr (${quoted.get(amount).join(", ")})`);
check(
  "todo importe del bot coincide con config/prices.json",
  notInJson.join(", ") || "sí",
  "sí"
);

// The source itself, comments stripped: an amount here would be a literal.
function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^[ \t]*\/\/.*$/gm, " ");
}
const treeSource = withoutComments(read("lib/chatbot/tree.js"));
const literalAmounts = [...treeSource.matchAll(AMOUNT)].map((match) => match[0].trim());
check(
  "lib/chatbot/tree.js no escribe ningún importe",
  literalAmounts.join(", ") || "ninguno",
  "ninguno"
);

const botSource = read("components/ChatBot/FAQbot.js");
check(
  "components/ChatBot/FAQbot.js no escribe ningún importe",
  [...withoutComments(botSource).matchAll(AMOUNT)].map((m) => m[0].trim()).join(", ") || "ninguno",
  "ninguno"
);
check(
  "components/ChatBot/FAQbot.js lee el árbol",
  /from "\.\.\/\.\.\/lib\/chatbot\/tree"/.test(botSource),
  true
);

// The rates the bot used to invent, which the calculators never charged.
console.log("\n=== Las tarifas viejas no vuelven ===");
const allMessages = nodes.map((node) => node.message).join("\n");
for (const stale of [180, 195, 325]) {
  ok(`"${stale} kr" ya no aparece`, !amountsIn(allMessages).includes(stale));
}
ok('ya no se dice "162,50 kr"', !/162[.,]50/.test(allMessages));
ok(
  'ya no se ofrece "inglasad balkong +400 kr" en fönsterputs',
  !/inglasad balkong[^.]*400/i.test(byId["tjanst.fonsterputs.pris"].message)
);

/* ----------------- las tarifas citadas son las correctas ----------------- */

console.log("\n=== Cada servicio cita exactamente sus tarifas ===");

const S = prices.services;
const cited = (nodeId) => amountsIn(byId[nodeId].message);
const citesAll = (nodeId, expected) => {
  const found = cited(nodeId);
  const missing = expected.filter((amount) => !found.includes(amount));
  return { missing, found };
};

function checkRates(label, nodeId, expected) {
  const { missing, found } = citesAll(nodeId, expected);
  check(`${label}: cita ${expected.join(", ")} kr`, missing.join(", ") || "todas", "todas");
  const extra = found.filter((amount) => !expected.includes(amount));
  check(`${label}: no cita ningún otro importe`, extra.join(", ") || "ninguno", "ninguno");
}

checkRates("hemstädning", "tjanst.hemstadning.pris", [
  S.homecleaning.weekdayRates.byDay.monday,
  S.homecleaning.weekdayRates.byDay.thursday,
  S.homecleaning.frequencies["1"].hourlyRate,
  S.homecleaning.frequencies.onetime.hourlyRate,
]);

checkRates(
  "storstädning",
  "tjanst.storstadning.pris",
  S.deepcleaning.tiers.map((tier) => tier.price)
);

checkRates("storstädning (tillägg)", "tjanst.storstadning.fraga1", [
  ...new Set(Object.values(S.deepcleaning.extras).map((extra) => extra.price)),
]);

checkRates("flyttstädning", "tjanst.flyttstadning.pris", [
  ...new Set(S.movecleaning.tiers.map((tier) => tier.price ?? tier.pricePerSqm)),
]);

checkRates("flyttstädning (tillägg)", "tjanst.flyttstadning.fraga1", [
  ...new Set(
    Object.values(S.movecleaning.extras).map((extra) => extra.price ?? extra.hourlyRate)
  ),
]);

checkRates("fönsterputsning", "tjanst.fonsterputs.pris", [
  ...Object.values(S.windowcleaning.rooms),
  S.windowcleaning.balconyOnly.price,
]);

checkRates(
  "kontorsstädning",
  "tjanst.kontorsstadning.pris",
  Object.values(S.officecleaning.frequencies).map((plan) => plan.hourlyRate)
);

const containerAll = S.containercleaning.tiers.flatMap((tier) =>
  Object.values(tier.pricePerUnitByVisitsPerWeek)
);
checkRates("bodstädning", "tjanst.bodstadning.pris", [
  Math.max(...containerAll),
  Math.min(...containerAll),
]);

checkRates("fakturaavgift", "info.betalning", [prices.terms.invoiceFee.value]);

// Non-price figures that also come from the data.
console.log("\n=== Umbrales y condiciones desde los datos ===");
ok(
  "storstädning nombra el límite de offert",
  byId["tjanst.storstadning.pris"].message.includes(`${S.deepcleaning.quoteAboveSqm} kvm`)
);
ok(
  "fönsterputsning nombra los dos umbrales de offert",
  byId["tjanst.fonsterputs.pris"].message.includes(`${S.windowcleaning.quote.fromRooms} rum`) &&
    byId["tjanst.fonsterputs.pris"].message.includes(`${S.windowcleaning.quote.aboveSqm} kvm`)
);
ok(
  "fönsterputsning nombra el recargo y que se suma",
  byId["tjanst.fonsterputs.fraga1"].message.includes(
    `${S.windowcleaning.surcharges.items.sprojs.percent} procent`
  ) &&
    byId["tjanst.fonsterputs.fraga1"].message.includes(
      `${2 * S.windowcleaning.surcharges.items.sprojs.percent} procent`
    )
);
ok(
  "bodstädning nombra el límite de offert y las semanas",
  byId["tjanst.bodstadning.pris"].message.includes(`${S.containercleaning.quoteAboveUnits} bodar`) &&
    byId["tjanst.bodstadning.pris"].message.includes(`${S.containercleaning.weeksPerMonth} veckor`)
);
ok(
  "la debitación mínima sale de los datos",
  byId["info.minsta"].message.includes(`${S.homecleaning.minHours.value} timmar`)
);
ok(
  "el descuento de la primera limpieza sale de los datos",
  byId["info.rabatt"].message.includes(`${prices.terms.firstCleaningDiscountPercent.value} procent`)
);
ok(
  "la antelación de cancelación sale de los datos",
  byId["info.avbokning"].message.includes(`${prices.terms.cancellationNoticeDays.value} dagar`)
);
ok(
  "el plazo de pago sale de los datos",
  byId["info.betalning"].message.includes(`${prices.terms.paymentTermsDays.value} dagars`)
);
ok(
  "la ventana de reserva es 07:00–15:00 sin fines de semana",
  /07:00/.test(byId["info.tider"].message) &&
    /15:00/.test(byId["info.tider"].message) &&
    /[Ll]ördagar och söndagar går inte att boka/.test(byId["info.tider"].message)
);

/* ------------------- offert cuando no hay tarifa fija -------------------- */

console.log("\n=== Sin tarifa en los datos, se ofrece offert ===");

const PRICED = new Set([
  "hemstadning",
  "storstadning",
  "flyttstadning",
  "fonsterputs",
  "kontorsstadning",
  "bodstadning",
]);

for (const service of CHAT_SERVICES) {
  const message = byId[`${serviceNodeId(service)}.pris`].message;
  if (PRICED.has(service.id)) continue;
  ok(`${service.id}: no inventa ningún precio`, amountsIn(message).length === 0, amountsIn(message).join(", "));
  ok(
    `${service.id}: explica que se ofertan tras platsbesök`,
    /offert/i.test(message) && /platsbesök/i.test(message)
  );
}

console.log("\n=== Particulares vs empresas ===");
for (const service of CHAT_SERVICES) {
  const message = byId[`${serviceNodeId(service)}.pris`].message;
  if (service.segment === "business") {
    ok(`${service.id}: dice exklusive moms`, /exklusive moms/i.test(message));
    // Either RUT is ruled out, or the answer says which deduction does apply
    // (byggtjänster is offered to private customers too, with ROT).
    ok(
      `${service.id}: dice qué avdrag aplica`,
      /RUT-avdrag gäller inte|ROT-avdrag/i.test(message),
      message.slice(0, 80)
    );
    ok(`${service.id}: siempre offert`, /offert/i.test(message));
  } else if (PRICED.has(service.id)) {
    ok(`${service.id}: dice inklusive moms efter RUT`, /inklusive moms och efter RUT-avdrag/i.test(message));
  }
}

// flyttstädning and fönsterputsning live in both sections: different pages,
// different prices, and each branch points at the other.
console.log("\n=== Flyttstädning y fönsterputs en las dos secciones ===");
for (const [privateId, businessId] of [
  ["flyttstadning", "foretag-flyttstadning"],
  ["fonsterputs", "foretag-fonsterputs"],
]) {
  const priv = CHAT_SERVICES.find((s) => s.id === privateId);
  const biz = CHAT_SERVICES.find((s) => s.id === businessId);
  ok(`${privateId}: páginas distintas`, priv.page !== biz.page, `${priv.page} = ${biz.page}`);
  const privLinks = nodes
    .filter((node) => node.id.startsWith(`tjanst.${privateId}.`))
    .flatMap((node) => node.links.map((link) => link.href));
  const bizLinks = nodes
    .filter((node) => node.id.startsWith(`tjanst.${businessId}.`))
    .flatMap((node) => node.links.map((link) => link.href));
  ok(`${privateId}: remite a la versión de empresa`, privLinks.includes(biz.page));
  ok(`${businessId}: remite a la versión de particular`, bizLinks.includes(priv.page));
  const bizPrice = byId[`tjanst.${businessId}.pris`].message;
  ok(`${businessId}: no repite el precio de particulares`, amountsIn(bizPrice).length === 0);
}

/* --------------- lo que el cliente no ha contestado aún ------------------ */

console.log("\n=== Sin respuesta del cliente, se deriva a contacto ===");

// Q90, Q92 and Q101-Q110 (answered 2026-10-15) took cancellation, keys and
// access, heavy soiling, a denied RUT deduction, insurance, pets, when a
// booking is closed and how we are paid off this list; what is left is still
// unanswered: the guarantee, the cleaning materials, the staff's languages,
// the areas covered and how a recurring agreement is signed.
const PENDING_NODES = [
  "info.garanti",
  "info.material",
  "info.sprak",
  "info.avtal",
  "info.omrade",
  "tjanst.hemstadning.fraga3",
];
for (const id of PENDING_NODES) {
  const node = byId[id];
  ok(`${id}: existe`, Boolean(node));
  if (!node) continue;
  ok(
    `${id}: invita a contactar`,
    /kontakta oss|hör av dig|skicka en förfrågan/i.test(node.message),
    node.message.slice(0, 60)
  );
  ok(
    `${id}: tiene salida a contacto`,
    node.options.some((option) => option.next === CONTACT_ID) ||
      node.links.some((link) => link.href === "/kontakt")
  );
}

/* ------------------- lo que el cliente ya confirmó ----------------------- */

console.log("\n=== Lo confirmado el 2026-10-15 sale de los datos ===");

// Q104: a ceiling and an approval, never a flat surcharge.
const soiling = byId["tjanst.storstadning.fraga3"].message;
ok(
  "el tillägg por suciedad sale de los datos",
  soiling.includes(`${prices.services.deepcleaning.soilingSurcharge.maxPercent} procent`)
);
ok("el tillägg por suciedad se dice como techo", /upp till \d+ procent/.test(soiling));
ok(
  "el tillägg por suciedad exige la aprobación del cliente",
  /godkänna/i.test(soiling) && /på plats/i.test(soiling)
);

// Q101: free up to the deadline, then two ceilings, and nothing charged when
// Aurel is the one that cancels.
const cancellation = byId["info.avbokning"].message;
ok(
  "la antelación de cancelación se dice en horas y en días",
  cancellation.includes(`${prices.terms.cancellationNoticeHours.value} timmar`) &&
    cancellation.includes(`${prices.terms.cancellationNoticeDays.value} dagar`)
);
ok("la antelación de cancelación es gratuita", /[Kk]ostnadsfri/.test(cancellation));
ok(
  "la penalización tardía sale de los datos y es un techo",
  cancellation.includes(`upp till ${prices.terms.lateCancellationFeePercent.value} procent`)
);
ok(
  "la penalización del mismo día sale de los datos y es un techo",
  cancellation.includes(`upp till ${prices.terms.sameDayCancellationFeePercent.value} procent`)
);
ok(
  "no haber tenido acceso se trata como el mismo día",
  /tillträde/i.test(cancellation)
);
ok(
  "si cancela Aurel no se cobra nada",
  /ny tid/i.test(cancellation) && /inte för arbete som inte har utförts/i.test(cancellation)
);
ok(
  "ninguna cifra de cancelación se escribe en kr",
  amountsIn(cancellation).length === 0,
  amountsIn(cancellation).join(", ")
);

// Q92, Q102, Q105, Q108 and Q90: stated, not deferred.
ok(
  "el pago es solo por factura",
  /mot faktura/i.test(byId["info.betalning"].message) &&
    /inte emot Swish eller kortbetalning/i.test(byId["info.betalning"].message)
);
ok(
  "las llaves se tratan confidencialmente y por personal autorizado",
  /konfidentiellt/i.test(byId["info.nycklar"].message) &&
    /behörig personal/i.test(byId["info.nycklar"].message)
);
ok(
  "sin tillträde se puede cobrar el tiempo reservado o el desplazamiento",
  /den bokade tiden eller framkörningen/i.test(byId["info.nycklar"].message)
);
ok(
  "la reserva queda cerrada con la confirmación por correo",
  /bekräftelse via e-post/i.test(byId["info.hurbokar"].message) &&
    /skriver inte under något/i.test(byId["info.hurbokar"].message)
);
ok(
  "el seguro se nombra sin inventar aseguradora ni importe",
  /företags- och ansvarsförsäkring/i.test(byId["info.forsakring"].message) &&
    /[Ff]örsäkringsbevis/.test(byId["info.forsakring"].message) &&
    !/försäkringsbolag|självrisk/i.test(byId["info.forsakring"].message)
);
ok(
  "un RUT denegado se factura al cliente",
  /avslår Skatteverket avdraget/i.test(byId["info.rut"].message) &&
    /mellanskillnaden/i.test(byId["info.rut"].message)
);
ok(
  "el tiempo de respuesta sale de los datos",
  byId[CONTACT_ID].message.includes(`${prices.terms.responseTimeHours.value} timmar`)
);

/* -------------------------------- resumen -------------------------------- */

console.log(`\n=== Nodos: ${nodes.length}, servicios: ${CHAT_SERVICES.length}, enlaces: ${allLinks.length} ===`);
console.log(`\n=== ${passed}/${passed + failures.length} OK ===`);
if (failures.length) {
  console.log(failures.map((name) => `  FAIL: ${name}`).join("\n"));
  process.exitCode = 1;
}
