// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Menu, Transition } from '@headlessui/react';
import Link from 'next/link';
import { Fragment } from 'react';
import { FaGithub } from 'react-icons/fa';
import { HiMenu } from 'react-icons/hi';

import { make_path } from '@/lib/api';

const items = [
  { title: 'Login', link: 'https://app.touca.io' },
  { title: 'Docs', link: 'https://docs.touca.io' },
  { title: 'Blog', link: 'https://blog.touca.io' },
  { title: 'Pricing', link: '/pricing' }
];

export default function Header() {
  return (
    <header className="sticky top-0 z-10 h-20 bg-dark-blue-900 bg-opacity-90 backdrop-filter backdrop-blur">
      <div className="container flex items-center justify-between px-4 mx-auto">
        <div className="flex items-center select-none">
          <Link href="/">
            <a className="flex items-center h-20 focus:outline-none">
              <img
                className="h-10"
                src={make_path('/logo/touca-logo-transparent.svg')}
                alt="Touca Logo"
                loading="lazy"
                width="40px"
                height="40px"
              />
              <h1 className="text-2xl font-bold leading-10 tracking-tight text-white">
                touca<span className="text-sky-300">.io</span>
              </h1>
            </a>
          </Link>
        </div>
        <nav className="items-center hidden space-x-2 md:flex">
          {items
            .slice()
            .reverse()
            .map((value, index) => {
              return (
                <a
                  key={index}
                  className="px-4 py-2 text-sm font-semibold leading-6 text-gray-300 duration-150 ease-in-out bg-transparent rounded-lg hover:text-white focus:ring-0"
                  href={value.link}
                  rel="noopener">
                  {value.title}
                </a>
              );
            })}
          <a
            href="https://github.com/trytouca"
            title="Check us out on GitHub"
            target="_blank"
            rel="noopener noreferrer">
            <div className="text-gray-400 md:px-3 hover:text-gray-300">
              <FaGithub size="2rem" />
            </div>
          </a>
        </nav>
        <div className="flex items-center md:hidden">
          <DropdownMenu></DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function DropdownMenuItem(props: { input: { title: string; link: string } }) {
  return (
    <Menu.Item>
      {({ active }) => (
        <a
          className={`${
            active
              ? 'bg-dark-blue-800 bg-opacity-70 text-white'
              : 'text-gray-200'
          }  font-medium flex rounded-md items-center w-full px-2 py-2 text-sm`}
          href={props.input.link}
          rel="noopener">
          {props.input.title}
        </a>
      )}
    </Menu.Item>
  );
}

const DropdownMenu = () => {
  return (
    <Menu as="div" className="relative">
      <Menu.Button
        type="button"
        className="text-gray-400 md:px-3 hover:text-gray-300">
        <span className="sr-only">Open website menu</span>
        <HiMenu size="2rem"></HiMenu>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95">
        <Menu.Items
          role="menu"
          className="absolute right-0 w-40 p-1 origin-top-right border border-gray-700 divide-y divide-gray-100 rounded-md shadow-lg bg-dark-blue-900 ring-1 ring-gray-700 ring-opacity-5 focus:outline-none">
          <div className="p-1">
            {items.map((input, index) => {
              return (
                <DropdownMenuItem key={index} input={input}></DropdownMenuItem>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
