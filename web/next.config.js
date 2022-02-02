const withPWA = require('next-pwa');
const runtimeCaching = require('next-pwa/cache');

module.exports = withPWA({
  pwa: {
    dest: 'public',
    runtimeCaching,
    buildExcludes: [/middleware-manifest.json$/]
  },
  poweredByHeader: false,
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
  async redirects() {
    return [
      {
        source: '/docs',
        destination: 'https://docs.touca.io/',
        permanent: true
      },
      {
        source: '/terms',
        destination: 'https://docs.touca.io/legal/terms',
        permanent: true
      },
      {
        source: '/privacy',
        destination: 'https://docs.touca.io/legal/privacy',
        permanent: true
      }
    ];
  }
});
