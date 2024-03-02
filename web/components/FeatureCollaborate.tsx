// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import React from 'react';
import { HiOutlineUserGroup } from 'react-icons/hi2';

import { DimButton } from '@/components/DimButton';

const input = {
  title: 'Collaborate with your team',
  description: `Share test results with your team members, visualize differences, collaborate in investigating potential regressions, and manage baseline versions.`,
  button: {
    link: 'https://touca.io/docs/basics/interpret/',
    text: 'Keep your stakeholders in the loop',
    title: 'Learn how to work as a team to deal with regressions.'
  }
};

export default function FeatureCollaborate() {
  return (
    <section className="flex items-center bg-dark-blue-900 py-24">
      <div className="container mx-auto">
        <div className="grid gap-16 px-8 lg:grid-cols-5">
          <div className="mx-auto grid place-content-center space-y-6 md:px-0 lg:col-span-2 lg:px-8 xl:px-0">
            <div className="flex">
              <div className="rounded-md bg-dark-blue-800 bg-opacity-50 p-4 text-sky-300">
                <HiOutlineUserGroup size="2em" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <h3>
                <span className="text-3xl font-medium text-white xl:text-4xl">
                  {input.title}
                </span>
              </h3>
            </div>
            <p className="text-2xl text-gray-300">{input.description}</p>
            <DimButton
              link={input.button.link}
              text={input.button.text}
              title={input.button.title}
            />
          </div>
          <div className="grid lg:col-span-3">
            <div className="w-full rounded-xl bg-gradient-to-b from-dark-blue-800 to-dark-blue-900 p-2 md:p-4 xl:p-6">
              <div>
                <img
                  className="rounded-xl drop-shadow"
                  alt="Touca server automatically compares submissions against your baseline version and visualizes any differences."
                  src="https://touca.io/web/external/assets/touca-feature-image-visualization.dark.jpg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
