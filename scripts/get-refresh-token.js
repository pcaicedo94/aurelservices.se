/**
 * One-off helper: exchanges a Google OAuth consent for the refresh token that
 * /api/booking uses to write to the calendar.
 *
 *   node --env-file=.env scripts/get-refresh-token.js
 *
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env, and
 * http://localhost:3333/callback registered as a redirect URI on the OAuth
 * client in Google Cloud Console.
 */
const http = require("http");
const { google } = require("googleapis");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3333/callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.");
  console.error("Ejecuta con: node --env-file=.env scripts/get-refresh-token.js");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/calendar"],
});

console.log("\n=== PASO 1: Abre esta URL en tu navegador ===\n");
console.log(authUrl);
console.log("\n=== Esperando callback en http://localhost:3333 ===\n");

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/callback")) {
    const url = new URL(req.url, "http://localhost:3333");
    const code = url.searchParams.get("code");

    if (code) {
      try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log("\n=== REFRESH TOKEN (copia esto al .env) ===\n");
        console.log(tokens.refresh_token);
        console.log("\n==========================================\n");

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Listo! Ya puedes cerrar esta ventana.</h1><p>Refresh token generado. Revisa la terminal.</p>");
      } catch (err) {
        console.error("Error:", err.message);
        res.writeHead(500);
        res.end("Error al obtener token");
      }
    }
    server.close();
  }
});

server.listen(3333);
