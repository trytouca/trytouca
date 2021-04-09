/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
 */

import { FaGithub, FaTwitter, FaSlack } from 'react-icons/fa';

const copyrightYear = new Date().getFullYear();

const social = [
  {
    title: 'Join our Community',
    link: 'https://getweasel.slack.com',
    icon: FaSlack
  },
  {
    title: 'Follow us on Twitter',
    link: 'https://twitter.com/getweasel',
    icon: FaTwitter
  },
  {
    title: 'Check us out on GitHub',
    link: 'https://github.com/getweasel',
    icon: FaGithub
  }
];

export default function Header() {
  return (
    <footer className="bg-gradient-to-r from-light-blue-900 to-primary-900 border-t border-light-blue-900">
      <div className="h-20 px-12 mx-auto container flex items-center justify-between">
        <p className="text-white text-sm">
          &copy; {copyrightYear} Weasel, Inc.
        </p>
        <ul className="flex space-x-4">
          {social.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.link} title={item.title}>
                <a href={item.link} target="_blank" rel="noopener">
                  <Icon
                    className="text-gray-200 hover:text-white"
                    size="2rem"></Icon>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </footer>
  );
}
