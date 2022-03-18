// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import React from 'react';
import { FaGithub } from 'react-icons/fa';

import { DimButton } from '@/components/dim-button';
import { FeatureInput } from '@/lib/feature';

export default function FeatureAutomate(props: { input: FeatureInput }) {
  const lines: ProgressLineInput[] = [
    {
      status: 'PASS',
      statusBackground: 'bg-green-900 py-1',
      row: 1,
      testcaseName: 'Joseph Buquet',
      duration: 222
    },
    {
      status: 'PASS',
      statusBackground: 'bg-green-900 py-1',
      row: 2,
      testcaseName: 'Christine Daaé',
      duration: 235
    },
    {
      status: 'PASS',
      statusBackground: 'bg-green-900 py-1',
      row: 3,
      testcaseName: 'Raoul de Chagny',
      duration: 253
    },
    {
      status: 'SKIP',
      statusBackground: 'bg-yellow-800 py-1',
      row: 4,
      testcaseName: 'Marius Pontmercy'
    },
    {
      status: 'PASS',
      statusBackground: 'bg-green-900 py-1',
      row: 5,
      testcaseName: 'Jean Valjean',
      duration: 249
    }
  ];
  return (
    <section className="wsl-min-h-screen-3 flex items-center bg-dark-blue-900">
      <div className="container mx-auto">
        <div className="grid gap-16 px-8 lg:grid-cols-2">
          <div className="mx-auto grid place-content-center space-y-6 md:px-0 lg:col-span-1 lg:px-8 xl:px-0">
            <div className="flex items-center space-x-2">
              <h3>
                <span className="pr-2 text-4xl font-bold text-yellow-500 xl:text-5xl">
                  4.
                </span>
                <span className="text-4xl font-medium text-white xl:text-5xl">
                  {props.input.title}
                </span>
              </h3>
            </div>
            <p className="text-2xl text-gray-300">{props.input.description}</p>
            <div className="group flex items-center space-x-2">
              <a
                href={'https://github.com/trytouca/touca-python'}
                target="_blank"
                rel="noopener noreferrer">
                <div className="rounded-xl bg-dark-blue-800 bg-opacity-50 p-4 font-mono text-sky-300">
                  pip install touca
                </div>
              </a>
              <a
                href={'https://github.com/trytouca/touca-python'}
                target="_blank"
                rel="noopener noreferrer">
                <div className="rounded-xl bg-dark-blue-800 bg-opacity-50 p-3 text-gray-400 group-hover:text-gray-300">
                  <span className="sr-only">GitHub</span>
                  <FaGithub size="2rem" />
                </div>
              </a>
            </div>
          </div>
          <div className="grid font-mono font-medium text-gray-100 lg:col-span-1">
            <div className="w-full select-none rounded-xl bg-gradient-to-b from-dark-blue-800 to-dark-blue-900 p-4 text-sm sm:text-base md:p-6 md:text-lg xl:p-8">
              <p>Touca Test Framework</p>
              <p>Suite: sample/1.0</p>
              <p>
                <br></br>
              </p>
              <ProgressLine input={lines[0]}></ProgressLine>
              <ProgressLine input={lines[1]}></ProgressLine>
              <ProgressLine input={lines[2]}></ProgressLine>
              <ProgressLine input={lines[3]}></ProgressLine>
              <ProgressLine input={lines[4]}></ProgressLine>
              <p>
                <br></br>
              </p>
              <p>
                <span className="inline-block min-w-[7rem]">Tests:</span>
                <span className="text-green-600">5 passed</span>
                <span>, </span>
                <span className="text-yellow-500">1 skipped</span>
                <span>, 5 total</span>
              </p>
              <p>
                <span className="inline-block min-w-[7rem]">Time:</span>
                <span>1.01 s</span>
              </p>
              <p>
                <br></br>
              </p>
              <p>✨ Ran all test suites.</p>
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

interface ProgressLineInput {
  row: number;
  status: string;
  statusBackground: string;
  testcaseName: string;
  duration?: number;
}

const ProgressLine = (props: { input: ProgressLineInput }) => {
  return (
    <p className="space-x-3">
      <span>
        <span className="text-gray-400">{props.input.row}.</span>
      </span>
      <span className={props.input.statusBackground + ' px-2'}>
        {props.input.status}
      </span>
      <span className="inline-block min-w-[12rem]">
        {props.input.testcaseName}
      </span>
      {props.input.duration && (
        <span className="text-gray-400">({props.input.duration} ms)</span>
      )}
    </p>
  );
};
