# QA de navegador

Suite de pruebas en Chrome headless que sirve de puerta de calidad antes de integrar cambios. Usa solo Node 22 (`fetch` y `WebSocket` globales) y el Chrome instalado: no necesita dependencias.

## Ejecutar

```bash
node scripts/qa-browser/run.mjs --url=http://localhost:3100 --suite=all --out=<carpeta-fuera-del-repo>
```

| Opción | Uso |
| --- | --- |
| `--suite` | `all`, `smoke`, `calculators`, `booking`, `quote`, `a11y`, `nav` o varias separadas por comas |
| `--out` | capturas de los fallos (`shots/`), `report.json` y el perfil temporal de Chrome. Se niega a escribir dentro del repo |
| `--port` | puerto CDP de Chrome (9609 por defecto). Si ya está ocupado, aborta en lugar de conectarse a otro navegador |
| `--grep` | ejecuta solo las pruebas cuyo nombre o ID de bug contenga el texto, p. ej. `--grep=QA-02` |
| `--routes` | limita la suite smoke, p. ej. `--routes=services,contact` (sin barra inicial: Git Bash convierte `/services` en una ruta de Windows; la portada es `/`) |
| `--timeout` | tiempo máximo por prueba en ms (90000) |

Cada prueba imprime `PASS`, `FAIL` o `ERROR` (la prueba no pudo completarse, p. ej. un selector desaparecido). Al final hay un resumen por suite y por bug. El proceso sale con código 1 si algo falla o si alguna petición llegó a la API real, y con 2 si no pudo arrancar. La suite `all` tarda unos 10 minutos contra el servidor de desarrollo.

Las pruebas describen el **comportamiento correcto**, no el actual. Un `FAIL` con ID (`{QA-03}`) es un bug conocido pendiente; las pruebas marcadas `(control)` validan que la suite detecta bien lo que ya funciona y deben pasar siempre.

## Qué intercepta

- **`/api/*` nunca llega al servidor.** Cada pestaña, popup, iframe o worker se adjunta en pausa y se le activa `Fetch.enable` (patrón `*api/*`) antes de que pueda enviar nada. Las peticiones a `/api/...` del servidor probado, de cualquier host local o de `aurelservice(s).se` se responden con `Fetch.fulfillRequest` o `Fetch.failRequest`; las de terceros que casen con el patrón se dejan pasar.
- Las respuestas simuladas llevan la cabecera `x-qa-mock`. Si el dominio Network ve una respuesta de `/api/*` sin ella, o una petición que Fetch no pausó, se cuenta como petición real y la ejecución termina en FAIL (`[seguridad]`).
- Escenarios (`lib/api-guard.mjs`): `ok` (200), `bad-request` (400, por defecto), `conflict` (409), `server-error` (500 JSON), `server-error-html` (500 HTML), `offline` (conexión rechazada) y `slow` (200 tras 2,5 s). Una prueba puede pasar también una función propia.
- Los `alert()` se aceptan solos y quedan en `page.dialogs`. Las pestañas nuevas se cierran nada más crearse.
- El registro de consola ignora avisos de dependencias solo de desarrollo (`defaultProps` de react-tabs) y no evalúa errores de terceros; ambos aparecen como nota.

## Estructura

```
run.mjs            CLI, resumen y código de salida
lib/chrome.mjs     arranque y cierre de Chrome (perfil dentro de --out)
lib/cdp.mjs        cliente CDP sobre WebSocket con sesiones planas
lib/browser.mjs    pestaña de pruebas: navegación con espera de hidratación, clics y teclas reales, capturas
lib/in-page.mjs    window.__qa: visibilidad, relleno de inputs de React, contraste WCAG
lib/api-guard.mjs  interceptación de /api/*, escenarios y contador de peticiones reales
lib/console-log.mjs errores de consola, excepciones y peticiones fallidas
lib/flows.mjs      flujos del sitio: calculadoras, formulario de contacto, avisos tras enviar
lib/dates.mjs      fechas de Estocolmo (laborables sin festivos, fin de semana, pasado)
lib/runner.mjs     registro de pruebas, PASS/FAIL, report.json
suites/*.mjs       smoke, calculators, booking, quote, a11y, nav
```

## Añadir pruebas

```js
// suites/nav.mjs (dentro de defineSuite("nav", async (test, ctx) => { ... }))
test("el logo lleva a la portada", { bug: "QA-99" }, async ({ page, api, expect, note }) => {
  await page.goto("/contact");                 // espera a que React hidrate
  api.setScenario("conflict");                 // opcional: respuesta de /api/*
  await page.click({ selector: "a", text: "^Kontakta oss$", within: "#navbar" }); // clic real
  const href = await page.eval(() => document.querySelector("#navbar .navbar-brand").getAttribute("href"));
  expect(href === "/", `href="${href}"`);      // cada expect fallido suma un detalle
  note("dato informativo");
});
```

- `page.eval(fn, ...args)` ejecuta `fn` en la página; debe ser autocontenida y puede usar `window.__qa`.
- Rellena inputs con `page.setValue(selector, valor)` / `page.setChecked`, nunca asignando `.value`: React no se enteraría.
- Para flujos de reserva usa `attemptBooking` y `fillContact` de `lib/flows.mjs`; `bookable` solo es cierto si salió un POST a `/api/booking`.
- Cada prueba empieza en escritorio 1440×900, con el escenario `bad-request` y en una página en blanco; si falla, se guarda una captura.
- Una suite nueva se registra en el objeto `SUITES` de `run.mjs`.
