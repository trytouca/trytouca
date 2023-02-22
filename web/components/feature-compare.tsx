// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import React from 'react';

import { DimButton } from '@/components/dim-button';
import { FeatureInput } from '@/lib/feature';

export default function FeatureAnalytics(props: { input: FeatureInput }) {
  const Icon = props.input.icon;
  return (
    <section className="flex items-center bg-dark-blue-900 py-24">
      <div className="container mx-auto">
        <div className="grid gap-16 px-8 lg:grid-cols-5">
          <div className="mx-auto grid place-content-center space-y-6 md:px-0 lg:col-span-2 lg:px-8 xl:px-0">
            <div className="flex">
              <div className="rounded-md bg-dark-blue-800 bg-opacity-50 p-4 text-sky-300">
                <Icon size="2rem" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <h3>
                <span className="text-3xl font-medium text-white xl:text-4xl">
                  {props.input.title}
                </span>
              </h3>
            </div>
            <p className="text-2xl text-gray-300">{props.input.description}</p>
            <DimButton
              link={props.input.button.link}
              text={props.input.button.text}
              title={props.input.button.title}
            />
          </div>
          <div className="grid lg:col-span-3">
            <div className="w-full rounded-xl bg-gradient-to-b from-dark-blue-800 to-dark-blue-900 p-2 md:p-4 xl:p-6">
              <div>
                <img
                  className="rounded-xl drop-shadow"
                  alt="Touca server automatically compares submissions against your baseline version and visualizes any differences."
                  src="https://touca.io/web/external/assets/touca-feature-metrics.dark.jpg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
