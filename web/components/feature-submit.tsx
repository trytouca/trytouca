// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import React from 'react';
import { FaBook, FaGithub } from 'react-icons/fa';

import CodeSnippet from '@/components/code-snippet';
import { FeatureInput } from '@/lib/feature';
import { tracker } from '@/lib/tracker';

const snippets: {
  language: string;
  install?: string;
  packageRepoLink?: string;
  packageRepoName?: string;
  repository: string;
  snippet: string;
}[] = [
  {
    language: 'C++',
    repository: 'https://github.com/trytouca/trytouca/tree/main/sdk/cpp',
    snippet: `#include "touca/touca.hpp"
#include "code_under_test.hpp"

int main(int argc, char* argv[]) {
  touca::workflow("is_prime", [](const std::string& testcase) {
    const auto number = std::stoul(testcase);
    touca::check("output", is_prime(number));
  });
  touca::run(argc, argv);
}`
  },
  {
    language: 'Python',
    install: 'pip install touca',
    packageRepoLink: 'https://pypi.org/project/touca',
    packageRepoName: 'PyPI',
    repository: 'https://github.com/trytouca/trytouca/tree/main/sdk/python',
    snippet: `import touca

@touca.workflow
def is_prime(testcase: str):
  touca.check("output", is_prime(int(testcase)))
`
  },
  {
    language: 'Node.js',
    install: 'npm install @touca/node',
    packageRepoLink: 'https://npmjs.com/package/@touca/node',
    packageRepoName: 'NPM',
    repository: 'https://github.com/trytouca/trytouca/tree/main/sdk/js',
    snippet: `import { touca } from "@touca/node";
import { is_prime } from "./code_under_test";

touca.workflow("is_prime", (testcase: string) => {
  const input = is_prime(Number.parseInt(testcase));
  touca.check("output", input);
});

touca.run();`
  },
  {
    language: 'Java',
    install: 'implementation("io.touca:touca:1.6.0")',
    packageRepoLink: 'https://search.maven.org/artifact/io.touca/touca',
    packageRepoName: 'Maven',
    repository: 'https://github.com/trytouca/trytouca/tree/main/sdk/java',
    snippet: `import io.touca.Touca;

public final class PrimeTest {

  @Touca.Workflow
  public void isPrime(final String testcase) {
    final int number = Integer.parseInt(testcase);
    Touca.check("output", Prime.isPrime(number));
  }
}`
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
    tracker.track(
      { action: 'sdk-activate' },
      { language: snippets[index].language }
    );
    this.setState({ activeIndex: index });
  }

  render() {
    return (
      <section className="wsl-min-h-screen-3 flex items-center bg-dark-blue-900">
        <div className="container mx-auto">
          <div className="grid gap-16 px-8 lg:grid-cols-2">
            <div className="mx-auto grid place-content-center space-y-6 md:px-0 lg:col-span-1 lg:px-8 xl:px-0">
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
            <div className="grid space-y-4 lg:col-span-1">
              <CodeSnippet
                input={{
                  code: snippets[this.state.activeIndex].snippet,
                  language: snippets[this.state.activeIndex].language
                }}></CodeSnippet>
              <div className="flex items-center justify-between space-x-2">
                {snippets[this.state.activeIndex].packageRepoLink ? (
                  <a
                    href={snippets[this.state.activeIndex].packageRepoLink}
                    title={`Checkout our ${
                      snippets[this.state.activeIndex].language
                    } SDK on ${
                      snippets[this.state.activeIndex].packageRepoName
                    }`}
                    target="_blank"
                    rel="noopener noreferrer">
                    <div className="rounded-xl bg-dark-blue-800 bg-opacity-50 p-4 font-mono text-sky-300">
                      {snippets[this.state.activeIndex].install}
                    </div>
                  </a>
                ) : (
                  <div></div>
                )}
                <div className="flex items-center space-x-2">
                  <a
                    href={snippets[this.state.activeIndex].repository}
                    title={`Checkout our ${
                      snippets[this.state.activeIndex].language
                    } SDK on GitHub`}
                    target="_blank"
                    rel="noopener noreferrer">
                    <div className="rounded-xl bg-dark-blue-800 bg-opacity-50 p-3 text-gray-400 hover:text-gray-300">
                      <FaGithub size="2rem" />
                    </div>
                  </a>
                  <a
                    href={this.props.input.button.link}
                    title="Read our SDK Documentation"
                    target="_blank"
                    rel="noopener noreferrer">
                    <div className="rounded-xl bg-dark-blue-800 bg-opacity-50 p-3 text-gray-400 hover:text-gray-300">
                      <FaBook size="2rem" />
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
