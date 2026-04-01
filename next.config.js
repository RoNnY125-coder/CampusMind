/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["groq-sdk"],
  env: {
    // Only explicitly whitelisted vars go to the client bundle.
    // Server secrets are intentionally excluded.
  },
};

module.exports = nextConfig;
