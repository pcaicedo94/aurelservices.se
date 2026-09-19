/** @type {import('next').NextConfig} */

// Note: do not add an `env` block here. Next inlines those values into the
// client bundle, so a server-only secret placed there would be published.
// Server code reads process.env directly; anything the browser may see is
// prefixed NEXT_PUBLIC_.
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
