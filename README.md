# aurelservices.se

Sitio de Aurel Städ & Allservice AB (Next.js 15, pages router, export estático).
El dominio de producción es **https://aurelservice.se** (singular);
`aurelservices-se.vercel.app` es solo staging.

## Rutas

Las rutas están en sueco y separadas por público:

- `/tjanster/…` — particulares: precios **inkl. moms** y después del **RUT**.
  `hemstadning`, `storstadning`, `flyttstadning`, `fonsterputs`, `mattvatt`,
  `tradgardsskotsel`, `flytthjalp`, `snorojning`, más el índice `/tjanster`.
- `/foretag/…` — empresas y BRF: **exkl. moms** y **siempre offert**.
  `kontorsstadning`, `trappstadning`, `bodstadning`, `golvvard`,
  `flyttstadning`, `fonsterputs`, `byggtjanster`, más el índice `/foretag`.
- Páginas de sistema: `/om-oss`, `/kontakt`, `/karriar`, `/vanliga-fragor`,
  `/integritetspolicy`, `/allmanna-villkor`.

`flyttstadning` y `fonsterputs` existen **dos veces**, una por público: la de
`/foretag/` es exkl. moms y siempre por offert. `foretag/byggtjanster` vende
reformas con ROT; la limpieza de obra es `foretag/bodstadning`.

## Compilar y desplegar en Simply

Simply.com sirve Apache 2.4 + PHP 8 y **no ejecuta Node**: su documentación lo
dice explícitamente («you cannot run NodeJS applications that require
server-side rendering or that listen on ports (SSR)… only possible to host
static websites (SSG)») y nombra a Next. El artefacto de producción es, por
tanto, HTML plano.

Hay **dos modos de compilación**, controlados por una sola variable:

| Comando | `NEXT_PUBLIC_STATIC_EXPORT` | Resultado |
| --- | --- | --- |
| `npx next dev` / `npm run build` | sin poner | app de Node en `.next/`, con `/api/booking` y `/api/contact` |
| `npm run export` / `npm run deploy` | `1` | HTML estático en `out/`, sin rutas de API |

`next.config.js` solo añade `output: 'export'`, `trailingSlash: true` e
`images.unoptimized: true` cuando la variable vale `1`, y `config/seo.js` lee la
misma variable para decidir si los `canonical` llevan barra final. Así el
servidor de desarrollo, `APP_TEST_MODE=1` y las suites de QA siguen teniendo las
rutas de `pages/api/`, que necesitan.

Con `trailingSlash: true` cada página cae en **su propia carpeta con
`index.html`** (`/tjanster/hemstadning/index.html`), que es lo que Apache sirve
por `mod_dir` sin ninguna regla de reescritura. Por eso los `canonical` y el
`sitemap.xml` del export llevan barra final: es la URL real en el servidor.

Next 15.5 **no falla** el build por tener `pages/api/*` junto a
`output: 'export'`; avisa («Statically exporting a Next.js application … disables
API routes and middleware») y exporta las 26 páginas igual. Las dos rutas de API
simplemente **no existen en el sitio estático**: en Simply los endpoints de
reserva y contacto los tiene que servir el host (PHP).
`scripts/check-export.mjs` comprueba que `out/` no contenga `api/`, para que eso
no se convierta en un sitio medio roto sin que nadie se dé cuenta.

### Comandos

```bash
npm run export      # sitemap + build estático + verificación. Deja el sitio en out/
npm run check:export # vuelve a verificar un out/ ya construido
npm run deploy:dry  # todo lo anterior y lista qué subiría. No se conecta a nada
npm run deploy      # todo lo anterior y sincroniza por SFTP
```

`scripts/deploy-simply.mjs` acepta además `--skip-build` (reutiliza `out/`),
`--dir=<carpeta>`, `--prune` (borra en destino lo que subió antes y ya no
existe) y `--local=<carpeta>` para ensayar la sincronización contra una carpeta
local sin tocar el servidor. Códigos de salida: `0` bien, `1` el export no pasa
la verificación, `2` falló el build, `3` configuración o credenciales
inservibles, `4` falló la transferencia.

### Variables de entorno del despliegue

**Nunca se guardan en el repo.** Expórtalas en tu shell antes de desplegar; el
script no lee `.env`.

| Variable | Para qué |
| --- | --- |
| `SIMPLY_SSH_HOST` | host SSH de la cuenta de Simply |
| `SIMPLY_SSH_USER` | usuario SSH |
| `SIMPLY_REMOTE_PATH` | ruta **absoluta** del sitio publicado, p. ej. `/public_html` |
| `SIMPLY_SSH_KEY` | clave privada (recomendado) |
| `SIMPLY_SSH_PASS` | contraseña; alternativa a la clave |
| `SIMPLY_SSH_PORT` | opcional, 22 por defecto |
| `SIMPLY_SFTP_BIN` | opcional, ruta del binario `sftp` |

Si falta alguna, el script lo explica y sale con código `3` en vez de lanzar una
excepción. Con `SIMPLY_SSH_PASS` hace falta además `sshpass`: el cliente `sftp`
de OpenSSH no acepta contraseñas desde un script, así que lo normal es generar
una clave (`ssh-keygen -t ed25519`), subir la pública al panel de Simply y usar
`SIMPLY_SSH_KEY`.

Desde Git Bash en Windows, exporta las rutas con `MSYS_NO_PATHCONV=1` o la shell
convertirá `/public_html` en `C:/Program Files/Git/public_html` (el script lo
detecta y aborta, pero es más cómodo evitarlo).

### Qué se sube y dónde

Se sube **el contenido de `out/`** (134 archivos, ~26 MB: 26 HTML, `_next/`,
`images/`, `fonts/`, `favicon.ico`, `robots.txt`, `sitemap.xml` y `.htaccess`)
dentro de `SIMPLY_REMOTE_PATH`, conservando la estructura de carpetas.

> **`.htaccess` tiene que quedar en la RAÍZ del sitio publicado**, al lado de
> `index.html`. Next copia `public/` tal cual a la raíz del export, así que si
> se sube `out/` completo queda en su sitio; si se sube solo una subcarpeta,
> Apache no lo lee y las 301 de las rutas antiguas devuelven 404.

El despliegue es **idempotente**: cada subida deja en la raíz remota un
`.aurel-deploy-manifest.json` con el sha256 de cada archivo, y la siguiente
ejecución lo descarga y sube solo lo que cambió (ejecutarlo dos veces seguidas
no transfiere nada). `--prune` borra únicamente lo que este script subió antes y
el export ya no contiene, así que no toca los archivos PHP ni nada más que viva
en el servidor.

### Verificación del export

`scripts/check-export.mjs` corre dentro del despliegue y también por separado.
Comprueba que las 26 páginas estén donde Apache las busca, que `.htaccess`,
`robots.txt`, `sitemap.xml` y `favicon.ico` estén en la raíz, que cada página
lleve su `<title>` de `config/seo.js` y su `canonical` absoluto en la forma con
barra final, que ningún `href`/`src` interno apunte a algo que el export no
contiene (los enlaces a las rutas antiguas en inglés salen como aviso, porque
`.htaccess` los resuelve con una 301) y que cada `<loc>` del sitemap exista.
Falla con código `1` y el despliegue no sube nada.

## Redirecciones 301 (`public/.htaccess`)

El sitio se sirve con Apache en Simply, así que las 301 de las rutas antiguas
en inglés viven en **`public/.htaccess`** (23 reglas `RedirectMatch`, cada una
con y sin barra final: 46 URLs). Next copia `public/` tal cual, de modo que
**ese archivo debe acabar en la raíz del sitio publicado**, junto a
`index.html`, y no dentro de una subcarpeta: si no, Apache no lo lee y las URLs
antiguas devuelven 404.

No se usa `redirects()` de `next.config.js` a propósito: no funciona con el
export estático y daría una falsa sensación de que las 301 están cubiertas.

## SEO

- `config/seo.js` es la única fuente de los metadatos: un mapa `ruta → { title,
  description, keywords, image, service }` en sueco, más los datos reales de la
  empresa usados en el JSON-LD.
- `components/Common/Seo.js` los emite con `next/head`: `title`, `meta
  description`, `canonical` absoluto, Open Graph, Twitter card y el JSON-LD de
  la ruta. Cada página de `pages/` (salvo `_app`, `_document` y `api/*`) monta
  `<Seo route="/la-ruta" />` como primer hijo.
- No se declaran horarios, reseñas, `aggregateRating` ni precios en el JSON-LD:
  no están confirmados por el cliente y marcar reseñas falsas es motivo de
  penalización manual de Google.
- `TRAILING_SLASH` sale de `NEXT_PUBLIC_STATIC_EXPORT`, igual que
  `trailingSlash` en `next.config.js`: en el export para Simply la URL real de
  cada página acaba en barra (`/kontakt/`), así que el `canonical` la lleva; en
  el build de Node se queda como siempre (`/kontakt`). La variable es
  `NEXT_PUBLIC_` justamente para que Next la incruste también en el bundle del
  navegador: este módulo también pinta el `canonical` al hidratar, y una
  variable solo de servidor daría un `href` distinto en el cliente.

## Sitemap

El sitio se exporta estático, así que `public/sitemap.xml` se genera **antes**
de compilar:

```bash
node scripts/build-sitemap.mjs   # escribe public/sitemap.xml
npx next build
```

El script recorre `pages/` (omite `api/`, `_app`, `_document` y `404`), usa
`SITE_URL` de `config/seo.js`, aplica la misma regla de `trailingSlash` que
`next.config.js` (y aborta si ambos no coinciden) y falla si alguna página no
tiene metadatos en `config/seo.js`. `public/robots.txt` apunta a ese sitemap.

Ojo con la variable del export: hay que generar el sitemap **con la misma**
`NEXT_PUBLIC_STATIC_EXPORT` que el build, porque de ella depende la barra final
de las URLs. `npm run export` y `npm run deploy` ya lo hacen en el mismo paso;
si lo lanzas a mano sin la variable y luego construyes el export, las URLs del
sitemap no coincidirán con las páginas y `scripts/check-export.mjs` lo rechaza.
La copia versionada de `public/sitemap.xml` es la del build de Node (sin barra
final): es un artefacto que se regenera en cada compilación.

## QA

Ver `scripts/qa-browser/README.md`.
