// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import React from 'react';

import CodeSnippet from '@/components/code-snippet';
import { DimButton } from '@/components/dim-button';
import { FeatureInput } from '@/lib/feature';

const snippets = [
  {
    snippet: `#include "touca/touca.hpp"
#include "touca/touca_main.hpp"
#include "code_under_test.hpp"

void touca::main(const std::string& testcase) {
  const auto number = std::stoul(testcase);
  touca::add_result("output", is_prime(number));
}`,
    language: 'cpp',
    repository: 'https://github.com/trytouca/touca-cpp'
  },
  {
    snippet: `import touca

@touca.Workflow
def is_prime(testcase: str):
  touca.add_result("output", is_prime(int(testcase)))

if __name__ == "__main__":
  touca.run()`,
    language: 'python',
    repository: 'https://github.com/trytouca/touca-python'
  },
  {
    snippet: `import { touca } from "@touca/node";
import { is_prime } from "./code_under_test";

touca.workflow("is_prime", (testcase: string) => {
  const input = is_prime(Number.parseInt(testcase));
  touca.add_result("output", input);
});

touca.run();`,
    language: 'typescript',
    repository: 'https://github.com/trytouca/touca-js'
  },
  {
    snippet: `import io.touca.Touca;

public final class PrimeTest {

  @Touca.Workflow
  public void isPrime(final String testcase) {
    final int number = Integer.parseInt(testcase);
    Touca.addResult("output", Prime.isPrime(number));
  }
}`,
    language: 'java',
    repository: 'https://github.com/trytouca/touca-java'
  }
];

export default class FeatureSubmit extends React.Component<
  { input: FeatureInput },
  { activeIndex: number }
> {
  constructor(props) {
    super(props);
    this.state = { activeIndex: 1 };
    this.activate = this.activate.bind(this);
  }

  activate(index: number) {
    this.setState({ activeIndex: index });
  }

  render() {
    return (
      <section className="flex items-center wsl-min-h-screen-3 bg-dark-blue-900">
        <div className="container mx-auto">
          <div className="grid gap-16 px-8 lg:grid-cols-2">
            <div className="grid mx-auto space-y-6 md:px-0 lg:px-8 xl:px-0 lg:col-span-1 place-content-center">
              <div className="flex items-center space-x-2">
                <h3>
                  <span className="pr-2 text-4xl font-bold text-yellow-500 xl:text-5xl">
                    1.
                  </span>
                  <span className="text-4xl font-medium text-white xl:text-5xl">
                    {this.props.input.title}
                  </span>
                </h3>
              </div>
              <p className="text-2xl text-gray-300">
                {this.props.input.description}
              </p>
              <div className="space-x-4 text-right text-white">
                <button
                  onClick={() => this.activate(0)}
                  className={
                    this.state.activeIndex == 0
                      ? `font-bold text-yellow-500`
                      : 'font-bold'
                  }>
                  C++
                </button>
                <button
                  onClick={() => this.activate(1)}
                  className={
                    this.state.activeIndex == 1
                      ? `font-bold text-yellow-500`
                      : 'font-bold'
                  }>
                  Python
                </button>
                <button
                  onClick={() => this.activate(2)}
                  className={
                    this.state.activeIndex == 2
                      ? `font-bold text-yellow-500`
                      : 'font-bold'
                  }>
                  JavaScript
                </button>
                <button
                  onClick={() => this.activate(3)}
                  className={
                    this.state.activeIndex == 3
                      ? `font-bold text-yellow-500`
                      : 'font-bold'
                  }>
                  Java
                </button>
              </div>
            </div>
            <div className="grid lg:col-span-1">
              <CodeSnippet
                input={{
                  code: snippets[this.state.activeIndex].snippet,
                  language: snippets[this.state.activeIndex].language
                }}></CodeSnippet>
            </div>
          </div>
          <div className="px-8 py-8 text-right lg:py-0">
            <DimButton
              link={this.props.input.button.link}
              text={this.props.input.button.text}
              title={this.props.input.button.title}></DimButton>
          </div>
        </div>
      </section>
    );
  }
}
