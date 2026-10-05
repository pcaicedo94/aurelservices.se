#!/usr/bin/env node
// Builds the static export and publishes it to Simply.com over SFTP.
//
// Simply runs Apache 2.4 + PHP 8 and cannot run Node, so the site ships as
// plain HTML. This script is the whole procedure in one place:
//
//   1. node scripts/build-sitemap.mjs        (public/sitemap.xml, before the build)
//   2. next build with NEXT_PUBLIC_STATIC_EXPORT=1  -> out/
//   3. node scripts/check-export.mjs          (26 pages, .htaccess, robots.txt,
//                                              sitemap.xml, titles, canonicals,
//                                              no dead internal links)
//   4. SFTP sync of out/ into $SIMPLY_REMOTE_PATH
//
// Usage:
//   node scripts/deploy-simply.mjs --dry-run     # build, check and list, no upload
//   node scripts/deploy-simply.mjs --build-only  # build and check, then stop
//   node scripts/deploy-simply.mjs               # build, check and upload
//   node scripts/deploy-simply.mjs --local=C:/tmp/fake-simply   # rehearsal
//
// Environment (never in the repo — export them in your shell or a password
// manager plugin; .env is gitignored and is NOT read by this script):
//
//   SIMPLY_SSH_HOST     ssh host of the Simply account, e.g. ssh.simply.com
//   SIMPLY_SSH_USER     ssh user of the account
//   SIMPLY_REMOTE_PATH  absolute path of the published site, e.g. /public_html
//   SIMPLY_SSH_KEY      path to the private key (recommended), or
//   SIMPLY_SSH_PASS     the account password (needs sshpass or PuTTY psftp:
//                       OpenSSH sftp cannot read a password from a script)
//   SIMPLY_SSH_PORT     optional, 22 by default
//   SIMPLY_SFTP_BIN     optional, path to the sftp binary
//
// Idempotency: every upload leaves a manifest (.aurel-deploy-manifest.json,
// sha256 per file) at the remote root. The next run downloads it and uploads
// only what changed, so running the script twice in a row transfers nothing.
// --prune additionally deletes files that this script uploaded before and that
// the export no longer contains; it never touches files it did not upload
// (the PHP endpoints and anything else living on the server are safe).
//
// Exit codes: 0 ok · 1 the export failed verification · 2 the build failed ·
//             3 missing or unusable configuration · 4 the transfer failed.

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const MANIFEST_NAME = ".aurel-deploy-manifest.json";

const HELP = `Uso: node scripts/deploy-simply.mjs [opciones]

  --dry-run        construye, verifica y lista lo que subiría. No se conecta a nada.
  --build-only     construye y verifica el export, y para ahí.
  --skip-build     usa el out/ que ya existe en vez de volver a construir.
  --local=<dir>    ensayo: sincroniza contra una carpeta local en vez de por SFTP.
  --prune          borra en destino lo que este script subió antes y ya no existe.
  --dir=<dir>      carpeta del export (por defecto out/).
  --help           esta ayuda.

Variables de entorno necesarias para subir de verdad:
  SIMPLY_SSH_HOST, SIMPLY_SSH_USER, SIMPLY_REMOTE_PATH y
  SIMPLY_SSH_KEY (recomendado) o SIMPLY_SSH_PASS.
  Opcionales: SIMPLY_SSH_PORT (22), SIMPLY_SFTP_BIN.`;

/* ------------------------------- arguments ------------------------------- */

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) die(3, `Argumento no reconocido: ${a}\n\n${HELP}`);
    out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

function die(code, message) {
  console.error(message);
  process.exit(code);
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(HELP);
  process.exit(0);
}

const dryRun = Boolean(args["dry-run"]);
const buildOnly = Boolean(args["build-only"]);
const skipBuild = Boolean(args["skip-build"]);
const prune = Boolean(args.prune);
const localTarget = args.local ? path.resolve(String(args.local)) : null;
const outDir = path.resolve(root, String(args.dir || "out"));

/* --------------------------------- build --------------------------------- */

function run(command, cmdArgs, extraEnv = {}) {
  const res = spawnSync(command, cmdArgs, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  if (res.error) return { ok: false, reason: res.error.message };
  if (res.status !== 0) return { ok: false, reason: `salió con código ${res.status}` };
  return { ok: true };
}

function build() {
  const env = { NEXT_PUBLIC_STATIC_EXPORT: "1" };

  // The sitemap has to exist before the build: there is no server able to
  // generate it on request, and `next build` copies public/ as it is.
  console.log("\n== 1/3 sitemap ==");
  let res = run(process.execPath, [path.join("scripts", "build-sitemap.mjs")], env);
  if (!res.ok) die(2, `No se pudo generar el sitemap: ${res.reason}`);

  console.log("\n== 2/3 next build (export estático) ==");
  // Call the Next CLI through node instead of npx: no shell, no .cmd wrapper,
  // same behaviour on Windows and Linux.
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  if (!fs.existsSync(nextBin)) die(2, `No encuentro ${nextBin}. ¿Faltan las dependencias?`);
  // A stale out/ would hide a page that stopped being generated.
  fs.rmSync(outDir, { recursive: true, force: true });
  res = run(process.execPath, [nextBin, "build"], env);
  if (!res.ok) die(2, `El build falló: ${res.reason}`);
}

function verify() {
  console.log("\n== 3/3 verificación del export ==");
  const res = run(process.execPath, [
    path.join("scripts", "check-export.mjs"),
    `--dir=${path.relative(root, outDir) || "out"}`,
  ]);
  if (!res.ok) die(1, `\nEl export no pasa la verificación (${res.reason}). No se sube nada.`);
}

/* ------------------------------ file listing ------------------------------ */

function listFiles(dir, prefix = "") {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(full, rel));
      continue;
    }
    if (!entry.isFile()) continue;
    if (rel === MANIFEST_NAME) continue;
    const { size } = fs.statSync(full);
    files.push({ rel, full, size, hash: sha256(full) });
  }
  return files;
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function humanBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Directories to create in destination, parents first. */
function directoriesOf(files) {
  const dirs = new Set();
  for (const { rel } of files) {
    const parts = rel.split("/").slice(0, -1);
    for (let i = 1; i <= parts.length; i += 1) dirs.add(parts.slice(0, i).join("/"));
  }
  return [...dirs].sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b));
}

/** What changed since the manifest the destination reported. */
function planUpload(files, previous) {
  const before = new Map(Object.entries(previous || {}));
  const upload = files.filter((f) => before.get(f.rel) !== f.hash);
  const unchanged = files.length - upload.length;
  const current = new Set(files.map((f) => f.rel));
  const stale = [...before.keys()].filter((rel) => !current.has(rel));
  return { upload, unchanged, stale };
}

/* ------------------------------- transports ------------------------------- */

/** Rehearsal transport: a plain directory standing in for the server. */
function localTransport(destination) {
  return {
    describe: () => destination,
    readManifest() {
      const file = path.join(destination, MANIFEST_NAME);
      if (!fs.existsSync(file)) return null;
      try {
        return JSON.parse(fs.readFileSync(file, "utf8")).files || null;
      } catch {
        return null;
      }
    },
    send(files, stale, manifest) {
      fs.mkdirSync(destination, { recursive: true });
      for (const { rel, full } of files) {
        const target = path.join(destination, rel);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(full, target);
      }
      for (const rel of stale) fs.rmSync(path.join(destination, rel), { force: true });
      fs.writeFileSync(path.join(destination, MANIFEST_NAME), manifest, "utf8");
    },
  };
}

/**
 * SFTP transport. Builds a batch file and hands it to the system sftp client,
 * so there is no npm dependency and no credential ever reaches the repo.
 */
function sftpTransport(config) {
  const { host, user, port, keyFile, password, remotePath, binary } = config;
  const target = `${user}@${host}`;
  const remote = (rel) => quote(rel ? `${remotePath}/${rel}` : remotePath);

  function quote(value) {
    // sftp batch files take double quotes; the remote paths here come from our
    // own export, but quoting keeps spaces and accents (Bodstädning.png) safe.
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  function runBatch(lines, { capture = false } = {}) {
    const batchFile = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "aurel-sftp-")),
      "batch.txt"
    );
    fs.writeFileSync(batchFile, `${lines.join("\n")}\n`, "utf8");
    const base = ["-b", batchFile, "-P", String(port)];
    if (keyFile) base.push("-i", keyFile, "-o", "BatchMode=yes");
    base.push("-o", "StrictHostKeyChecking=accept-new", target);

    let command = binary;
    let commandArgs = base;
    const env = { ...process.env };
    if (!keyFile && password) {
      // OpenSSH refuses to read a password from anything but a terminal, so a
      // password deploy needs a helper. SSHPASS is passed through the
      // environment (-e) so it never shows up in the process list.
      command = config.passwordHelper.command;
      commandArgs = [...config.passwordHelper.args, binary, ...base];
      env.SSHPASS = password;
    }

    const res = spawnSync(command, commandArgs, {
      cwd: root,
      env,
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
      encoding: "utf8",
    });
    fs.rmSync(path.dirname(batchFile), { recursive: true, force: true });
    return res;
  }

  return {
    describe: () => `${target}:${remotePath} (puerto ${port})`,
    readManifest() {
      const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "aurel-mf-")), MANIFEST_NAME);
      // "-get": the leading dash tells sftp to carry on if the file is not
      // there yet, which is the normal case on the very first deploy.
      const res = runBatch([`-get ${remote(MANIFEST_NAME)} "${tmp}"`], { capture: true });
      if (res.error) die(4, `No se pudo ejecutar ${binary}: ${res.error.message}`);
      if (!fs.existsSync(tmp)) return null;
      try {
        return JSON.parse(fs.readFileSync(tmp, "utf8")).files || null;
      } catch {
        return null;
      } finally {
        fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
      }
    },
    send(files, stale, manifest) {
      const manifestFile = path.join(
        fs.mkdtempSync(path.join(os.tmpdir(), "aurel-mf-")),
        MANIFEST_NAME
      );
      fs.writeFileSync(manifestFile, manifest, "utf8");

      const lines = [];
      // "-mkdir": ignore the error when the directory already exists, which is
      // what makes re-running the script harmless.
      for (const dir of directoriesOf(files)) lines.push(`-mkdir ${remote(dir)}`);
      for (const { rel, full } of files) lines.push(`put "${full}" ${remote(rel)}`);
      for (const rel of stale) lines.push(`-rm ${remote(rel)}`);
      // The manifest goes last: if the transfer dies halfway the destination
      // keeps the old one and the next run re-uploads everything pending.
      lines.push(`put "${manifestFile}" ${remote(MANIFEST_NAME)}`);

      const res = runBatch(lines);
      fs.rmSync(path.dirname(manifestFile), { recursive: true, force: true });
      if (res.error) die(4, `No se pudo ejecutar ${binary}: ${res.error.message}`);
      if (res.status !== 0) die(4, `sftp terminó con código ${res.status}. Nada garantiza que la subida esté completa.`);
    },
  };
}

/** Reads the environment and explains precisely what is missing. */
function readConfig() {
  const host = process.env.SIMPLY_SSH_HOST;
  const user = process.env.SIMPLY_SSH_USER;
  const remotePath = process.env.SIMPLY_REMOTE_PATH;
  const keyFile = process.env.SIMPLY_SSH_KEY;
  const password = process.env.SIMPLY_SSH_PASS;
  const port = process.env.SIMPLY_SSH_PORT || "22";
  const binary = process.env.SIMPLY_SFTP_BIN || "sftp";

  const missing = [];
  if (!host) missing.push("SIMPLY_SSH_HOST (host ssh de la cuenta de Simply)");
  if (!user) missing.push("SIMPLY_SSH_USER (usuario ssh)");
  if (!remotePath) missing.push("SIMPLY_REMOTE_PATH (ruta absoluta del sitio publicado, p. ej. /public_html)");
  if (!keyFile && !password) missing.push("SIMPLY_SSH_KEY (clave privada) o SIMPLY_SSH_PASS (contraseña)");
  if (missing.length) {
    die(
      3,
      "Faltan credenciales. No hay nada configurado en el repo a propósito: " +
        "exporta estas variables en tu shell antes de desplegar.\n\n  - " +
        missing.join("\n  - ") +
        "\n\nPara ver qué se subiría sin credenciales:\n  node scripts/deploy-simply.mjs --dry-run"
    );
  }
  if (remotePath && !remotePath.startsWith("/")) {
    die(3, `SIMPLY_REMOTE_PATH debe ser una ruta absoluta del servidor; recibí "${remotePath}".`);
  }
  if (keyFile && !fs.existsSync(keyFile)) {
    die(3, `SIMPLY_SSH_KEY apunta a ${keyFile}, que no existe.`);
  }

  let passwordHelper = null;
  if (!keyFile && password) {
    passwordHelper = findPasswordHelper();
    if (!passwordHelper) {
      die(
        3,
        "SIMPLY_SSH_PASS está puesta, pero el cliente sftp de OpenSSH no acepta contraseñas desde un script.\n" +
          "Opciones:\n" +
          "  - usa una clave: ssh-keygen -t ed25519, sube la pública al panel de Simply y pon SIMPLY_SSH_KEY (recomendado);\n" +
          "  - o instala sshpass y vuelve a ejecutar."
      );
    }
  }

  return {
    host,
    user,
    port: Number(port),
    keyFile: keyFile || null,
    password: password || null,
    passwordHelper,
    remotePath: remotePath.replace(/\/+$/, ""),
    binary,
  };
}

function findPasswordHelper() {
  const probe = spawnSync("sshpass", ["-V"], { stdio: "ignore" });
  if (!probe.error && probe.status === 0) return { command: "sshpass", args: ["-e"] };
  return null;
}

/* ---------------------------------- main ---------------------------------- */

if (!skipBuild) build();
else console.log(`Saltando el build: uso el ${path.relative(root, outDir) || "out"} que ya existe.`);

if (!fs.existsSync(outDir)) {
  die(2, `No existe ${path.relative(root, outDir) || "out"}. Quita --skip-build para construirlo.`);
}

verify();

const files = listFiles(outDir);
const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
console.log(`\nExport listo: ${files.length} archivos, ${humanBytes(totalBytes)}.`);

if (buildOnly) {
  console.log(`Nada que subir (--build-only). El sitio está en ${path.relative(root, outDir) || "out"}.`);
  process.exit(0);
}

if (dryRun) {
  console.log("\n--dry-run: no se abre ninguna conexión. Se subiría, bajo SIMPLY_REMOTE_PATH:\n");
  for (const { rel, size } of files.slice().sort((a, b) => a.rel.localeCompare(b.rel))) {
    console.log(`  ${rel.padEnd(58)} ${humanBytes(size).padStart(9)}`);
  }
  console.log(`\n  ${files.length} archivos · ${humanBytes(totalBytes)} · ${directoriesOf(files).length} carpetas`);
  console.log(`  + ${MANIFEST_NAME} (índice sha256 para subir solo lo que cambie la próxima vez)`);

  const configured = ["SIMPLY_SSH_HOST", "SIMPLY_SSH_USER", "SIMPLY_REMOTE_PATH"].filter(
    (name) => process.env[name]
  );
  const hasAuth = Boolean(process.env.SIMPLY_SSH_KEY || process.env.SIMPLY_SSH_PASS);
  if (configured.length === 3 && hasAuth) {
    console.log(
      `\n  Destino configurado: ${process.env.SIMPLY_SSH_USER}@${process.env.SIMPLY_SSH_HOST}:${process.env.SIMPLY_REMOTE_PATH}`
    );
  } else {
    console.log(
      "\n  Aviso: todavía no hay credenciales en el entorno, así que una ejecución real saldría con código 3.\n" +
        "  Hacen falta SIMPLY_SSH_HOST, SIMPLY_SSH_USER, SIMPLY_REMOTE_PATH y SIMPLY_SSH_KEY (o SIMPLY_SSH_PASS)."
    );
  }
  console.log(
    "\n  Recuerda: .htaccess tiene que quedar en la RAÍZ del sitio publicado, junto a index.html."
  );
  process.exit(0);
}

const transport = localTarget ? localTransport(localTarget) : sftpTransport(readConfig());
if (localTarget) fs.mkdirSync(localTarget, { recursive: true });

console.log(`\nDestino: ${transport.describe()}`);
const previous = transport.readManifest();
const { upload, unchanged, stale } = planUpload(files, previous);

console.log(
  previous
    ? `Manifiesto anterior encontrado: ${Object.keys(previous).length} archivos.`
    : "Sin manifiesto previo en destino: primera subida completa."
);
console.log(`A subir: ${upload.length} · sin cambios: ${unchanged} · sobrantes: ${stale.length}${prune ? " (se borran)" : " (se conservan; usa --prune para borrarlos)"}`);

if (!upload.length && !(prune && stale.length)) {
  console.log("\nNada que hacer: el destino ya está al día.");
  process.exit(0);
}

for (const { rel, size } of upload) console.log(`  + ${rel} (${humanBytes(size)})`);
if (prune) for (const rel of stale) console.log(`  - ${rel}`);

const manifest = JSON.stringify(
  {
    generated: new Date().toISOString(),
    files: Object.fromEntries(files.map((f) => [f.rel, f.hash])),
  },
  null,
  2
);

transport.send(upload, prune ? stale : [], manifest);

console.log(
  `\nListo: ${upload.length} archivo(s) subidos${prune && stale.length ? `, ${stale.length} borrados` : ""}. ` +
    "Comprueba https://aurelservice.se/ y que las 301 antiguas siguen respondiendo."
);
