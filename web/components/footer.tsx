// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import Link from 'next/link';
import { IconType } from 'react-icons';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { HiArrowNarrowRight, HiOutlineMail } from 'react-icons/hi';

const social: {
  link: string;
  title: string;
  text: string;
  internal?: true;
  icon?: IconType;
}[] = [
  {
    link: 'https://github.com/trytouca',
    title: 'Check us out on GitHub',
    text: 'GitHub',
    icon: FaGithub
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
    link: '/contact',
    title: 'Get in Touch',
    text: 'Contact',
    internal: true,
    icon: HiOutlineMail
  },
  {
    link: 'https://status.touca.io',
    title: 'Cloud Server Status',
    text: 'Status'
  },
  {
    link: 'https://docs.touca.io/legal/terms',
    title: 'Terms of Service',
    text: 'Terms'
  },
  {
    link: 'https://docs.touca.io/legal/privacy',
    title: 'Privacy Policy',
    text: 'Privacy'
  }
];

const FooterCta = () => {
  return (
    <section className="py-32 lg:pt-8 min-h-[25vh] flex items-center bg-gradient-to-b from-dark-blue-900 via-dark-blue-900 to-dark-blue-800">
      <div className="container px-8 mx-auto md:px-24 lg:px-8">
        <div className="grid lg:p-8 gap-y-20 lg:grid-cols-2">
          <div className="space-y-4 text-white">
            <h3 className="text-2xl font-bold wsl-text-shadow xl:text-3xl">
              Build Better Software, Faster.
            </h3>
            <p className="text-xl">
              Spend less time finding and fixing regressions.
            </p>
            <div>
              <a
                className="text-lg"
                href="https://app.touca.io"
                target="_blank"
                rel="noopener noreferrer">
                <button
                  className="shadow-[0_0_5px_#7dd3fc] p-3 space-x-2 font-medium text-white duration-150 ease-in-out bg-opacity-25 box-shadow rounded-xl focus:outline-none bg-dark-blue-700 hover:bg-opacity-50 group"
                  type="button"
                  role="button">
                  <span>Get Started for Free</span>
                  <HiArrowNarrowRight className="inline h-6 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FooterRow = () => {
  return (
    <footer className="border-t bg-gradient-to-r from-dark-blue-800 via-dark-blue-800 to-dark-blue-900 border-dark-blue-800">
      <div className="container flex items-center justify-between h-20 px-12 mx-auto">
        <p className="text-sm font-semibold text-white">&copy; Touca, Inc.</p>
        <ul className="hidden space-x-6 lg:flex">
          {social.map((item) => {
            return (
              <li
                className="text-sm font-semibold text-gray-200 hover:text-white"
                key={item.link}
                title={item.title}>
                {item.internal ? (
                  <Link href={item.link}>
                    <a>{item.text}</a>
                  </Link>
                ) : (
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {item.text}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
        <ul className="flex space-x-4 lg:hidden">
          {social
            .filter((v) => v.icon)
            .map((item, index) => {
              const Icon = item.icon;
              return (
                <li
                  key={index}
                  className="text-xl text-gray-300 hover:text-white"
                  title={item.title}>
                  {item.internal ? (
                    <Link href={item.link}>
                      <a>
                        <Icon></Icon>
                      </a>
                    </Link>
                  ) : (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer">
                      <Icon></Icon>
                    </a>
                  )}
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
