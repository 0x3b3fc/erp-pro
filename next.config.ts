import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Enable experimental features
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react'],
  },
  // Disable service worker if not needed
  // This prevents service worker registration issues
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignore service worker files if they exist
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
