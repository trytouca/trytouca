// @ts-check
/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: "doc",
      id: "Readme",
      label: "About Touca"
    },
    {
      type: "category",
      label: "Getting Started",
      collapsed: false,
      collapsible: false,
      items: [
        {
          type: "doc",
          id: "basics/quickstart",
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
        },
        {
          type: "doc",
          id: "basics/faq",
          label: "Common Questions"
        }
      ]
    },
    {
      type: "category",
      label: "SDKs",
      collapsed: false,
      collapsible: false,
      items: [
        {
          type: "category",
          label: "Python",
          items: [
            {
              type: "doc",
              id: "sdk/python/quickstart",
              label: "Getting Started"
            },
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
              href: "https://app.touca.io/docs/clients/python/api.html"
            },
            {
              type: "link",
              label: "GitHub Repository",
              href: "https://github.com/trytouca/touca-python"
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
              id: "sdk/cpp/quickstart",
              label: "Getting Started"
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
              type: "link",
              label: "API Reference",
              href: "https://app.touca.io/docs/clients/cpp/api.html"
            },
            {
              type: "link",
              label: "GitHub Repository",
              href: "https://github.com/trytouca/touca-cpp"
            }
          ]
        },
        {
          type: "category",
          label: "JavaScript",
          items: [
            {
              type: "doc",
              id: "sdk/javascript/quickstart",
              label: "Getting Started"
            },
            {
              type: "doc",
              id: "sdk/javascript/main-api",
              label: "Main API"
            },
            {
              type: "doc",
              id: "sdk/javascript/core-api",
              label: "Core API"
            },
            {
              type: "link",
              label: "API Reference",
              href: "https://app.touca.io/docs/clients/js/index.html"
            },
            {
              type: "link",
              label: "GitHub Repository",
              href: "https://github.com/trytouca/touca-js"
            }
          ]
        },
        {
          type: "category",
          label: "Java",
          items: [
            {
              type: "doc",
              id: "sdk/java/quickstart",
              label: "Getting Started"
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
              href: "https://app.touca.io/docs/clients/java/index.html"
            },
            {
              type: "link",
              label: "GitHub Repository",
              href: "https://github.com/trytouca/touca-java"
            }
          ]
        },
        {
          type: "doc",
          id: "sdk/differences",
          label: "Differences"
        }
      ]
    },
    {
      type: "category",
      label: "Guides",
      collapsed: false,
      collapsible: false,
      items: [
        {
          type: "doc",
          id: "guides/self-hosting",
          label: "Self Hosting"
        },
        {
          type: "doc",
          id: "guides/cli",
          label: "Command Line Tools"
        },
        {
          type: "doc",
          id: "guides/best-practices",
          label: "Best Practices"
        },
        {
          type: "doc",
          id: "guides/keyboard",
          label: "Keyboard Shortcuts"
        },
        {
          type: "doc",
          id: "guides/pricing",
          label: "Pricing"
        }
      ]
    },
    {
      type: "category",
      label: "Other Resources",
      items: [
        {
          type: "link",
          label: "Touca on GitHub",
          href: "https://github.com/trytouca"
        },
        {
          type: "link",
          label: "Touca on Twitter",
          href: "https://twitter.com/trytouca"
        },
        {
          type: "link",
          label: "Touca on LinkedIn",
          href: "https://linkedin.com/company/touca"
        },
        {
          type: "link",
          label: "Server API",
          href: "https://app.touca.io/docs/api/index.html"
        }
      ]
    },
    {
      type: "category",
      label: "Legal",
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
