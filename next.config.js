/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'test.bikerasol.ir',
        port: '',
        pathname: '/storage/**', // Pattern to match /storage/ paths
      },
      {
        protocol: 'https',
        hostname: 'test.bikerasol.ir',
        port: '',
        pathname: '/shatebi/**', // Pattern to match /shatebi/ paths
      },
    ],
  },
}; 

module.exports = nextConfig;