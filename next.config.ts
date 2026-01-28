import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  // Disable static file serving from public for HTML files
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    }
  },
  
  // Ensure proper routing
  async redirects() {
    return []
  },
  
  // Add cache headers to prevent stale content
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },
  
  // Ignore HTML files in public directory for routing
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Ensure proper base path
  basePath: '',
  
  // Enable strict mode for better error handling
  reactStrictMode: true,
};

export default nextConfig;
