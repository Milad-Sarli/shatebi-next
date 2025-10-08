/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'test.bikerasol.ir',
        port: '',
        pathname: '/shatebi/**', // Updated to match the actual storage path structure
      },
    ],
  },
}; 

module.exports = nextConfig;