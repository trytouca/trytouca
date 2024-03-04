// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { FiCheckCircle } from 'react-icons/fi';
import { HiArrowNarrowRight } from 'react-icons/hi';

import { BackedBy } from '@/components/BackedBy';
import { TrustedBy } from '@/components/TrustedBy';

function ATFButtonDemo() {
  return (
    <a
      href="https://app.touca.io"
      target="_blank"
      rel="noopener noreferrer"
      className="text-md box-shadow group flex items-center space-x-2 p-3 font-medium text-gray-300 duration-150 ease-in-out hover:text-white focus:outline-none">
      <button type="button" role="button">
        <span>or Sign up on Touca Cloud</span>
      </button>
    </a>
  );
}

function ATFButtonStart() {
  return (
    <a
      href="https://touca.io/docs/server/self-hosting/"
      target="_blank"
      rel="noopener noreferrer">
      <button
        className="box-shadow group space-x-2 rounded-full bg-dark-blue-700 bg-opacity-25 px-8 py-3 text-lg font-medium text-white shadow-[0_0_7px_#7dd3fc] duration-150 ease-in-out hover:bg-opacity-50 focus:outline-none"
        type="button"
        role="button">
        <span>Install Touca Locally</span>
        <HiArrowNarrowRight className="hidden h-6 opacity-50 group-hover:opacity-100 sm:inline" />
      </button>
    </a>
  );
}

function ATFTagline() {
  return (
    <div className="space-y-4">
      <h2 className="max-w-3xl text-3xl font-extrabold text-white sm:text-center md:max-w-3xl md:text-4xl lg:max-w-4xl lg:text-7xl">
        Find regressions in{' '}
        <span className="bg-gradient-to-r from-yellow-600 to-yellow-300 bg-clip-text font-extrabold text-transparent">
          minutes
        </span>
        , not days
      </h2>
      <p className="max-w-3xl text-lg font-medium text-white sm:text-center sm:text-2xl md:max-w-3xl lg:max-w-4xl">
        Get feedback when you write code that could break your software
      </p>
    </div>
  );
}

function ATFFears() {
  return (
    <div className="mx-auto flex max-w-3xl justify-center space-x-2 md:space-x-16">
      <div className="flex items-center space-x-2">
        <FiCheckCircle className="text-3xl text-green-600" />
        <span className="text-xl font-medium text-gray-400 duration-300 ease-in-out hover:text-gray-300">
          Open-Source
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <FiCheckCircle className="text-3xl text-green-600" />
        <span className="text-xl font-medium text-gray-400 duration-300 ease-in-out hover:text-gray-300">
          Developer-Friendly
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <FiCheckCircle className="text-3xl text-green-600" />
        <span className="text-xl font-medium text-gray-400 duration-300 ease-in-out hover:text-gray-300">
          Battle-Tested
        </span>
      </div>
    </div>
  );
}

export function ATFScreenshot() {
  return (
    <section className="bg-gradient-to-b from-dark-blue-800 to-dark-blue-900">
      <div className="mx-auto hidden w-full max-w-2xl px-4 pb-16 pt-8 sm:block md:max-w-4xl lg:max-w-5xl">
        <img
          className="sm:rounded-xl"
          alt="Touca Continuous Regression Testing"
          src="https://touca.io/web/external/assets/touca-page-suite-p0.dark.png"
          loading="lazy"
        />
      </div>
    </section>
  );
}

export function AboveTheFold() {
  return (
    <section className="bg-gradient-to-b from-dark-blue-900 to-dark-blue-800">
      <div className="grid min-h-[calc(100vh-5rem)] place-content-center space-y-16 px-4 sm:min-h-[calc(100vh-5rem-15vh)] sm:px-8">
        <ATFTagline />
        <ATFFears />
        <div className="flex flex-col items-center sm:flex-row sm:justify-center sm:space-x-2">
          <ATFButtonStart />
          <ATFButtonDemo />
        </div>
        <div className="mx-auto flex w-full max-w-xs justify-between md:max-w-md">
          <TrustedBy />
          <BackedBy />
        </div>
      </div>
    </section>
  );
}
