// Minimal Chrome DevTools Protocol client over the WebSocket global that ships
// with Node 22. One browser-level socket, flattened target sessions.

const DEFAULT_TIMEOUT_MS = 60000;

export async function connectCdp(wsUrl, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = (e) => reject(new Error(`CDP: no se pudo abrir ${wsUrl} (${e.message || "error"})`));
  });

  let seq = 0;
  const pending = new Map();
  const listeners = new Set();
  let closed = false;

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id !== undefined && pending.has(msg.id)) {
      const { resolve, reject, timer, method } = pending.get(msg.id);
      pending.delete(msg.id);
      clearTimeout(timer);
      if (msg.error) reject(new Error(`${method}: ${msg.error.message}`));
      else resolve(msg.result);
      return;
    }
    if (msg.method) {
      for (const fn of listeners) {
        try {
          fn(msg);
        } catch (e) {
          console.error(`[cdp] listener falló en ${msg.method}: ${e.stack || e.message}`);
        }
      }
    }
  };
  ws.onclose = () => {
    closed = true;
    for (const { reject, timer, method } of pending.values()) {
      clearTimeout(timer);
      reject(new Error(`${method}: conexión CDP cerrada`));
    }
    pending.clear();
  };

  const send = (method, params = {}, sessionId) => {
    if (closed) return Promise.reject(new Error(`${method}: conexión CDP cerrada`));
    return new Promise((resolve, reject) => {
      const id = ++seq;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`${method}: sin respuesta en ${timeoutMs} ms`));
      }, timeoutMs);
      pending.set(id, { resolve, reject, timer, method });
      const msg = { id, method, params };
      if (sessionId) msg.sessionId = sessionId;
      ws.send(JSON.stringify(msg));
    });
  };

  return {
    send,
    // Listener receives every event; filter on msg.sessionId when needed.
    on(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    session(sessionId) {
      return {
        id: sessionId,
        send: (method, params = {}) => send(method, params, sessionId),
        on: (fn) => {
          const wrapped = (msg) => {
            if (msg.sessionId === sessionId) fn(msg);
          };
          listeners.add(wrapped);
          return () => listeners.delete(wrapped);
        },
      };
    },
    get closed() {
      return closed;
    },
    close() {
      try {
        ws.close();
      } catch {}
    },
  };
}
