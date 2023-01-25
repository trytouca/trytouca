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
              label: "Installing",
              items: [
                {
                  type: "doc",
                  id: "sdk/installing/cpp",
                  label: "C++"
                },
                {
                  type: "doc",
                  id: "sdk/installing/java",
                  label: "Java"
                }
              ]
            },
            {
              type: "doc",
              id: "sdk/main-api",
              label: "Getting Started"
            },
            {
              type: "doc",
              id: "sdk/testcases",
              label: "Setting Test Cases"
            },
            {
              type: "doc",
              id: "sdk/capturing",
              label: "Capturing Test Results"
            },
            {
              type: "doc",
              id: "sdk/differences",
              label: "Feature Matrix"
            },
            {
              type: "doc",
              id: "sdk/core-api",
              label: "Low Level API"
            },
            {
              type: "doc",
              id: "sdk/cli",
              label: "Low Level CLI"
            },
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
