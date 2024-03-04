'use client';

import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { FiMenu } from 'react-icons/fi';

const items = [
  { title: 'Sign up', link: 'https://app.touca.io' },
  { title: 'Docs', link: 'https://touca.io/docs' },
  { title: 'Changelog', link: '/changelog' },
  { title: 'Blog', link: '/blog' }
];

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

export default function DropdownMenu() {
  return (
    <Menu as="div" className="relative">
      <Menu.Button
        type="button"
        className="text-gray-400 hover:text-gray-300 md:px-3">
        <span className="sr-only">Open website menu</span>
        <FiMenu />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95">
        <Menu.Items className="absolute right-0 w-40 origin-top-right divide-y divide-gray-100 rounded-md border border-gray-700 bg-dark-blue-900 p-1 shadow-lg ring-1 ring-gray-700 ring-opacity-5 focus:outline-none">
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
}
