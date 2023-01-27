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
        "basics/index",
        "basics/account-setup",
        "basics/submit",
        "basics/interpret",
        "basics/integrate",
        "basics/automate",
        "basics/manage-team"
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
            { type: "doc", id: "sdk/installing" },
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
        "guides/best-practices",
        "guides/vs-unit-testing",
        "guides/vs-snapshot"
      ]
    },
    { type: "html", value: "<hr />" },
    {
      type: "category",
      label: "Contributing",
      collapsed: true,
      collapsible: true,
      items: [
        "contributing/conduct",
        "contributing/index",
        "contributing/good-first-issues"
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
