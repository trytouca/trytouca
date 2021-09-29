// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import React from 'react';
import { FaCity } from 'react-icons/fa';

import { DimButton } from '@/components/dim-button';

export type TestimonialInput = {
  image: string;
  title: string;
  subtitle: string;
  quote: string;
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
    <section className="grid wsl-min-h-screen-3 bg-gradient-to-b from-dark-blue-900 via-dark-blue-900 to-dark-blue-800">
      <div className="container grid gap-16 px-8 mx-auto lg:grid-cols-2">
        <div className="grid mx-auto space-y-6 lg:px-8 lg:col-span-1 md:px-0 place-content-center">
          <FaCity className="text-sky-600" size="3rem"></FaCity>
          <h3 className="text-4xl font-bold text-white xl:text-5xl">
            Built for the Enterprise
          </h3>
          <p className="text-2xl text-gray-300">
            Touca started as an internal tool at a medical software company to
            find regressions in low-level components of a mission-critical
            product.
          </p>
        </div>
        <div className="grid mx-auto space-y-6 md:px-0 lg:px-8 xl:px-0 lg:col-span-1 place-content-center">
          <Testimonial input={props.input[0]}></Testimonial>
        </div>
      </div>
    </section>
  );
}

const Testimonial = (props: { input: TestimonialInput }) => {
  return (
    <div className="p-8 space-y-4 bg-opacity-75 rounded-lg shadow-xl bg-dark-blue-800">
      <figcaption className="flex items-center space-x-4">
        <img
          className="w-20 h-20 rounded-2xl"
          src={props.input.image}
          alt={`${props.input.title}, ${props.input.subtitle}`}
          loading="lazy"
        />
        <div className="font-medium">
          <div className="text-lg text-white">{props.input.title}</div>
          <div className="text-base text-sky-600">{props.input.subtitle}</div>
        </div>
      </figcaption>
      <blockquote className="text-gray-300 lg:text-xl">
        <p>{props.input.quote}</p>
      </blockquote>
      {!props.input.learnMore.hidden && (
        <div className="text-right">
          <DimButton
            link={props.input.learnMore.link}
            text={props.input.learnMore.text}
            title={props.input.title}></DimButton>
        </div>
      )}
    </div>
  );
};
