/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/release-notes.txt',
        destination: '/release-notes.txt',
      },
    ];
  },
};

module.exports = nextConfig; 