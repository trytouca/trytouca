// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import React from 'react';

import CodeSnippet from '@/components/code-snippet';
import { DimButton } from '@/components/dim-button';
import { FeatureInput } from '@/lib/feature';

const snippet = `
Touca Test Framework
Suite: acme/tax-calculator
Version: 6.0

 (  1 of 5  ) Joseph Buquet          (pass, 118 ms)
 (  2 of 5  ) Christine Daaé         (pass, 97  ms)
 (  3 of 5  ) Raoul de Chagny        (pass, 132 ms)
 (  4 of 5  ) Marius Pontmercy       (pass, 50  ms)
 (  5 of 5  ) Jean Valjean           (pass, 640 ms)

Processed 5 of 5 testcases
Test completed in 1062 ms
`;

export default function FeatureAutomate(props: { input: FeatureInput }) {
  return (
    <section className="flex items-center wsl-min-h-screen-1 bg-dark-blue-900">
      <div className="container mx-auto">
        <div className="grid gap-16 px-8 lg:grid-cols-2">
          <div className="grid mx-auto space-y-6 md:px-0 lg:px-8 xl:px-0 lg:col-span-1 place-content-center">
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
          </div>
          <div className="grid lg:col-span-1">
            <CodeSnippet
              input={{
                code: snippet.trim(),
                language: 'python'
              }}></CodeSnippet>
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
