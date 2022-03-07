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
        source: '/terms',
        destination: 'https://touca.io/docs/legal/terms',
        permanent: true
      },
      {
        source: '/privacy',
        destination: 'https://touca.io/docs/legal/privacy',
        permanent: true
      }
    ];
  }
});
