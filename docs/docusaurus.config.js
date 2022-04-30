// @ts-check
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Touca Docs",
  tagline: "Developer-friendly Continuous Regression Testing",
  url: "https://touca.io",
  baseUrl: "/docs/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "trytouca",
  projectName: "touca-docs",
  trailingSlash: true,
  scripts: [
    {
      src: "/js/script.js",
      defer: true,
      "data-domain": "touca.io"
    }
  ],
  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl: "https://github.com/trytouca/touca-docs/tree/main/"
        },
        blog: false,
        theme: {
          customCss: require.resolve("./src/css/custom.css")
        }
      })
    ]
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      metadata: [
        {
          name: "description",
          content:
            "Touca is a continuous regression testing solution that helps software engineering teams gain confidence in their daily code changes."
        },
        {
          name: "og:title",
          content: "Developer-friendly Continuous Regression Testing"
        },
        {
          name: "og:description",
          content:
            "Touca is a continuous regression testing solution that helps software engineering teams gain confidence in their daily code changes."
        },
        { name: "og:url", content: "https://touca.io/docs" },
        { name: "og:type", content: "website" },
        {
          name: "og:image",
          content: "https://touca.io/images/touca_open_graph_image.png"
        },
        {
          name: "og:image:alt",
          content: "Developer-friendly Continuous Regression Testing"
        },
        { name: "og:image:type", content: "image/png" },
        { name: "og:image:width", content: "906" },
        { name: "og:image:height", content: "453" },
        { name: "og:locale", content: "en_US" },
        { name: "og:site_name", content: "Touca Docs" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@trytouca" },
        { name: "twitter:creator", content: "@heypejman" },
        { name: "theme-color", content: "#1f2937" },
        { name: "robots", content: "index,follow" },
        { name: "keywords", content: "documentation, regression testing" }
      ],
      navbar: {
        title: "Touca Docs",
        logo: {
          alt: "Touca Logo",
          src: "img/logo.svg",
          href: "https://touca.io"
        },
        items: [
          {
            href: "https://twitter.com/trytouca",
            position: "right",
            className: "header-twitter-link",
            "aria-label": "Touca on Twitter"
          },
          {
            href: "https://github.com/trytouca",
            position: "right",
            className: "header-github-link",
            "aria-label": "Touca on GitHub"
          }
        ]
      },
      footer: {
        style: "light",
        links: [],
        copyright: `Copyright ${new Date().getFullYear()} Touca, Inc.`
      },
      prism: {
        additionalLanguages: ["java"],
        theme: require("prism-react-renderer/themes/github"),
        darkTheme: require("prism-react-renderer/themes/dracula")
      }
    })
};

module.exports = config;
