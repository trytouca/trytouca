// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import React from 'react';
import { HiChevronRight } from 'react-icons/hi';

import { DimButton } from '@/components/dim-button';
import { FeatureInput } from '@/lib/feature';

export default function FeatureCompare(props: { input: FeatureInput }) {
  return (
    <section className="wsl-min-h-screen-3 flex items-center bg-dark-blue-900">
      <div className="container mx-auto">
        <div className="grid gap-16 px-8 lg:grid-cols-2">
          <div className="mx-auto grid place-content-center space-y-6 md:px-0 lg:col-span-1 lg:px-8 xl:px-0">
            <div className="flex items-center space-x-2">
              <h3>
                <span className="pr-2 text-4xl font-bold text-yellow-500 xl:text-5xl">
                  2.
                </span>
                <span className="text-4xl font-medium text-white xl:text-5xl">
                  {props.input.title}
                </span>
              </h3>
            </div>
            <p className="text-2xl text-gray-300">{props.input.description}</p>
          </div>
          <div className="grid lg:col-span-1">
            <div className="w-full rounded-xl bg-gradient-to-b from-dark-blue-800 to-dark-blue-900 p-2 md:p-4 xl:p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-1 border-b-2 border-green-500 pb-4 font-medium text-white">
                  <span>Acme</span>
                  <HiChevronRight />
                  <span>Tax Calculator</span>
                  <HiChevronRight />
                  <span>2.0</span>
                </div>
                <div className="space-y-2 p-1 text-white">
                  <p>Hi Bob,</p>
                  <p>
                    A new version <span className="font-bold">v2.0</span> was
                    submitted for suite Tax Calculator.
                  </p>
                  <p>
                    We compared this version against{' '}
                    <span className="font-bold">v1.0</span> (baseline). We found
                    no differences between common test cases. There were no new
                    or missing test cases.
                  </p>
                </div>
                <div className="mx-auto border-t-2 border-green-500 pt-4 font-medium text-gray-300">
                  View Results
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-8 py-8 text-right lg:py-0">
          <DimButton
            link={props.input.button.link}
            text={props.input.button.text}
            title={props.input.button.title}></DimButton>
        </div>
      </div>
    </section>
  );
}
