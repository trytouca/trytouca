const runtimeCaching = require('next-pwa/cache');
const withPWA = require('next-pwa')({
  dest: 'public',
  runtimeCaching,
  buildExcludes: [/middleware-manifest.json$/]
});

module.exports = withPWA({
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
        destination: '/changelog/220617/',
        permanent: true
      },
      {
        source: '/blog/changelog-220429/',
        destination: '/changelog/220429/',
        permanent: true
      },
      {
        source: '/blog/changelog-220408/',
        destination: '/changelog/220408/',
        permanent: true
      },
      {
        source: '/blog/changelog-220401/',
        destination: '/changelog/220401/',
        permanent: true
      },
      {
        source: '/blog/changelog-220318/',
        destination: '/changelog/220318/',
        permanent: true
      },
      {
        source: '/blog/changelog-220311/',
        destination: '/changelog/220311/',
        permanent: true
      },
      {
        source: '/blog/product-updates-february-2022/',
        destination: '/changelog/220301/',
        permanent: true
      },
      {
        source: '/blog/product-updates-december-2021/',
        destination: '/changelog/220104/',
        permanent: true
      },
      {
        source: '/blog/product-updates-november-2021/',
        destination: '/changelog/211203/',
        permanent: true
      },
      {
        source: '/blog/product-updates-october-2021/',
        destination: '/changelog/211101/',
        permanent: true
      },
      {
        source: '/blog/product-updates-september-2021/',
        destination: '/changelog/210930/',
        permanent: true
      },
      {
        source: '/blog/product-updates-august-2021/',
        destination: '/changelog/210825/',
        permanent: true
      }
    ];
  }
});
