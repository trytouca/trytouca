/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import Link from 'next/link';

import { make_path } from '@/lib/api';

export default function Header() {
  return (
    <header className="h-20 sticky top-0 z-10 bg-dark-blue-900 bg-opacity-90 backdrop-filter backdrop-blur">
      <div className="px-4 mx-auto container flex justify-between">
        <div className="flex items-center select-none">
          <Link href="/">
            <a className="h-20 flex items-center focus:outline-none">
              <img
                className="h-12"
                src={make_path('/logo/weasel-logo-transparent.svg')}
                alt="Weasel Logo"
                loading="eager"
              />
              <h1 className="text-2xl font-light text-white tracking-tight">
                Weasel
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
            href="https://docs.getweasel.com"
            rel="noopener">
            Docs
          </a>
          <a
            className="wsl-header-btn-primary"
            href="https://app.getweasel.com"
            rel="noopener">
            Get Started
          </a>
        </nav>
      </div>
    </header>
  );
}
