/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'api.hostgpt.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RvIkEClR9LCJ8qEoUtyWAuMsvFnoV7J9XcduJPrKkU1AarCoxmgWZ9ASBp2SDr7NmZStcSEwnrCFoeQ3WLyIOKj00U3ATcV5z',
  },
  async redirects() { return [] },
}

module.exports = nextConfig
