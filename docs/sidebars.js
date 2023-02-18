// @ts-check
/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    {
      type: "category",
      label: "Getting Started",
      collapsed: true,
      collapsible: true,
      items: [
        { type: "doc", id: "index", label: "Introduction" },
        "basics/index",
        "basics/submit",
        "basics/automate",
        "basics/interpret"
      ]
    },
    { type: "html", value: "<hr />" },
    {
      type: "category",
      label: "CLI",
      collapsed: true,
      collapsible: true,
      items: [
        { type: "doc", id: "cli/index", label: "Installing" },
        "cli/config",
        "cli/test",
        "cli/results",
        "cli/server",
        "cli/plugin"
      ]
    },
    {
      type: "category",
      label: "SDKs",
      collapsed: true,
      collapsible: true,
      items: [
        "sdk/installing",
        "sdk/configuring",
        "sdk/main-api",
        "sdk/testcases",
        "sdk/capturing",
        "sdk/differences",
        "sdk/core-api",
        "sdk/cli",
        "sdk/errors",
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
              label: "Java",
              href: "https://touca.io/docs/external/sdk/java/index.html"
            },
            {
              type: "link",
              label: "JavaScript",
              href: "https://touca.io/docs/external/sdk/js/index.html"
            }
          ]
        }
      ]
    },
    {
      type: "category",
      label: "Server",
      collapsed: true,
      collapsible: true,
      items: [
        "server/self-hosting",
        "server/account-setup",
        "server/teams",
        "server/integrations",
        "server/keyboard-shortcuts",
        "server/environment-variables",
        "server/telemetry",
        "server/settings",
        "server/pricing",
        {
          type: "link",
          label: "REST API",
          href: "https://touca.io/docs/external/api/index.html"
        }
      ]
    },
    { type: "html", value: "<hr />" },
    {
      type: "category",
      label: "Guides",
      collapsed: true,
      collapsible: true,
      items: ["guides/vs-unit-testing", "guides/vs-snapshot"]
    },
    {
      type: "category",
      label: "Contributing",
      collapsed: true,
      collapsible: true,
      items: [
        "contributing/conduct",
        "contributing/index",
        "contributing/good-first-issues",
        "contributing/project-structure",
        "contributing/development-setup",
        "contributing/non-code-contributions"
      ]
    },
    {
      type: "category",
      label: "Legal",
      collapsed: true,
      collapsible: true,
      items: ["legal/terms", "legal/privacy"]
    }
  ]
};

module.exports = sidebars;
