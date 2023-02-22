// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import React from 'react';
import { FiTerminal } from 'react-icons/fi';

import { tracker } from '@/lib/tracker';

const snippets: {
  lang: string;
  language: string;
  install?: string;
  packageRepoLink?: string;
  packageRepoName?: string;
  repository: string;
  snippet: string;
}[] = [
  {
    lang: 'python',
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
    lang: 'cpp',
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
    lang: 'js',
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
    lang: 'java',
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

export default class FeatureDiff extends React.Component {
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
          <div className="grid gap-16 px-8 lg:grid-cols-5">
            <div className="mx-auto grid place-content-center space-y-6 md:px-0 lg:col-span-2 lg:px-8 xl:px-0">
              <div className="flex">
                <div className="rounded-md bg-dark-blue-800 bg-opacity-50 p-4 text-sky-300">
                  <FiTerminal size="2rem" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <h3 className="text-3xl font-medium text-white xl:text-4xl">
                  Snapshot testing without snapshot files
                </h3>
              </div>
              <p className="text-2xl text-gray-300">
                Remotely compare the your software output against a previous
                baseline version.
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
}
