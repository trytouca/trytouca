// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Menu, Transition } from '@headlessui/react';
import Link from 'next/link';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { FaDiscord, FaGithub } from 'react-icons/fa';
import { HiMenu, HiOutlineNewspaper } from 'react-icons/hi';

const items = [
  { title: 'Sign up', link: 'https://app.touca.io' },
  { title: 'Docs', link: 'https://touca.io/docs' },
  { title: 'Changelog', link: '/changelog' },
  { title: 'Blog', link: '/blog' },
  { title: 'Pricing', link: '/pricing' }
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
              <FaDiscord size="2rem" />
            </div>
          </Link>
          <Link href="/github" title="Give us a star on GitHub">
            <div className="text-gray-400 hover:text-gray-300 md:px-3">
              <FaGithub size="2rem" />
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

function DropdownMenuItem(props: { input: { title: string; link: string } }) {
  return (
    <Menu.Item>
      {({ active }) => (
        <a
          className={`${
            active
              ? 'bg-dark-blue-800 bg-opacity-70 text-white'
              : 'text-gray-200'
          }  flex w-full items-center rounded-md px-2 py-2 text-sm font-medium`}
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
        className="text-gray-400 hover:text-gray-300 md:px-3">
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
          className="absolute right-0 w-40 origin-top-right divide-y divide-gray-100 rounded-md border border-gray-700 bg-dark-blue-900 p-1 shadow-lg ring-1 ring-gray-700 ring-opacity-5 focus:outline-none">
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

function LogoKit() {
  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
  const [show, setShow] = useState(false);

  const handleContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      setAnchorPoint({ x: event.pageX, y: event.pageY });
      setShow(true);
    },
    [setAnchorPoint]
  );

  const handleClick = useCallback(() => {
    show && setShow(false);
  }, [show]);

  useEffect(() => {
    document.addEventListener('click', handleClick);
    document
      .querySelector('#hello')
      .addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  });

  return (
    <>
      <Link
        href="/"
        className="flex h-20 items-center focus:outline-none"
        id="hello">
        <img
          className="h-10"
          src="/images/touca_logo_fg.svg"
          alt="Touca Logo"
          loading="lazy"
          width="40px"
          height="40px"
        />
        <h1 className="sr-only text-2xl font-bold leading-10 tracking-tight text-white">
          touca<span className="text-sky-300">.io</span>
        </h1>
        <img
          className="no-sr-only"
          src="/images/touca_logo_fgt.svg"
          alt="Touca.io"
          loading="lazy"
          width="100px"
        />
      </Link>
      {show && (
        <div
          className="absolute rounded-md border border-dark-blue-700 bg-dark-blue-800 p-1"
          style={{
            top: anchorPoint.y,
            left: anchorPoint.x
          }}>
          <a
            className="group flex items-center space-x-2 rounded-md p-2 font-medium text-gray-300 transition duration-300 ease-in-out hover:text-white"
            href="/assets/touca-press-kit.zip"
            target="_blank"
            rel="noopener noreferrer">
            <HiOutlineNewspaper size="1.2rem"></HiOutlineNewspaper>
            <span>Download Press Kit</span>
          </a>
        </div>
      )}
    </>
  );
}
