// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import React from 'react';

import { DimButton } from '@/components/dim-button';

export type TestimonialInput = {
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

export default function FeatureTestimonials(props: {
  input: TestimonialInput[];
}) {
  return (
    <section className="wsl-min-h-screen-3 flex items-center justify-center py-16">
      <Testimonial input={props.input[0]}></Testimonial>
    </section>
  );
}

const Testimonial = (props: { input: TestimonialInput }) => {
  return (
    <div className="container mx-auto space-y-8">
      <div className="mx-auto grid max-w-screen-lg space-y-8 px-8 lg:grid-cols-7 lg:space-y-0 lg:space-x-4">
        <div className="order-last grid rounded-lg bg-opacity-75 px-8 lg:order-first lg:col-span-2 lg:place-content-center lg:bg-gradient-to-b lg:from-dark-blue-800 lg:to-dark-blue-900 lg:px-0">
          <figcaption className="space-y-4 sm:flex sm:items-center sm:space-x-4 sm:space-y-0 lg:block lg:space-y-4 lg:space-x-0">
            <img
              className="mx-auto h-28 w-28 rounded-full lg:h-40 lg:w-40 lg:rounded-lg"
              src={props.input.image}
              alt={`${props.input.name}, ${props.input.role} at ${props.input.company}`}
              loading="lazy"
              width="160px"
              height="160px"
            />
            <div className="w-full text-center font-medium sm:text-left lg:text-center">
              <div className="text-lg text-yellow-500 lg:text-2xl">
                {props.input.name}
              </div>
              <div className="text-base text-gray-300 lg:text-lg">
                {props.input.role}
              </div>
              <div className="text-base text-gray-300 lg:text-lg">
                {props.input.company}
              </div>
            </div>
          </figcaption>
        </div>
        <div className="space-y-4 rounded-lg bg-opacity-75 bg-gradient-to-b from-dark-blue-800 to-dark-blue-900 p-8 lg:col-span-5">
          <blockquote className="text-lg text-gray-100 lg:text-2xl">
            {props.input.quote.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </blockquote>
        </div>
      </div>
      {!props.input.learnMore.hidden && (
        <div className="mx-auto flex max-w-screen-lg justify-end space-y-4 px-8">
          <DimButton
            link={props.input.learnMore.link}
            text={props.input.learnMore.text}
            title={props.input.company}></DimButton>
        </div>
      )}
    </div>
  );
};
