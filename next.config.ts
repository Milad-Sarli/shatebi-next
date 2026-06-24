import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "admin.shatebiapp.ir",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "admin-shatebiapp.test",
        pathname: "/storage/**",
      },
      {
        protocol: 'https',
        hostname: 'galaxe.bikerasol.ir',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'test.bikerasol.ir',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'test.bikerasol.ir',
        pathname: '/shatebi/**',
      },
    ],
  },
};

export default nextConfig;
