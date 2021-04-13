module.exports = {
  basePath: '/web',
  future: {
    webpack5: true
  },
  env: {
    basePath: '/web'
  },
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/docs',
        destination: 'https://docs.getweasel.com/',
        permanent: true
      },
      {
        source: '/terms',
        destination: 'https://docs.getweasel.com/legal/terms',
        permanent: true
      },
      {
        source: '/privacy',
        destination: 'https://docs.getweasel.com/legal/privacy',
        permanent: true
      }
    ];
  }
};
