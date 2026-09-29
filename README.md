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

## QA

Ver `scripts/qa-browser/README.md`.
