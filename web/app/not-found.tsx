// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

const content = {
  title: 'Page Not Found',
  subtitle: 'Did you make a typo?',
  description: `
    The page or document you requested is not accessible. Either it does not
    exist or you have insufficient privileges to access it. Let us know if
    you think you are encountering this page by error.`
};

export const metadata: Metadata = {
  title: content.title
};

export default function NotFound() {
  return (
    <section className="bg-gradient-to-b from-dark-blue-900 to-dark-blue-800">
      <div className="wsl-min-h-screen-1 container mx-auto grid place-content-center space-y-12 px-4">
        <div className="space-y-2 text-center">
          <h2 className="text-4xl font-light text-white">{content.title}</h2>
          <p className="text-xl text-white">{content.subtitle}</p>
        </div>
        <div className="mx-auto max-w-xl space-y-8 rounded-xl border border-dark-blue-700 bg-dark-blue-800 bg-opacity-50 p-8">
          <div className="">
            <p className="text-lg font-light text-white md:text-xl">
              {content.description}
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/"
              className="rounded-xl border border-transparent bg-sky-900 bg-opacity-50 p-4 text-sm leading-6 text-gray-300 hover:border-sky-900 hover:text-white">
              Back to Main Page
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
