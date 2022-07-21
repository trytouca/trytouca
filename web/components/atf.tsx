// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import Link from 'next/link';
import { HiArrowNarrowRight } from 'react-icons/hi';

import { ATFBackedBy, ATFTrustedBy } from './social-proof';

function ATFScreenshot() {
  return (
    <div className="mx-auto hidden h-full w-full select-none items-center p-8 sm:flex sm:p-0 xl:col-span-3">
      <a
        href="/images/touca-atf-visual.jpg"
        target="_blank"
        rel="noopener noreferrer">
        <img
          className="rounded-xl shadow-md"
          alt="Touca Continuous Regression Testing"
          src="/images/touca-atf-visual.jpg"
          loading="lazy"
        />
      </a>
    </div>
  );
}

export default function AboveTheFold() {
  return (
    <section className="bg-gradient-to-b from-dark-blue-900 to-dark-blue-800">
      <div className="min-h-[calc(100vh-5rem)] grid lg:items-center">
        <div className="container mx-auto flex items-center">
          <div className="grid gap-8 p-8 lg:items-center xl:grid-cols-5">
            <div className="mx-auto flex h-full flex-col justify-around space-y-12 py-12 lg:py-4 xl:col-span-2 xl:py-0">
              <div className="space-y-4">
                <h2 className="wsl-text-gradient max-w-xl text-3xl font-bold text-white sm:text-4xl xl:text-3xl">
                  Open source continuous regression testing for engineering
                  teams
                </h2>
                <p className="max-w-xl text-lg text-white sm:text-2xl">
                  Get feedback when you write code that could break your
                  software.
                </p>
              </div>
              <div className="items-center space-x-4 text-center md:flex md:text-left">
                <a
                  className="text-lg"
                  href="https://app.touca.io"
                  target="_blank"
                  rel="noopener noreferrer">
                  <button
                    className="box-shadow group space-x-2 rounded-xl bg-dark-blue-700 bg-opacity-25 p-3 font-medium text-white shadow-[0_0_5px_#7dd3fc] duration-150 ease-in-out hover:bg-opacity-50 focus:outline-none"
                    type="button"
                    role="button">
                    <span>Get Started for Free</span>
                    <HiArrowNarrowRight className="inline h-6 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
                  </button>
                </a>
                <Link href="/demo">
                  <a className="text-md group space-x-2 rounded-xl bg-opacity-50 p-3 font-medium text-gray-300 duration-150 ease-in-out hover:text-white focus:outline-none">
                    <span>or Get a Demo</span>
                  </a>
                </Link>
              </div>
              <div className="sm:flex sm:justify-between sm:px-4 space-y-8 sm:space-y-0">
                <ATFTrustedBy />
                <ATFBackedBy />
              </div>
            </div>
            <ATFScreenshot />
          </div>
        </div>
      </div>
    </section>
  );
}
