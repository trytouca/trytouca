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
  trailingSlash: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
  async redirects() {
    return [
      {
        source: '/blog/changelog-220617/',
        destination: '/changelog/changelog-220617/',
        permanent: true
      },
      {
        source: '/blog/changelog-220429/',
        destination: '/changelog/changelog-220429/',
        permanent: true
      },
      {
        source: '/blog/changelog-220408/',
        destination: '/changelog/changelog-220408/',
        permanent: true
      },
      {
        source: '/blog/changelog-220401/',
        destination: '/changelog/changelog-220401/',
        permanent: true
      },
      {
        source: '/blog/changelog-220318/',
        destination: '/changelog/changelog-220318/',
        permanent: true
      },
      {
        source: '/blog/changelog-220311/',
        destination: '/changelog/changelog-220311/',
        permanent: true
      },
      {
        source: '/blog/product-updates-february-2022/',
        destination: '/changelog/product-updates-february-2022/',
        permanent: true
      },
      {
        source: '/blog/product-updates-december-2021/',
        destination: '/changelog/product-updates-december-2021/',
        permanent: true
      },
      {
        source: '/blog/product-updates-november-2021/',
        destination: '/changelog/product-updates-november-2021/',
        permanent: true
      },
      {
        source: '/blog/product-updates-october-2021/',
        destination: '/changelog/product-updates-october-2021/',
        permanent: true
      },
      {
        source: '/blog/product-updates-september-2021/',
        destination: '/changelog/product-updates-september-2021/',
        permanent: true
      },
      {
        source: '/blog/product-updates-august-2021/',
        destination: '/changelog/product-updates-august-2021/',
        permanent: true
      }
    ];
  }
});
