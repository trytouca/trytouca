// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import React from 'react';
import { FiTerminal } from 'react-icons/fi';

export default function FeatureDiff() {
  return (
    <section className="flex items-center bg-dark-blue-900 py-24">
      <div className="container mx-auto">
        <div className="grid gap-16 px-8 lg:grid-cols-5">
          <div className="mx-auto grid place-content-center space-y-6 md:px-0 lg:col-span-2 lg:px-8 xl:px-0">
            <div className="flex">
              <div className="rounded-md bg-dark-blue-800 bg-opacity-50 p-4 text-sky-300">
                <FiTerminal size="2em" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <h3 className="text-3xl font-medium text-white xl:text-4xl">
                Snapshot testing without snapshot files
              </h3>
            </div>
            <p className="text-2xl text-gray-300">
              Remotely compare your software output against a previous baseline
              version.
            </p>
            <div className="space-x-4 text-right text-white"></div>
            <div className="flex items-center justify-between space-x-2">
              <div className="rounded-xl bg-dark-blue-800 bg-opacity-50 p-4 font-mono text-sky-300">
                brew install touca
              </div>
            </div>
          </div>
          <div className="grid lg:col-span-3">
            <div className="w-full rounded-xl bg-gradient-to-b from-dark-blue-800 to-dark-blue-900 p-2 md:p-4 xl:p-6">
              <div>
                <img
                  className="rounded-xl drop-shadow"
                  alt="Touca server automatically compares submissions against your baseline version and visualizes any differences."
                  src="https://touca.io/web/external/assets/touca-feature-inline-diff.dark.png"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
