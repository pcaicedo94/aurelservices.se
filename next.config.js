/** @type {import('next').NextConfig} */

const nextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  },
};

module.exports = nextConfig;
