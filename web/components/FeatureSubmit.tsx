// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.
'use client';

import React, { useState } from 'react';
import { FaBook, FaGithub } from 'react-icons/fa';
import { FiCode } from 'react-icons/fi';

import CodeSnippet from '@/components/CodeSnippet';
import { tracker } from '@/components/utils/tracker';

const input = {
  title: 'Write regression tests, the easy way',
  description: `Test your complex software workflows for any number of inputs by capturing values of variables and runtime of functions.`,
  button: {
    link: 'https://touca.io/docs/sdk/main-api',
    text: 'Learn More',
    title: ''
  }
};

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

export default function FeatureSubmit() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="flex items-center bg-dark-blue-900 py-24">
      <div className="container mx-auto">
        <div className="grid gap-16 px-8 lg:grid-cols-5">
          <div className="mx-auto grid place-content-center space-y-6 md:px-0 lg:col-span-2 lg:px-8 xl:px-0">
            <div className="flex">
              <div className="rounded-md bg-dark-blue-800 bg-opacity-50 p-4 text-sky-300">
                <FiCode size="2em" />
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
            <div className="space-x-4 text-right text-white">
              {['Python', 'C++', 'JavaScript', 'Java'].map((lang, index) => (
                <button
                  key={index}
                  onClick={() => {
                    tracker.track(
                      { action: 'sdk-activate' },
                      { language: snippets[index].language }
                    );
                    setActiveIndex(index);
                  }}
                  className={
                    activeIndex == index
                      ? `font-bold text-yellow-500`
                      : 'font-bold'
                  }>
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="grid space-y-4 lg:col-span-3">
            <CodeSnippet
              input={{
                code: snippets[activeIndex].snippet,
                language: snippets[activeIndex].language
              }}
            />
            <div className="flex items-center justify-between space-x-2">
              {snippets[activeIndex].packageRepoLink ? (
                <a
                  href={snippets[activeIndex].packageRepoLink}
                  title={`Checkout our ${snippets[activeIndex].language} SDK on ${snippets[activeIndex].packageRepoName}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  <div className="rounded-xl bg-dark-blue-800 bg-opacity-50 p-4 font-mono text-sky-300">
                    {snippets[activeIndex].install}
                  </div>
                </a>
              ) : (
                <div></div>
              )}
              <div className="flex items-center space-x-2">
                <a
                  href={snippets[activeIndex].repository}
                  title={`Checkout our ${snippets[activeIndex].language} SDK on GitHub`}
                  target="_blank"
                  rel="noopener noreferrer">
                  <div className="rounded-xl bg-dark-blue-800 bg-opacity-50 p-3 text-gray-400 hover:text-gray-300">
                    <FaGithub size="2em" />
                  </div>
                </a>
                <a
                  href={`${input.button.link}/?sdk=${snippets[activeIndex].lang}`}
                  title="Read our SDK Docs"
                  target="_blank"
                  rel="noopener noreferrer">
                  <div className="rounded-xl bg-dark-blue-800 bg-opacity-50 p-3 text-gray-400 hover:text-gray-300">
                    <FaBook size="2em" />
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
