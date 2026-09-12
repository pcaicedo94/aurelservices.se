// Helpers installed as window.__qa in every document before the app runs.
// The function is serialised with toString(), so it must stay self-contained.
export function installQaHelpers() {
  if (window.__qa) return;
  const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();

  const isVisible = (el) => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") return false;
      if (parseFloat(cs.opacity) < 0.05) return false;
    }
    return true;
  };
  const describe = (el) => {
    if (!el || el.nodeType !== 1) return String(el);
    let s = el.tagName.toLowerCase();
    if (el.id) s += "#" + el.id;
    if (el.classList.length) s += "." + [...el.classList].slice(0, 3).join(".");
    return s;
  };
  const label = (el) => norm(el.innerText || el.value || el.getAttribute("aria-label") || el.getAttribute("title") || "");

  // spec: "css selector" | { selector, text (regex source), within, visible }
  const resolveAll = (spec) => {
    if (typeof spec === "string") return [...document.querySelectorAll(spec)];
    const root = spec.within ? document.querySelector(spec.within) : document;
    if (!root) return [];
    let els = [...root.querySelectorAll(spec.selector || "*")];
    if (spec.text) {
      const re = new RegExp(spec.text, "i");
      els = els.filter((el) => re.test(label(el)));
    }
    return els;
  };
  const resolve = (spec) => {
    const els = resolveAll(spec);
    return els.find(isVisible) || (spec && spec.visible ? null : els[0]) || null;
  };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, bottom: r.bottom, left: r.left, right: r.right, cx: r.x + r.width / 2, cy: r.y + r.height / 2, docY: r.top + scrollY };
  };

  // React ignores plain .value assignment; go through the native setter.
  const setValue = (spec, value) => {
    const el = resolve(spec);
    if (!el) return { ok: false, reason: "no encontrado" };
    const proto =
      el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, String(value));
    el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
    return { ok: true, value: el.value };
  };
  const setChecked = (spec, checked) => {
    const el = resolve(spec);
    if (!el) return { ok: false, reason: "no encontrado" };
    if (el.checked !== !!checked) el.click();
    return { ok: true, value: el.checked };
  };

  const hydrated = () => {
    if (document.readyState !== "complete" || !window.next) return false;
    const root = document.getElementById("__next");
    const probe = document.querySelector(".faq-chat-button") || (root && root.lastElementChild);
    return !!probe && Object.keys(probe).some((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactProps$"));
  };

  /* ------------------------------- contrast ------------------------------- */
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const toRgba = (css) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (top, bottom) => {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1);
  };
  const lum = (c) => {
    const [r, g, b] = c.slice(0, 3).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const COLOR_RE = /(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)|#[0-9a-f]{3,8}\b/gi;

  // Candidate backdrops behind an element: gradient stops count separately,
  // so the verdict is the worst case. Background images cannot be measured.
  const backdrops = (el) => {
    const layers = [];
    let opacity = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      opacity *= parseFloat(cs.opacity);
      const img = cs.backgroundImage;
      if (img && img !== "none") {
        if (/url\(/i.test(img)) return { overImage: true, opacity };
        const own = toRgba(cs.backgroundColor);
        const stops = (img.match(COLOR_RE) || []).map(toRgba).map((s) => (s[3] >= 1 ? s : over(s, own[3] > 0 ? own : [255, 255, 255, 1])));
        if (stops.length) return { base: stops, layers, opacity };
      }
      const c = toRgba(cs.backgroundColor);
      if (c[3] >= 0.999) return { base: [c], layers, opacity };
      if (c[3] > 0) layers.push(c);
    }
    return { base: [[255, 255, 255, 1]], layers, opacity };
  };

  const contrast = (scopeSelector, opts = {}) => {
    const out = [];
    const exclude = opts.exclude || "";
    for (const scope of document.querySelectorAll(scopeSelector)) {
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
      const seen = new Set();
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!/[\p{L}\p{N}]/u.test(node.nodeValue)) continue;
        const el = node.parentElement;
        if (!el || seen.has(el) || !isVisible(el)) continue;
        seen.add(el);
        if (el.closest("button:disabled, [aria-disabled='true'], input:disabled")) continue;
        if (exclude && el.closest(exclude)) continue;
        const cs = getComputedStyle(el);
        const bd = backdrops(el);
        const size = parseFloat(cs.fontSize);
        const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
        const required = large ? 3 : 4.5;
        const item = { el: describe(el), text: norm(node.nodeValue).slice(0, 40), fontSize: size, fontWeight: cs.fontWeight, large, required };
        if (bd.overImage) {
          out.push({ ...item, measurable: false });
          continue;
        }
        const fg = toRgba(cs.color);
        const bgs = bd.base.map((b) => bd.layers.slice().reverse().reduce((acc, l) => over(l, acc), b));
        const ratios = bgs.map((bg) => ratio(over([fg[0], fg[1], fg[2], fg[3] * bd.opacity], bg), bg));
        const worst = Math.min(...ratios);
        out.push({ ...item, measurable: true, fg: hex(fg) + (fg[3] < 1 ? `@${fg[3].toFixed(2)}` : ""), bg: bgs.map(hex), ratio: Math.round(worst * 100) / 100, pass: worst >= required });
      }
    }
    return out;
  };

  window.__qa = { norm, isVisible, describe, label, resolve, resolveAll, rect, setValue, setChecked, hydrated, contrast, toRgba };
}
