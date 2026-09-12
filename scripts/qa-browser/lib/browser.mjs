// Browser + page session used by every test. Interception is armed on each
// target while it is still paused at creation, before it can send anything.
import fs from "node:fs";
import path from "node:path";
import { launchChrome } from "./chrome.mjs";
import { connectCdp } from "./cdp.mjs";
import { createApiGuard } from "./api-guard.mjs";
import { createConsoleRecorder } from "./console-log.mjs";
import { installQaHelpers } from "./in-page.mjs";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900, mobile: false },
  laptop: { width: 1024, height: 768, mobile: false },
  tablet: { width: 768, height: 1024, mobile: true },
  mobile: { width: 390, height: 844, mobile: true },
};

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36";
const MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const KEYS = {
  Tab: { key: "Tab", code: "Tab", vk: 9 },
  Enter: { key: "Enter", code: "Enter", vk: 13, text: "\r" },
  Escape: { key: "Escape", code: "Escape", vk: 27 },
  Space: { key: " ", code: "Space", vk: 32, text: " " },
  ArrowDown: { key: "ArrowDown", code: "ArrowDown", vk: 40 },
};

const IN_PAGE_SOURCE = `(${installQaHelpers.toString()})();`;

export async function openBrowser({ chromePath, port, outDir, baseUrl }) {
  const chrome = await launchChrome({ chromePath, port, profileDir: path.join(outDir, "chrome-profile") });
  let cdp;
  try {
    cdp = await connectCdp(chrome.wsUrl);
    const api = createApiGuard({ baseUrl });
    const logs = createConsoleRecorder({ baseUrl });
    const attached = new Map(); // targetId -> Promise<session>
    const popups = [];
    let mainTargetId = null;

    const arm = async (msg) => {
      const { sessionId, targetInfo, waitingForDebugger } = msg.params;
      const session = cdp.session(sessionId);
      try {
        if (["page", "iframe", "worker", "service_worker", "shared_worker"].includes(targetInfo.type)) {
          await api.attach(session).catch(() => {});
          // Children of this target (iframes, workers) get armed the same way.
          await session.send("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: true, flatten: true }).catch(() => {});
        }
      } finally {
        if (waitingForDebugger) await session.send("Runtime.runIfWaitingForDebugger").catch(() => {});
      }
      if (targetInfo.type === "page" && mainTargetId && targetInfo.targetId !== mainTargetId) {
        popups.push(targetInfo.url);
        cdp.send("Target.closeTarget", { targetId: targetInfo.targetId }).catch(() => {});
      }
      return session;
    };
    cdp.on((msg) => {
      if (msg.method !== "Target.attachedToTarget") return;
      const id = msg.params.targetInfo.targetId;
      if (!attached.has(id)) attached.set(id, arm(msg));
    });
    await cdp.send("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });

    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    mainTargetId = targetId;
    for (let i = 0; i < 100 && !attached.has(targetId); i++) await sleep(50);
    if (!attached.has(targetId)) throw new Error("No se pudo adjuntar la pestaña de pruebas");
    const session = await attached.get(targetId);

    // The tab Chrome opened on start was never armed: close it.
    const { targetInfos } = await cdp.send("Target.getTargets");
    for (const t of targetInfos) {
      if (t.type === "page" && t.targetId !== targetId) await cdp.send("Target.closeTarget", { targetId: t.targetId }).catch(() => {});
    }

    const page = new Page({ session, baseUrl, api, logs, outDir });
    await page.init();
    return {
      page,
      api,
      logs,
      popups,
      chromeVersion: chrome.version,
      async close() {
        cdp.close();
        await chrome.close();
      },
    };
  } catch (e) {
    if (cdp) cdp.close();
    await chrome.close();
    throw e;
  }
}

export class Page {
  constructor({ session, baseUrl, api, logs, outDir }) {
    Object.assign(this, { session, baseUrl, api, logs, outDir });
    this.shotsDir = path.join(outDir, "shots");
    fs.mkdirSync(this.shotsDir, { recursive: true });
    this.dialogs = [];
    this.navigations = 0;
    this.lastDocumentStatus = null;
    this.viewportName = null;
  }

  async init() {
    const s = this.session;
    s.on((msg) => {
      const p = msg.params || {};
      if (msg.method === "Page.javascriptDialogOpening") {
        this.dialogs.push({ type: p.type, message: p.message });
        s.send("Page.handleJavaScriptDialog", { accept: true }).catch(() => {});
      } else if (msg.method === "Page.frameNavigated" && !p.frame.parentId) {
        this.navigations += 1;
      } else if (msg.method === "Network.responseReceived" && p.type === "Document" && p.frameId === this.mainFrameId) {
        this.lastDocumentStatus = p.response.status;
      }
    });
    this.logs.attach(s);
    await s.send("Page.enable");
    await s.send("Runtime.enable");
    await s.send("Log.enable");
    await s.send("Page.addScriptToEvaluateOnNewDocument", { source: IN_PAGE_SOURCE });
    await s.send("Emulation.setTimezoneOverride", { timezoneId: "Europe/Stockholm" });
    // Headless tabs are unfocused by default, which disables :focus-visible.
    await s.send("Emulation.setFocusEmulationEnabled", { enabled: true });
    this.mainFrameId = (await s.send("Page.getFrameTree")).frameTree.frame.id;
    await this.setViewport("desktop");
  }

  url(route) {
    return /^https?:/.test(route) ? route : new URL(route, this.baseUrl).href;
  }

  async eval(fn, ...args) {
    const expression = typeof fn === "function" ? `(${fn.toString()})(...${JSON.stringify(args)})` : fn;
    const { result, exceptionDetails } = await this.session.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (exceptionDetails) throw new Error(`Error en la página: ${exceptionDetails.exception?.description || exceptionDetails.text}`);
    return result.value;
  }

  async waitFor(fn, { timeout = 10000, interval = 100, args = [] } = {}) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      try {
        const v = await this.eval(fn, ...args);
        if (v) return v;
      } catch {}
      await sleep(interval);
    }
    return null;
  }

  async setViewport(name) {
    const vp = typeof name === "string" ? VIEWPORTS[name] : name;
    const s = this.session;
    await s.send("Emulation.setDeviceMetricsOverride", { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile });
    await s.send("Emulation.setTouchEmulationEnabled", vp.mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    await s.send("Emulation.setUserAgentOverride", { userAgent: vp.mobile ? MOBILE_UA : DESKTOP_UA });
    this.viewportName = typeof name === "string" ? name : `${vp.width}x${vp.height}`;
    this.viewport = vp;
  }

  // Navigates and waits until React has hydrated the whole tree.
  async goto(route, { settle = 250, timeout = 120000 } = {}) {
    this.lastDocumentStatus = null;
    const nav = await this.session.send("Page.navigate", { url: this.url(route) });
    if (nav.errorText) throw new Error(`No se pudo cargar ${route}: ${nav.errorText}`);
    const ok = await this.waitFor(() => window.__qa && window.__qa.hydrated(), { timeout, interval: 150 });
    if (!ok) throw new Error(`${route} no terminó de hidratar en ${Math.round(timeout / 1000)} s`);
    await this.eval(() =>
      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]).then(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      )
    );
    if (settle) await sleep(settle);
    return { status: this.lastDocumentStatus };
  }

  // Stops timers and pending requests of the previous test.
  async blank() {
    await this.session.send("Page.navigate", { url: "about:blank" }).catch(() => {});
    await this.waitFor(() => location.href === "about:blank" && document.readyState === "complete", { timeout: 5000 });
  }

  resolve(spec) {
    return this.eval((sp) => {
      const el = window.__qa.resolve(sp);
      return el ? { found: true, visible: window.__qa.isVisible(el), desc: window.__qa.describe(el), disabled: !!(el.disabled || el.getAttribute("aria-disabled") === "true") } : { found: false };
    }, spec);
  }

  async setValue(spec, value) {
    const r = await this.eval((sp, v) => window.__qa.setValue(sp, v), spec, value);
    if (!r.ok) throw new Error(`Campo ${JSON.stringify(spec)} ${r.reason}`);
    return r.value;
  }

  async setChecked(spec, checked) {
    const r = await this.eval((sp, v) => window.__qa.setChecked(sp, v), spec, checked);
    if (!r.ok) throw new Error(`Casilla ${JSON.stringify(spec)} ${r.reason}`);
    return r.value;
  }

  // Real pointer click at the element centre, the way a user would hit it.
  async click(spec, { clickCount = 1 } = {}) {
    const target = await this.eval((sp) => {
      const el = window.__qa.resolve(sp);
      if (!el) return null;
      el.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
      const r = window.__qa.rect(el);
      const hit = document.elementFromPoint(r.cx, r.cy);
      return { ...r, hitSelf: !!hit && (hit === el || el.contains(hit)), hitDesc: hit ? window.__qa.describe(hit) : null, disabled: !!el.disabled };
    }, spec);
    if (!target) throw new Error(`No se encontró ${JSON.stringify(spec)} para hacer clic`);
    await this.mouseClick(target.cx, target.cy, clickCount);
    return target;
  }

  async mouseClick(x, y, clickCount = 1) {
    const s = this.session;
    await s.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    await s.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount });
    await s.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount });
  }

  async mouseMove(x, y) {
    await this.session.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  }

  async press(name, { modifiers = 0 } = {}) {
    const k = KEYS[name];
    if (!k) throw new Error(`Tecla desconocida: ${name}`);
    const base = { key: k.key, code: k.code, windowsVirtualKeyCode: k.vk, nativeVirtualKeyCode: k.vk, modifiers };
    await this.session.send("Input.dispatchKeyEvent", { type: "keyDown", ...base, ...(k.text ? { text: k.text } : {}) });
    await this.session.send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
  }

  // Freezes transitions and animations so screenshots are comparable.
  disableAnimations() {
    return this.eval(() => {
      if (document.getElementById("qa-no-anim")) return;
      const st = document.createElement("style");
      st.id = "qa-no-anim";
      st.textContent = "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important;scroll-behavior:auto!important}";
      document.head.appendChild(st);
    });
  }

  // beyondViewport lets a clip reach below the fold, but it resizes the
  // surface; leave it off when comparing focus or hover states.
  async screenshotData({ clip, beyondViewport = false } = {}) {
    const params = { format: "png" };
    if (clip) Object.assign(params, { captureBeyondViewport: beyondViewport, clip: { ...clip, scale: 1 } });
    return (await this.session.send("Page.captureScreenshot", params)).data;
  }

  async shot(name, opts = {}) {
    const file = path.join(this.shotsDir, name.endsWith(".png") ? name : `${name}.png`);
    fs.writeFileSync(file, Buffer.from(await this.screenshotData(opts), "base64"));
    return file;
  }
}
