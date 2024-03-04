// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import Link from 'next/link';
import { FaDiscord, FaGithub } from 'react-icons/fa';

import DropdownMenu from '@/components/DropdownMenu';
import LogoKit from '@/components/LogoKit';

const items = [
  { title: 'Sign up', link: 'https://app.touca.io' },
  { title: 'Docs', link: 'https://touca.io/docs' },
  { title: 'Changelog', link: '/changelog' },
  { title: 'Blog', link: '/blog' }
];

export default function Header() {
  return (
    <header className="sticky top-0 z-10 h-20 bg-dark-blue-900 bg-opacity-90 backdrop-blur backdrop-filter">
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="flex select-none items-center">
          <LogoKit></LogoKit>
        </div>
        <nav className="hidden items-center space-x-2 md:flex">
          {items
            .slice()
            .reverse()
            .map((value, index) => {
              return (
                <a
                  key={index}
                  className="rounded-lg bg-transparent px-4 py-2 text-base font-semibold leading-6 text-gray-300 duration-150 ease-in-out hover:text-white focus:ring-0"
                  href={value.link}
                  rel="noopener">
                  {value.title}
                </a>
              );
            })}
          <Link href="/discord" title="Join our Discord Community">
            <div className="text-gray-400 hover:text-gray-300 md:px-3">
              <FaDiscord size="2em" />
            </div>
          </Link>
          <Link href="/github" title="Give us a star on GitHub">
            <div className="text-gray-400 hover:text-gray-300 md:px-3">
              <FaGithub size="2em" />
            </div>
          </Link>
        </nav>
        <div className="flex items-center md:hidden">
          <DropdownMenu></DropdownMenu>
        </div>
      </div>
    </header>
  );
}
