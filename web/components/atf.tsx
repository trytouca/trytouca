// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { HiArrowNarrowRight } from 'react-icons/hi';

import { make_path } from '@/lib/api';

export default function AboveTheFold() {
  return (
    <section className="bg-gradient-to-b from-dark-blue-900 to-dark-blue-700 wsl-min-h-screen-1">
      <div className="grid place-content-center wsl-min-h-screen-1 sm:min-h-[80vh]">
        <div className="px-8 space-y-16 text-center sm:px-4 lg:px-0">
          <div className="space-y-4">
            <h2 className="max-w-3xl mx-auto text-3xl font-bold leading-tight text-white sm:leading-tight xl:leading-tight sm:text-4xl wsl-text-gradient wsl-text-shadow xl:text-5xl">
              Automated Regression Testing
              <br />
              for Critical Software Workflows
            </h2>
            <p className="max-w-2xl text-lg text-gray-300 text-normal sm:text-2xl">
              See the true impact of code changes on the behavior and
              performance of your software.
            </p>
          </div>
          <div className="lg:space-x-8">
            <a
              className="text-lg"
              href="https://app.touca.io"
              target="_blank"
              rel="noopener noreferrer">
              <button
                className="shadow-[0_0_5px_#7dd3fc] p-3 space-x-2 font-medium text-white duration-150 ease-in-out bg-opacity-25 box-shadow rounded-xl focus:outline-none bg-dark-blue-700 hover:bg-opacity-50 group"
                type="button"
                role="button">
                <span>Get Started for Free</span>
                <HiArrowNarrowRight className="inline h-6 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
              </button>
            </a>
            <a
              className="text-md"
              href="https://calendly.com/ghorbanzade/30min"
              target="_blank"
              rel="noopener noreferrer">
              <button
                className="p-3 space-x-2 font-medium text-gray-300 duration-150 ease-in-out bg-opacity-50 hover:text-white rounded-xl focus:outline-none group"
                type="button"
                role="button">
                <span>or Get a Live Demo</span>
              </button>
            </a>
          </div>
        </div>
      </div>
      <div className="hidden max-w-screen-lg px-4 pb-16 mx-auto sm:px-8 sm:block">
        <a
          href="https://touca-public-assets.s3.us-east-2.amazonaws.com/touca-screenshot-suite-page-closed.jpg"
          target="_blank"
          rel="noopener noreferrer">
          <img
            className="shadow-md rounded-xl"
            alt="Touca Continuous Regression Testing"
            src={make_path('/images/touca-atf-visual.jpg')}
            loading="lazy"
          />
        </a>
      </div>
    </section>
  );
}
