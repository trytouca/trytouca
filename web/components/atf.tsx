// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { HiArrowNarrowRight } from 'react-icons/hi';

import { make_path } from '@/lib/api';

export default function AboveTheFold() {
  return (
    <section className="bg-gradient-to-b from-dark-blue-900 to-dark-blue-700">
      <div className="grid wsl-min-h-screen-1 lg:items-center">
        <div className="container flex items-center mx-auto">
          <div className="grid gap-8 p-8 xl:grid-cols-5 lg:items-center">
            <div className="flex flex-col justify-around h-full py-12 mx-auto space-y-12 xl:col-span-2 lg:py-4 xl:py-0">
              <div className="space-y-4">
                <h2 className="max-w-xl text-3xl font-bold text-white sm:text-4xl wsl-text-gradient xl:text-3xl">
                  Continuous Regression Testing for Critical Software Workflows
                </h2>
                <p className="max-w-xl text-lg text-white sm:text-xl">
                  See the true impact of code changes on the behavior and
                  performance of your software.
                </p>
              </div>
              <div className="items-center space-x-4 text-center md:text-left md:flex">
                <a
                  className="text-lg"
                  href="https://app.touca.io"
                  target="_blank"
                  rel="noopener noreferrer">
                  <button
                    style={{ boxShadow: '0 0 5px #7dd3fc' }}
                    className="p-3 space-x-2 font-medium text-white duration-150 ease-in-out bg-opacity-25 box-shadow rounded-xl focus:outline-none bg-dark-blue-700 hover:bg-opacity-50 group"
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
              <div className="container mx-auto space-y-4">
                <p className="text-white uppercase">Trusted By</p>
                <div className="flex items-center justify-between space-x-2">
                  <a
                    href="https://vitalimages.com"
                    target="_blank"
                    rel="noopener noreferrer">
                    <img
                      src={make_path('/images/touca-customer-logo-vital.svg')}
                      alt="Canon Medical Informatics"
                      loading="lazy"
                      width="250px"
                      height="20px"
                    />
                  </a>
                </div>
              </div>
            </div>
            <div className="items-center hidden w-full h-full p-8 mx-auto select-none xl:col-span-3 sm:flex sm:p-0">
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
          </div>
        </div>
      </div>
    </section>
  );
}
