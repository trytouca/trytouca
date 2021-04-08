/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
 */

import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon } from '@heroicons/react/solid';

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
      <section>
        <div className="wsl-min-h-screen-1 lg:flex">
          <div className="container mx-auto grid lg:grid-cols-2 lg:gap-4 lg:items-center">
            <div className="col-span-1 mx-auto pt-24 lg:pt-8 p-8 space-y-8 text-white">
              <h2 className="wsl-text-shadow' max-w-xl text-4xl xl:text-5xl font-bold">
                Continuous regression testing for critical software workflows
              </h2>
              <p className="max-w-xl text-2xl">
                Keep tabs on changes in behavior and performance of your
                software without using snapshot files.
              </p>
              <div>
                <p className="mt-2">
                  You can explore Weasel in action using the test results in our
                  playground.
                </p>
              </div>
              <button
                className="py-2 space-x-2 font-medium hover:underline focus:underline focus:outline-none group"
                type="button"
                role="button">
                <span>Get a Live Demo</span>
                <ArrowRightIcon className="inline h-4 opacity-50 group-hover:opacity-100"></ArrowRightIcon>
              </button>
              <div className="container mx-auto space-y-4">
                <p className="text-white uppercase">Trusted By</p>
                <div className="flex space-x-2">
                  <Link
                    href="https://vitalimages.com"
                    target="_blank"
                    rel="noopener">
                    <a>
                      <Image
                        className="text-gray-50"
                        priority
                        src="/images/weasel-customer-logo-vital.svg"
                        height={20}
                        width={250}
                        alt="Vital Images, Inc."
                      />
                    </a>
                  </Link>
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
        </div>
      </section>
    </>
  );
}
