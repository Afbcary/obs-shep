/** @type {import('next').NextConfig} */
const nextConfig = {
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
