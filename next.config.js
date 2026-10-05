/** @type {import('next').NextConfig} */

// Note: do not add an `env` block here. Next inlines those values into the
// client bundle, so a server-only secret placed there would be published.
// Server code reads process.env directly; anything the browser may see is
// prefixed NEXT_PUBLIC_.

// ---------------------------------------------------------------------------
// Build mode: Node app (default) vs static export for Simply.com
// ---------------------------------------------------------------------------
// Simply.com hosts Apache 2.4 + PHP 8 and cannot run Node, so the production
// artefact has to be plain HTML. `NEXT_PUBLIC_STATIC_EXPORT=1 next build`
// produces it in out/; without the flag `next build` and `next dev` behave
// exactly as before.
//
// Why a flag instead of keying off NODE_ENV: `next dev`, `APP_TEST_MODE=1` and
// the QA suites (scripts/qa-booking.mjs, scripts/qa-browser/) all need the two
// API routes in pages/api/, and the browser suite asserts on link hrefs without
// a trailing slash. Flipping the whole repo to export mode would take both away.
//
// The flag is NEXT_PUBLIC_ on purpose: config/seo.js reads the same variable to
// decide whether canonical URLs carry a trailing slash, and that module runs in
// the browser too. A non-public name would be inlined on the server only and
// the canonical link would differ between the exported HTML and the hydrated
// page.
//
// API routes and `output: 'export'`: Next 15.5.12 does NOT fail the build when
// pages/api/* exists. It prints
//   "Statically exporting a Next.js application via `next export` disables API
//    routes and middleware."
// and exports the 26 pages anyway (verified: exit 0, 26/26 exported). The
// routes are simply absent from out/, which is exactly what we want — on Simply
// /api/booking and /api/contact are served by PHP, not by Node.
// scripts/check-export.mjs asserts that out/ has no api/ directory, so this
// cannot regress into a half-static site without anyone noticing.
// If a future Next release turns that warning into an error, the fix is the
// `pageExtensions` route: rename the real pages to *.page.js and set
//   pageExtensions: staticExport ? ["page.js", "page.jsx"] : ["page.js", "page.jsx", "js", "jsx"]
// so that pages/api/*.js stops being scanned as a page at all. It is not done
// today because it would rename 25 files that scripts/qa-pricing.mjs and
// scripts/qa-browser/suites/smoke.mjs address by path, for no present gain.
const staticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

const nextConfig = {
  reactStrictMode: true,

  ...(staticExport
    ? {
        // Write plain HTML to out/ instead of starting a Node server.
        output: "export",
        // One directory per route holding its own index.html
        // (/tjanster/hemstadning/index.html). Apache serves that through
        // mod_dir with no rewrite rule; the alternative layout would need one.
        // scripts/build-sitemap.mjs reads this value and refuses to run if
        // config/seo.js disagrees about it.
        trailingSlash: true,
        // No Node process on the host, so there is nothing to optimise images
        // on request: ship them as they are.
        images: { unoptimized: true },
      }
    : {}),
};

module.exports = nextConfig;
