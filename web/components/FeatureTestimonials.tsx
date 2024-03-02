// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import React from 'react';

import { DimButton } from '@/components/DimButton';

type TestimonialInput = {
  image: string;
  name: string;
  role: string;
  company: string;
  quote: string[];
  learnMore: {
    title: string;
    text: string;
    link: string;
    hidden: boolean;
  };
};

const input: TestimonialInput = {
  image: '/images/touca-customer-testimonial-vital-profile.jpg',
  name: 'Ben Jackson',
  role: 'Principal Software Engineer',
  company: 'Canon Medical Informatics',
  quote: [
    `"We use Touca to perform nightly regression tests of our critical
    workflows. When we make changes to complex software, we need to have
    confidence that there have been no unexpected consequences. Touca gives
    us that confidence by tracking millions of output values computed from
    thousands of input datasets and helping us understand exactly how those
    outputs have changed from one build to the next. That confidence gives
    us leverage to develop new features faster and with fewer problems."`
  ],
  learnMore: {
    title: `Learn how Canon Medical Informatics uses Touca`,
    text: "Read Canon Medical's Story",
    link: 'https://touca.io/docs/stories/vital',
    hidden: true
  }
};

export default function FeatureTestimonials() {
  return (
    <section className="flex items-center justify-center py-24">
      <Testimonial input={input} />
    </section>
  );
}

const Testimonial = ({ input }: { input: TestimonialInput }) => {
  return (
    <div className="container mx-auto space-y-8">
      <div className="mx-auto grid max-w-screen-lg space-y-8 px-8 lg:grid-cols-7 lg:space-x-4 lg:space-y-0">
        <div className="order-last grid rounded-lg bg-opacity-75 px-8 lg:order-first lg:col-span-2 lg:place-content-center lg:bg-gradient-to-b lg:from-dark-blue-800 lg:to-dark-blue-900 lg:px-0">
          <figcaption className="space-y-4 text-center sm:flex sm:items-center sm:space-x-4 sm:space-y-0 lg:block lg:space-x-0 lg:space-y-4">
            <img
              className="mx-auto h-28 w-28 rounded-full lg:h-40 lg:w-40 lg:rounded-lg"
              src={input.image}
              alt={`${input.name}, ${input.role} at ${input.company}`}
              loading="lazy"
              width="160px"
              height="160px"
            />
            <div className="w-full text-center font-medium sm:text-left lg:text-center">
              <div className="text-lg text-yellow-500 lg:text-2xl">
                {input.name}
              </div>
              <div className="text-base text-gray-300 lg:text-lg">
                {input.role}
              </div>
              <div className="text-base text-gray-300 lg:text-lg">
                {input.company}
              </div>
            </div>
          </figcaption>
        </div>
        <div className="space-y-4 rounded-lg bg-opacity-75 bg-gradient-to-b from-dark-blue-800 to-dark-blue-900 p-8 lg:col-span-5">
          <blockquote className="text-lg text-gray-100 lg:text-2xl">
            {input.quote.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </blockquote>
        </div>
      </div>
      {!input.learnMore.hidden && (
        <div className="mx-auto flex max-w-screen-lg justify-end space-y-4 px-8">
          <DimButton
            link={input.learnMore.link}
            text={input.learnMore.text}
            title={input.company}
          />
        </div>
      )}
    </div>
  );
};
