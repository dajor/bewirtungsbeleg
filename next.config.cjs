/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
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