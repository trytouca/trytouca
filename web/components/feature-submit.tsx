// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

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
    language: 'Python',
    install: 'pip install touca',
    packageRepoLink: 'https://pypi.org/project/touca',
    packageRepoName: 'PyPI',
    repository: 'https://github.com/trytouca/trytouca/tree/main/sdk/python',
    snippet: `import touca
from students import find_student

@touca.workflow
def students_test(username: str):
    student = find_student(username)
    touca.assume("username", student.username)
    touca.check("fullname", student.fullname)
    touca.check("birth_date", student.dob)
    touca.check("gpa", student.gpa)
`
  },
  {
    language: 'C++',
    repository: 'https://github.com/trytouca/trytouca/tree/main/sdk/cpp',
    snippet: `#include "students.hpp"
#include "students_types.hpp"
#include "touca/touca.hpp"

int main(int argc, char* argv[]) {
  touca::workflow("find_student", [](const std::string& username) {
    const auto& student = find_student(username);
    touca::assume("username", student.username);
    touca::check("fullname", student.fullname);
    touca::check("birth_date", student.dob);
    touca::check("gpa", student.gpa);
  });
  return touca::run(argc, argv);
}`
  },

  {
    language: 'Node.js',
    install: 'npm install @touca/node',
    packageRepoLink: 'https://npmjs.com/package/@touca/node',
    packageRepoName: 'NPM',
    repository: 'https://github.com/trytouca/trytouca/tree/main/sdk/js',
    snippet: `import { touca } from "@touca/node";
import { find_student } from "./students";

touca.workflow("students_test", async (username: string) => {
  const student = await find_student(username);
  touca.assume("username", student.username);
  touca.check("fullname", student.fullname);
  touca.check("birth_date", student.dob);
  touca.check("gpa", student.gpa);
});

touca.run();`
  },
  {
    language: 'Java',
    install: 'implementation("io.touca:touca:1.7.0")',
    packageRepoLink: 'https://search.maven.org/artifact/io.touca/touca',
    packageRepoName: 'Maven',
    repository: 'https://github.com/trytouca/trytouca/tree/main/sdk/java',
    snippet: `import io.touca.Touca;

public final class StudentsTest {
  @Touca.Workflow
  public void findStudent(final String username) {
    Student student = Students.findStudent(username);
    Touca.assume("username", student.username);
    Touca.check("fullname", student.fullname);
    Touca.check("birth_date", student.dob);
    Touca.check("gpa", student.gpa);
  }
  public static void main(String[] args) {
    Touca.run(StudentsTest.class, args);
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
    this.state = { activeIndex: 0 };
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
      <section className="flex items-center bg-dark-blue-900 py-24">
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
                  Python
                </button>
                <button
                  onClick={() => this.activate(1)}
                  className={
                    this.state.activeIndex == 1
                      ? `font-bold text-yellow-500`
                      : 'font-bold'
                  }>
                  C++
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
