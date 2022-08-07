// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import Link from 'next/link';
import { HiArrowNarrowRight } from 'react-icons/hi';

import { ATFBackedBy, ATFTrustedBy } from './social-proof';

function ATFButtonDemo() {
  return (
    <Link href="/demo">
      <a className="text-md flex items-center box-shadow group space-x-2 p-3 font-medium text-gray-300 duration-150 ease-in-out hover:text-white focus:outline-none">
        <span>or Schedule a Demo</span>
      </a>
    </Link>
  );
}

function ATFButtonStart() {
  return (
    <a href="https://app.touca.io" target="_blank" rel="noopener noreferrer">
      <button
        className="box-shadow text-lg group space-x-2 rounded-full bg-dark-blue-700 bg-opacity-25 py-3 px-8 font-medium text-white shadow-[0_0_7px_#7dd3fc] duration-150 ease-in-out hover:bg-opacity-50 focus:outline-none"
        type="button"
        role="button">
        <span>Start with $100 Credits</span>
        <HiArrowNarrowRight className="sm:inline hidden h-6 opacity-50 group-hover:opacity-100" />
      </button>
    </a>
  );
}

function ATFTagline() {
  return (
    <div className="space-y-4">
      <h2 className="max-w-3xl lg:max-w-4xl sm:text-center text-white font-extrabold text-3xl md:text-4xl lg:text-7xl">
        Find regressions in{' '}
        <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-yellow-300">
          minutes
        </span>
        , not days
      </h2>
      <p className="max-w-3xl lg:max-w-4xl sm:text-center font-medium text-lg text-white sm:text-2xl">
        Get feedback when you write code that could break your software
      </p>
    </div>
  );
}

export function ATFScreenshot() {
  return (
    <section className="bg-gradient-to-b from-dark-blue-800 to-dark-blue-900">
      <div className="hidden sm:block max-w-2xl md:max-w-4xl lg:max-w-5xl pt-8 pb-16 px-8 mx-auto w-full">
        <img
          className="sm:rounded-xl"
          alt="Touca Continuous Regression Testing"
          src="/images/touca-atf-visual.jpg"
          loading="lazy"
        />
      </div>
    </section>
  );
}

export function AboveTheFold() {
  return (
    <section className="bg-gradient-to-b from-dark-blue-900 to-dark-blue-800">
      <div className="grid place-content-center min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-5rem-15vh)] space-y-16 px-4 sm:px-8">
        <ATFTagline />
        <div className="sm:space-x-2 flex flex-col sm:flex-row items-center sm:justify-center">
          <ATFButtonStart />
          <ATFButtonDemo />
        </div>
        <div className="max-w-md mx-auto w-full flex justify-between">
          <ATFTrustedBy />
          <ATFBackedBy />
        </div>
      </div>
    </section>
  );
}
