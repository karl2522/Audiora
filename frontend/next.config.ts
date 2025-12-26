import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'audius-content-*.figment.io',
      },
      {
        protocol: 'https',
        hostname: '*.audius.co',
      },
      {
        protocol: 'https',
        hostname: 'cdn.audius.co',
      },
    ],
  },
};

export default nextConfig;
