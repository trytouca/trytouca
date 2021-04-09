module.exports = {
  future: {
    webpack5: true
  },
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/docs',
        destination: 'https://docs.getweasel.com/',
        permanent: true
      }
    ];
  }
};
