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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  // Enable compression for better performance
  compress: true,
  // Enable experimental features for better SEO
  experimental: {
    // optimizeCss: true, // Removed to avoid critters dependency
  },
  // Optimize build output
  output: 'standalone',
  // Enable static optimization
  trailingSlash: false,
  // Optimize images
  images: {
    domains: ['localhost', 'api.ospiterai.it'],
    formats: ['image/webp', 'image/avif'],
  },
}

module.exports = nextConfig
