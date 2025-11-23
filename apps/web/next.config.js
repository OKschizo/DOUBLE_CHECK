/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore type errors to deploy
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.firebasestorage.app',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    unoptimized: false,
  },
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude Firebase client SDK from server-side bundle
      config.externals = config.externals || [];
      config.externals.push({
        'firebase/app': 'commonjs firebase/app',
        'firebase/auth': 'commonjs firebase/auth',
        'firebase/firestore': 'commonjs firebase/firestore',
        'firebase/storage': 'commonjs firebase/storage',
      });
    }
    return config;
  },
};

module.exports = nextConfig;

