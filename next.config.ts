import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Fix for cross-origin requests in Cloud Workstations / Firebase Studio environment
  // Using 'any' cast because the type definition might not include it yet in all environments
  allowedDevOrigins: [
    '9000-firebase-studio-1770463079853.cluster-aic6jbiihrhmyrqafasatvzbwe.cloudworkstations.dev',
    '*.cloudworkstations.dev'
  ] as any,
  experimental: {
<<<<<<< HEAD
    ppr: 'incremental',
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      'date-fns',
      'clsx',
      'tailwind-merge'
    ],
=======
    // Optimize heavy library imports to reduce bundle size
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', 'date-fns'],
>>>>>>> 014ea8e640b02e8dad251a05e704584869867d45
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
      },
    ],
  },
};

export default nextConfig;
