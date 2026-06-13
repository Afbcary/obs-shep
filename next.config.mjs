// Fix for environment where global.localStorage is mocked as an empty object
if (typeof global !== 'undefined' && global.localStorage && !global.localStorage.getItem) {
  delete global.localStorage;
}

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
