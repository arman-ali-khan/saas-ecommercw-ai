import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allowed origins for cross-origin requests in dev environments
  allowedDevOrigins: [
    '9000-firebase-studio-1770463079853.cluster-aic6jbiihrhmyrqafasatvzbwe.cloudworkstations.dev',
    '*.cloudworkstations.dev'
  ] as any,
  experimental: {
    // Optimize heavy library imports to reduce bundle size
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', 'date-fns', 'clsx', 'tailwind-merge'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'woocommercecore.mystagingwebsite.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
