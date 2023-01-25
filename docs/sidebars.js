// @ts-check
/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    {
      type: "category",
      label: "Getting Started",
      collapsed: false,
      collapsible: false,
      items: [
        {
          type: "doc",
          id: "Readme",
          label: "Welcome"
        },
        {
          type: "doc",
          id: "basics/Readme",
          label: "Quick Start"
        },
        {
          type: "doc",
          id: "basics/account-setup",
          label: "Setting Up Your Account"
        },
        {
          type: "doc",
          id: "basics/submit",
          label: "Your First Touca Test"
        },
        {
          type: "doc",
          id: "basics/interpret",
          label: "Interpret Results"
        },
        {
          type: "doc",
          id: "basics/integrate",
          label: "Manage Notifications"
        },
        {
          type: "doc",
          id: "basics/automate",
          label: "Automate Your Tests"
        },
        {
          type: "doc",
          id: "basics/manage-team",
          label: "Manage Your Team"
        }
      ]
    },
    {
      type: "html",
      value: "<hr />"
    },
    {
      type: "category",
      label: "Product",
      collapsed: false,
      collapsible: false,
      items: [
        {
          type: "doc",
          id: "cli/Readme",
          label: "CLI"
        },
        {
          type: "category",
          label: "SDKs",
          collapsed: true,
          collapsible: true,
          link: { type: "doc", id: "sdk/Readme" },
          items: [
            {
              type: "category",
              label: "Python",
              items: [
                {
                  type: "doc",
                  id: "sdk/python/main-api",
                  label: "Main API"
                },
                {
                  type: "doc",
                  id: "sdk/python/core-api",
                  label: "Core API"
                },
                {
                  type: "link",
                  label: "API Reference",
                  href: "https://touca.io/docs/external/sdk/python/index.html"
                }
              ]
            },
            {
              type: "category",
              label: "C++",
              items: [
                {
                  type: "doc",
                  id: "sdk/cpp/building",
                  label: "Building"
                },
                {
                  type: "doc",
                  id: "sdk/cpp/installing",
                  label: "Installing"
                },
                {
                  type: "doc",
                  id: "sdk/cpp/main-api",
                  label: "Main API"
                },
                {
                  type: "doc",
                  id: "sdk/cpp/core-api",
                  label: "Core API"
                },
                {
                  type: "doc",
                  id: "sdk/cpp/cli",
                  label: "Utility CLI"
                },
                {
                  type: "link",
                  label: "API Reference",
                  href: "https://touca.io/docs/external/sdk/cpp/index.html"
                }
              ]
            },
            {
              type: "category",
              label: "Node.js",
              items: [
                {
                  type: "doc",
                  id: "sdk/js/main-api",
                  label: "Main API"
                },
                {
                  type: "doc",
                  id: "sdk/js/core-api",
                  label: "Core API"
                },
                {
                  type: "link",
                  label: "API Reference",
                  href: "https://touca.io/docs/external/sdk/js/index.html"
                }
              ]
            },
            {
              type: "category",
              label: "Java",
              items: [
                {
                  type: "doc",
                  id: "sdk/java/installing",
                  label: "Installing"
                },
                {
                  type: "doc",
                  id: "sdk/java/main-api",
                  label: "Main API"
                },
                {
                  type: "doc",
                  id: "sdk/java/core-api",
                  label: "Core API"
                },
                {
                  type: "link",
                  label: "API Reference",
                  href: "https://touca.io/docs/external/sdk/java/index.html"
                }
              ]
            },
            {
              type: "doc",
              id: "sdk/testcases",
              label: "Setting Test Cases"
            }
          ]
        },
        {
          type: "category",
          label: "Server",
          collapsed: true,
          collapsible: true,
          items: [
            {
              type: "doc",
              id: "server/self-hosting",
              label: "Self Hosting"
            },
            {
              type: "doc",
              id: "server/keyboard-shortcuts",
              label: "Keyboard Shortcuts"
            },
            {
              type: "doc",
              id: "server/environment-variables",
              label: "Environment Variables"
            },
            {
              type: "doc",
              id: "server/telemetry",
              label: "Telemetry Reports"
            },
            {
              type: "doc",
              id: "server/pricing",
              label: "Pricing"
            },
            {
              type: "link",
              label: "REST API",
              href: "https://touca.io/docs/external/api/index.html"
            }
          ]
        }
      ]
    },
    {
      type: "html",
      value: "<hr />"
    },
    {
      type: "category",
      label: "Guides",
      collapsed: false,
      collapsible: false,
      items: [
        {
          type: "doc",
          id: "guides/best-practices",
          label: "Best Practices"
        },
        {
          type: "doc",
          id: "guides/vs-snapshot",
          label: "Touca vs. Snapshot Testing"
        },
        {
          type: "doc",
          id: "guides/faq",
          label: "FAQ"
        }
      ]
    },
    {
      type: "html",
      value: "<hr />"
    },
    {
      type: "category",
      label: "Contributing",
      collapsed: false,
      collapsible: false,
      items: [
        {
          type: "doc",
          id: "contributing/conduct",
          label: "Code of Conduct"
        },
        {
          type: "doc",
          id: "contributing/Readme",
          label: "Contributing Guide"
        },
        {
          type: "doc",
          id: "contributing/good-first-issues",
          label: "Good First Issues"
        }
      ]
    },
    {
      type: "category",
      label: "Legal",
      collapsed: false,
      collapsible: false,
      items: [
        {
          type: "doc",
          id: "legal/terms",
          label: "Terms of Service"
        },
        {
          type: "doc",
          id: "legal/privacy",
          label: "Privacy Policy"
        }
      ]
    }
  ]
};

module.exports = sidebars;
