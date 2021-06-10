const withPWA = require('next-pwa');

module.exports = withPWA({
  pwa: {
    dest: 'public'
  },
  future: {
    webpack5: true
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
