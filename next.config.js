/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.shatebiapp.ir',
        port: '',
        pathname: '/storage/**', // Adjusted to match the new path structure
      },
    ],
  },
};

module.exports = nextConfig; 