/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // For client-side builds, handle Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        buffer: false,
        stream: false,
        util: false,
        zlib: false,
        http: false,
        https: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@techstark/opencv-js'],
  },
  async rewrites() {
    return [
      {
        source: '/release-notes.txt',
        destination: '/release-notes.txt',
      },
      {
        source: '/release-notes.json',
        destination: '/release-notes.json',
      },
    ];
  },
};

module.exports = nextConfig; 