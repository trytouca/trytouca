/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
 */

import Head from 'next/head';
import { HiArrowNarrowRight } from 'react-icons/hi';
import FooterCta from '@/components/footer-cta';
import SignupForm from '@/components/signup-form';

export default function Home() {
  return (
    <>
      <Head>
        <title>Weasel</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Head>
      <section className="bg-gradient-to-b from-dark-blue-900 to-dark-blue-700">
        <div className="wsl-min-h-screen-1 container mx-auto grid lg:grid-cols-2 lg:gap-4 lg:items-center">
          <div className="col-span-1 mx-auto pt-24 lg:pt-8 p-8 text-white space-y-8">
            <h2 className="wsl-text-gradient wsl-text-shadow max-w-xl text-4xl xl:text-5xl font-bold">
              Continuous regression testing for critical software workflows
            </h2>
            <p className="max-w-xl text-2xl">
              Keep tabs on changes in behavior and performance of your software
              without using snapshot files.
            </p>
            <div>
              <SignupForm></SignupForm>
            </div>
            <button
              className="py-2 font-medium space-x-2 hover:underline focus:underline focus:outline-none group"
              type="button"
              role="button">
              <span>Get a Live Demo</span>
              <HiArrowNarrowRight className="inline h-4 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
            </button>
            <div className="container mx-auto space-y-4">
              <p className="text-white uppercase">Trusted By</p>
              <div className="flex space-x-2">
                <a
                  href="https://vitalimages.com"
                  target="_blank"
                  rel="noopener">
                  <img
                    className="text-gray-50"
                    src="/images/weasel-customer-logo-vital.svg"
                    alt="Vital Images, Inc."
                  />
                </a>
              </div>
            </div>
          </div>
          <div className="col-span-1 max-w-screen-md h-full w-full mx-auto px-8 pb-8 lg:py-0 lg:px-4 select-none flex items-center">
            <img
              className="rounded-lg shadow-md"
              alt="A Screen Shot of Weasel Regression Testing Platform"
              src="/images/weasel-atf-visual.png"
            />
          </div>
        </div>
      </section>
      <section className="py-8 min-h-[25vh] flex items-center bg-dark-blue-800">
        <div className="container mx-auto px-8 md:px-24 lg:px-8">
          <FooterCta></FooterCta>
        </div>
      </section>
    </>
  );
}
