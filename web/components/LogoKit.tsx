// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { HiOutlineNewspaper } from 'react-icons/hi';

export default function LogoKit() {
  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
  const [show, setShow] = useState(false);

  const handleContextMenu = useCallback(
    // @ts-expect-error MouseEvent
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
      ?.addEventListener('contextmenu', handleContextMenu);
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
            <HiOutlineNewspaper size="1.2em"></HiOutlineNewspaper>
            <span>Download Press Kit</span>
          </a>
        </div>
      )}
    </>
  );
}
