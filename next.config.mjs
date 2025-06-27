/** @type {import('next').NextConfig} */
const nextConfig = {
    // COMMENT FOR LOCAL DEV
    // UNCOMMENT TO PREPARE STATIC DEPLOYMENT (npm run build)
    output: 'export',
    async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://www.ultirzr.app/api/:path*', // The external API endpoint
      },
    ]
  },
};

export default nextConfig;
