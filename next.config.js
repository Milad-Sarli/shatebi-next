/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.shatebiapp.ir',
        port: '',
        pathname: '/public/assets/images/**', // Adjusted to match the new path structure
      },
    ],
  },
};

module.exports = nextConfig; 