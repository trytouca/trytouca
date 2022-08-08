// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import Link from 'next/link';
import { IconType } from 'react-icons';
import {
  FaDiscord,
  FaGithub,
  FaLinkedin,
  FaTwitch,
  FaTwitter,
  FaYoutube
} from 'react-icons/fa';
import { HiArrowNarrowRight } from 'react-icons/hi';

import { ATFBackedBy } from '@/components/social-proof';

const social: {
  link: string;
  title: string;
  text: string;
  icon: IconType;
}[] = [
  {
    link: 'https://touca.io/github',
    title: 'Check us out on GitHub',
    text: 'GitHub',
    icon: FaGithub
  },
  {
    link: 'https://touca.io/discord',
    title: 'Join our Discord Community',
    text: 'Discord',
    icon: FaDiscord
  },
  {
    link: 'https://twitter.com/trytouca',
    title: 'Follow us on Twitter',
    text: 'Twitter',
    icon: FaTwitter
  },
  {
    link: 'https://linkedin.com/company/touca',
    title: 'Follow us on LinkedIn',
    text: 'LinkedIn',
    icon: FaLinkedin
  },
  {
    link: 'https://www.youtube.com/channel/UCAGugoQDJY3wdMuqETTOvIA',
    title: 'Subscribe to our YouTube channel',
    text: 'YouTube',
    icon: FaYoutube
  },
  {
    link: 'https://touca.io/twitch',
    title: 'Hangout with us on Twitch',
    text: 'Twitch',
    icon: FaTwitch
  }
];

const groups: {
  name: string;
  links: {
    link: string;
    text: string;
    desc?: string;
  }[];
}[] = [
  {
    name: 'Product',
    links: [
      {
        link: 'https://app.touca.io',
        text: 'Start Now'
      },
      {
        link: '/changelog',
        text: 'Changelog'
      },
      {
        link: 'https://status.touca.io',
        text: 'Status'
      }
    ]
  },
  {
    name: 'Resources',
    links: [
      {
        link: 'https://touca.io/docs',
        text: 'Documentation'
      },
      {
        link: '/pricing',
        text: 'Pricing'
      },
      {
        link: '/blog',
        text: 'Blog'
      }
    ]
  },
  {
    name: 'Community',
    links: [
      {
        link: 'https://touca.io/docs/contributing',
        text: 'Contribute'
      },
      {
        link: '/github',
        text: 'GitHub'
      },
      {
        link: '/discord',
        text: 'Discord'
      }
    ]
  },
  {
    name: 'Company',
    links: [
      {
        link: '/contact',
        text: 'Contact'
      },
      {
        link: 'https://touca.io/docs/legal/terms',
        text: 'Terms'
      },
      {
        link: 'https://touca.io/docs/legal/privacy',
        text: 'Privacy'
      }
    ]
  }
];

const FooterCta = () => {
  return (
    <section className="flex min-h-[25vh] items-center bg-gradient-to-b from-dark-blue-900 via-dark-blue-900 to-dark-blue-800 py-32 px-8 lg:pt-8">
      <div className="mx-auto w-full max-w-screen-lg rounded-xl border border-dark-blue-700 bg-dark-blue-800 bg-opacity-90 px-8 py-16">
        <div className="space-y-8 md:text-center">
          <div className="space-y-4 text-white">
            <h3 className="text-2xl font-bold md:text-3xl">
              Build Better Software, Faster.
            </h3>
            <p className="text-xl">
              Spend less time finding and fixing regressions.
            </p>
          </div>
          <a
            className="block text-lg"
            href="https://app.touca.io"
            target="_blank"
            rel="noopener noreferrer">
            <button
              className="box-shadow group space-x-2 rounded-xl bg-dark-blue-700 bg-opacity-25 p-3 font-medium text-white shadow-[0_0_5px_#7dd3fc] duration-150 ease-in-out hover:bg-opacity-50 focus:outline-none"
              type="button"
              role="button">
              <span>Get Started for Free</span>
              <HiArrowNarrowRight className="inline h-6 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
            </button>
          </a>
        </div>
      </div>
    </section>
  );
};

const FooterRow = () => {
  return (
    <footer className="divide-y divide-dark-blue-700 border-t border-dark-blue-800 bg-dark-blue-900 px-8 text-white">
      <div className="mx-auto max-w-screen-lg space-y-16 py-16 md:flex md:space-y-0">
        <div className="grid grid-cols-2 items-start gap-8 font-medium md:flex-grow lg:grid-cols-4">
          {groups.map((group) => {
            return (
              <ul className="flex flex-col space-y-2" key={group.name}>
                <span className="text-xs font-medium uppercase text-gray-400">
                  {group.name}
                </span>
                <>
                  {group.links.map((child) => {
                    return child.link.startsWith('/') ? (
                      <li
                        className="font-medium text-gray-200 hover:text-white"
                        key={child.link}>
                        <Link href={child.link}>
                          <a>{child.text}</a>
                        </Link>
                      </li>
                    ) : (
                      <li
                        className="font-medium text-gray-200 hover:text-white"
                        key={child.link}>
                        <a
                          href={child.link}
                          target="_blank"
                          rel="noopener noreferrer">
                          {child.text}
                        </a>
                      </li>
                    );
                  })}
                </>
              </ul>
            );
          })}
        </div>
        <div>
          <ATFBackedBy />
        </div>
      </div>
      <div className="mx-auto flex max-w-screen-lg flex-col items-center justify-between py-8 md:flex-row">
        <div className="order-last flex items-center space-x-4 pt-8 md:order-first md:pt-0">
          <img
            src="/images/touca_logo_io_text_white.svg"
            alt="Touca.io"
            loading="lazy"
            width="100px"
          />
        </div>
        <ul className="flex items-center space-x-2">
          {social
            .filter((v) => v.icon)
            .map((item, index) => {
              const Icon = item.icon;
              return (
                <li
                  key={index}
                  className="rounded-full bg-dark-blue-700 bg-opacity-50 p-2 text-xl text-gray-300 hover:text-white"
                  title={item.title}>
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    <span className="sr-only">{item.text}</span>
                    <Icon></Icon>
                  </a>
                </li>
              );
            })}
        </ul>
      </div>
    </footer>
  );
};

export default function Footer() {
  return (
    <>
      <FooterCta></FooterCta>
      <FooterRow></FooterRow>
    </>
  );
}
