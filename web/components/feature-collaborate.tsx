// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import React from 'react';
import { FaSlack } from 'react-icons/fa';
import { HiChevronRight, HiOutlineMail } from 'react-icons/hi';

import { DimButton } from '@/components/dim-button';
import { FeatureInput } from '@/lib/feature';

export default function FeatureCollaborate(props: { input: FeatureInput }) {
  return (
    <section className="flex items-center wsl-min-h-screen-3 bg-dark-blue-900">
      <div className="container mx-auto">
        <div className="grid gap-16 px-8 lg:grid-cols-2">
          <div className="grid mx-auto space-y-6 md:px-0 lg:px-8 xl:px-0 lg:col-span-1 place-content-center">
            <div className="flex items-center space-x-2">
              <h3>
                <span className="pr-2 text-4xl font-bold text-yellow-500 xl:text-5xl">
                  3.
                </span>
                <span className="text-4xl font-medium text-white xl:text-5xl">
                  {props.input.title}
                </span>
              </h3>
            </div>
            <p className="text-2xl text-gray-300">{props.input.description}</p>
            <div className="flex items-center space-x-2">
              <a
                href={'https://docs.touca.io/basics/integrate'}
                target="_blank"
                rel="noopener noreferrer">
                <div className="p-3 text-gray-400 bg-opacity-50 hover:text-gray-300 bg-dark-blue-800 rounded-xl">
                  <HiOutlineMail size="2rem" />
                </div>
              </a>
              <a
                href={'https://docs.touca.io/basics/integrate'}
                target="_blank"
                rel="noopener noreferrer">
                <div className="p-3 text-gray-400 bg-opacity-50 hover:text-gray-300 bg-dark-blue-800 rounded-xl">
                  <FaSlack size="2rem" />
                </div>
              </a>
            </div>
          </div>
          <div className="grid lg:col-span-1">
            <div className="w-full p-2 md:p-4 xl:p-6 bg-gradient-to-b from-dark-blue-800 to-dark-blue-900 rounded-xl">
              <div className="space-y-4">
                <div className="flex items-center pb-4 space-x-1 font-medium text-white border-b-2 border-blue-500">
                  <span>Acme</span>
                  <HiChevronRight />
                  <span>Tax Calculator</span>
                  <HiChevronRight />
                  <span>5.0</span>
                </div>
                <div className="p-1 space-y-2 text-white">
                  <p>Hi Bob,</p>
                  <p>
                    <span className="font-medium" title="aanderson">
                      Alice Anderson
                    </span>{' '}
                    promoted version <span className="font-medium">v5.0</span>{' '}
                    of suite Tax Calculator as the new baseline. All subsequent
                    versions will now be compared against version{' '}
                    <span className="font-medium">v5.0</span>. They provided the
                    following reason for this change.
                  </p>
                  <p className="p-3 text-gray-200 rounded-lg bg-dark-blue-800">
                    Changed the logic to include child tax credit. Differences
                    for test case <span className="font-mono text-sm">bob</span>
                    are expected.
                  </p>
                </div>
                <div className="pt-4 mx-auto font-medium text-gray-300 border-t-2 border-blue-500">
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
