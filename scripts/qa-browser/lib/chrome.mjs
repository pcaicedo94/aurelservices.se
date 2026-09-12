// Launches a throwaway headless Chrome with its profile inside the output
// folder, and guarantees it is killed on every exit path.
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";

export const DEFAULT_CHROME_PATH =
  process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "google-chrome";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(1000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function launchChrome({ chromePath = DEFAULT_CHROME_PATH, port, profileDir }) {
  // Never attach to a browser we did not start: it would not have our
  // request interception and could reach the real API.
  if (await probe(port)) {
    throw new Error(`El puerto CDP ${port} ya está en uso por otro navegador. Usa --port=<otro> o ciérralo.`);
  }
  if (!fs.existsSync(chromePath)) throw new Error(`No se encontró Chrome en ${chromePath} (usa --chrome=<ruta>)`);
  fs.mkdirSync(profileDir, { recursive: true });

  const proc = spawn(
    chromePath,
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--hide-scrollbars",
      "--disable-extensions",
      "--mute-audio",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-sync",
      "--password-store=basic",
      "--window-size=1440,900",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  let spawnError = null;
  let exited = false;
  proc.on("error", (e) => (spawnError = e));
  proc.on("exit", () => (exited = true));

  let killed = false;
  const kill = () => {
    if (killed) return;
    killed = true;
    try {
      if (process.platform === "win32") {
        execFileSync("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore" });
      } else {
        proc.kill("SIGKILL");
      }
    } catch {}
  };
  // Synchronous, so it also runs on process.exit() and uncaught errors.
  process.on("exit", kill);

  let version = null;
  for (let i = 0; i < 120 && !version; i++) {
    if (spawnError) break;
    if (exited) break;
    version = await probe(port);
    if (!version) await sleep(250);
  }
  if (!version) {
    kill();
    process.off("exit", kill);
    throw new Error(`Chrome no arrancó en el puerto ${port}${spawnError ? `: ${spawnError.message}` : ""}`);
  }

  return {
    pid: proc.pid,
    port,
    wsUrl: version.webSocketDebuggerUrl,
    version: version.Browser,
    async close({ removeProfile = true } = {}) {
      kill();
      process.off("exit", kill);
      if (!removeProfile) return;
      // Chrome releases profile file locks a moment after the process dies.
      for (let i = 0; i < 10; i++) {
        try {
          fs.rmSync(profileDir, { recursive: true, force: true });
          return;
        } catch {
          await sleep(300);
        }
      }
    },
  };
}
