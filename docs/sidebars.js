// @ts-check
/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    { id: "index", type: "doc" },
    {
      type: "category",
      label: "Getting Started",
      collapsed: false,
      collapsible: false,
      items: [
        { type: "doc", id: "basics/index" },
        { type: "doc", id: "basics/account-setup" },
        { type: "doc", id: "basics/submit" },
        { type: "doc", id: "basics/interpret" },
        { type: "doc", id: "basics/integrate" },
        { type: "doc", id: "basics/automate" },
        { type: "doc", id: "basics/manage-team" }
      ]
    },
    { type: "html", value: "<hr />" },
    {
      type: "category",
      label: "Product",
      collapsed: false,
      collapsible: false,
      items: [
        { type: "doc", id: "cli/index", label: "CLI" },
        {
          type: "category",
          label: "SDKs",
          collapsed: false,
          collapsible: true,
          items: [
            {
              type: "category",
              label: "Installing",
              items: [
                { type: "doc", id: "sdk/installing/cpp", label: "C++" },
                { type: "doc", id: "sdk/installing/java", label: "Java" }
              ]
            },
            { type: "doc", id: "sdk/main-api", label: "Getting Started" },
            { type: "doc", id: "sdk/testcases" },
            { type: "doc", id: "sdk/capturing" },
            { type: "doc", id: "sdk/differences" },
            { type: "doc", id: "sdk/core-api" },
            { type: "doc", id: "sdk/cli" },
            {
              type: "category",
              label: "API Reference",
              items: [
                {
                  type: "link",
                  label: "Python",
                  href: "https://touca.io/docs/external/sdk/python/index.html"
                },
                {
                  type: "link",
                  label: "C++",
                  href: "https://touca.io/docs/external/sdk/cpp/index.html"
                },
                {
                  type: "link",
                  label: "JavaScript",
                  href: "https://touca.io/docs/external/sdk/js/index.html"
                },
                {
                  type: "link",
                  label: "Java",
                  href: "https://touca.io/docs/external/sdk/java/index.html"
                }
              ]
            }
          ]
        },
        {
          type: "category",
          label: "Server",
          collapsed: false,
          collapsible: true,
          items: [
            { type: "doc", id: "server/self-hosting" },
            { type: "doc", id: "server/keyboard-shortcuts" },
            { type: "doc", id: "server/environment-variables" },
            { type: "doc", id: "server/telemetry" },
            { type: "doc", id: "server/pricing" },
            {
              type: "link",
              label: "REST API",
              href: "https://touca.io/docs/external/api/index.html"
            }
          ]
        }
      ]
    },
    { type: "html", value: "<hr />" },
    {
      type: "category",
      label: "Guides",
      collapsed: false,
      collapsible: false,
      items: [
        { type: "doc", id: "guides/best-practices" },
        { type: "doc", id: "guides/vs-unit-testing" },
        { type: "doc", id: "guides/vs-snapshot" }
      ]
    },
    { type: "html", value: "<hr />" },
    {
      type: "category",
      label: "Contributing",
      collapsed: true,
      collapsible: true,
      items: [
        { type: "doc", id: "contributing/conduct" },
        { type: "doc", id: "contributing/index" },
        { type: "doc", id: "contributing/good-first-issues" }
      ]
    },
    {
      type: "category",
      label: "Legal",
      collapsed: true,
      collapsible: true,
      items: [
        { type: "doc", id: "legal/terms", label: "Terms of Service" },
        { type: "doc", id: "legal/privacy" }
      ]
    }
  ]
};

module.exports = sidebars;
