// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import Link from 'next/link';

import { make_path } from '@/lib/api';

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
                loading="eager"
              />
              <h1 className="text-2xl font-bold leading-10 tracking-tight text-white">
                touca<span className="text-sky-300">.io</span>
              </h1>
            </a>
          </Link>
        </div>
        <nav className="flex items-center space-x-4">
          <Link href="/pricing">
            <a className="wsl-header-btn-secondary">Pricing</a>
          </Link>
          <a
            className="wsl-header-btn-secondary"
            href="https://blog.touca.io"
            rel="noopener">
            Blog
          </a>
          <a
            className="wsl-header-btn-secondary"
            href="https://docs.touca.io"
            rel="noopener">
            Docs
          </a>
          <a
            className="wsl-header-btn-primary"
            href="https://app.touca.io"
            rel="noopener">
            <span className="block md:hidden">Start</span>
            <span className="hidden md:block">Get Started</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
