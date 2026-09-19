# aurelservices.se

Sitio de Aurel Städ & Allservice AB (Next.js 15, pages router, export estático).
El dominio de producción es **https://aurelservice.se** (singular);
`aurelservices-se.vercel.app` es solo staging.

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
