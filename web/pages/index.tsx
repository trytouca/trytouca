/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
 */

import Head from 'next/head';
import { FaCity } from 'react-icons/fa';
import { HiArrowNarrowRight } from 'react-icons/hi';
import FooterCta from '@/components/footer-cta';
import SignupForm from '@/components/signup-form';

const DimButton = (props: Record<'link' | 'text' | 'title', string>) => {
  return (
    <a href={props.link} title={props.title} target="_blank">
      <button
        className="px-4 py-2 bg-dark-blue-700 bg-opacity-25 text-light-blue-600 hover:text-light-blue-500 font-medium rounded-full space-x-1 focus:underline focus:outline-none group"
        type="button"
        role="button">
        <span className="text-sm leading-6 font-medium">{props.text}</span>
        <HiArrowNarrowRight className="inline h-6 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
      </button>
    </a>
  );
};

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
            <div>
              <a
                href="https://calendly.com/ghorbanzade/30min"
                target="_blank"
                rel="noopener noreferrer">
                <button
                  className="py-2 font-medium space-x-2 hover:underline focus:underline focus:outline-none group"
                  type="button"
                  role="button">
                  <span>Get a Live Demo</span>
                  <HiArrowNarrowRight className="inline h-4 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
                </button>
              </a>
            </div>
            <div className="container mx-auto space-y-4">
              <p className="text-white uppercase">Trusted By</p>
              <div className="flex space-x-2">
                <a
                  href="https://vitalimages.com"
                  target="_blank"
                  rel="noopener noreferrer">
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
      <section className="bg-gradient-to-r from-dark-blue-900 via-dark-blue-800 to-dark-blue-800">
        <p className="p-8 mx-auto container text-center text-xl text-white font-semibold">
          We make maintaining software 10x more efficient.
        </p>
      </section>
      <section className="wsl-min-h-screen-1 bg-gradient-to-b from-dark-blue-900 via-dark-blue-900 to-dark-blue-800 grid">
        <div className="container mx-auto grid gap-16 lg:grid-cols-2">
          <div className="max-w-xl mx-auto col-span-1 px-8 md:px-0 grid place-content-center space-y-6">
            <FaCity className="text-gray-500" size="3rem"></FaCity>
            <h3 className="text-4xl xl:text-5xl text-white font-bold">
              Built for the Enterprise
            </h3>
            <p className="text-2xl text-gray-300">
              Weasel started as an internal tool at a medical software company
              to find regressions in low-level components of a mission-critical
              product.
            </p>
          </div>
          <div className="max-w-xl mx-auto col-span-1 px-8 md:px-0 grid place-content-center">
            <div className="bg-dark-blue-800 bg-opacity-75 p-8 rounded-lg shadow-xl space-y-4">
              <figcaption className="flex items-center space-x-4">
                <img
                  className="w-20 h-20 rounded-2xl"
                  src="/images/weasel-customer-testimonial-vital-profile.jpg"
                />
                <div className="font-medium">
                  <div className="text-lg text-white">Pejman Ghorbanzade</div>
                  <div className="text-light-blue-600 text-base">
                    Sr. Software Engineer at Vital Images, Inc.
                  </div>
                </div>
              </figcaption>
              <blockquote className="text-gray-300 text-xl">
                <p>
                  "We use Weasel at scale to perform nightly regression tests of
                  some of our critical workflows with thousands of datasets. It
                  has helped us quickly identify unintended side effects of our
                  code changes before they become too expensive to fix. I like
                  how easy it is to write new regression tests and automate
                  their execution."
                </p>
              </blockquote>
              <div className="text-right">
                <DimButton
                  link="https://docs.getweasel.com/stories/vital"
                  text="Read Vital Images' Story"
                  title="Learn more about how Vital Images uses Weasel"></DimButton>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-32 lg:pt-8 min-h-[25vh] flex items-center bg-dark-blue-800">
        <div className="container mx-auto px-8 md:px-24 lg:px-8">
          <FooterCta></FooterCta>
        </div>
      </section>
    </>
  );
}
