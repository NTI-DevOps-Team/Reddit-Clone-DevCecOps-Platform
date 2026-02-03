/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/metrics',
        destination: '/api/metrics',
      },
    ];
  },
  reactStrictMode: true,
}

module.exports = nextConfig
