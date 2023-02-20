# Touca JavaScript SDK

[![npm version](https://img.shields.io/npm/v/@touca/node?color=blue)](https://www.npmjs.com/package/@touca/node)
[![License](https://img.shields.io/npm/l/@touca/node?color=blue)](https://github.com/trytouca/trytouca/blob/main/sdk/js/LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/trytouca/trytouca/build.yml?branch=main)](https://github.com/trytouca/trytouca/actions/workflows/build.yml)
[![Code Coverage](https://img.shields.io/codecov/c/github/trytouca/trytouca)](https://app.codecov.io/gh/trytouca/trytouca)

## Install

Touca is available [on NPM](https://www.npmjs.com/package/@touca/node):

```bash
npm install --save-dev @touca/node
```

This package is
[pure ESM](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)
and works with Node 14 or newer.

## Sneak Peek

> For a more thorough guide of how to use Touca SDK for JavaScript, see our
> [documentation website](https://touca.io/docs).

Let us imagine that we want to test a software workflow that takes the username
of a student and provides basic information about them.

```ts
import { find_student } from "code_under_test";

test("test_find_student", () => {
  const alice = find_student("alice");
  expect(alice.fullname).toEqual("Alice Anderson");
  expect(alice.dob).toEqual({2006, 3, 1});
  expect(alice.gpa).toEqual(3.9);
});
```

We can use unit testing in which we hard-code expected values for each input.
But real-world software is complex:

- We need a large number of test inputs to gain confidence that our software
  works as expected.
- Describing the expected behavior of our software for each test input is
  difficult.
- When we make intentional changes to the behavior of our software, updating our
  expected values is cumbersome.

Touca is effective in testing software workflows that need to handle a large
variety of inputs or whose expected behavior is difficult to hard-code.

```ts
import { touca } from '@touca/node';
import { find_student } from './students';

touca.workflow('students_test', async (username: string) => {
  const student = await find_student(username);
  touca.assume('username', student.username);
  touca.check('fullname', student.fullname);
  touca.check('birth_date', student.dob);
  touca.check('gpa', student.gpa);
});

touca.run();
```

This is slightly different from a typical unit test:

- Touca tests do not use expected values.
- Touca tests do not hard-code input values.

With Touca, we describe how we run our code under test for any given test case.
We can capture values of interesting variables and runtime of important
functions to describe the behavior and performance of our workflow for that test
case.

![Sample Test Output](https://touca.io/docs/external/assets/touca-run-js.dark.gif)

Now if we make changes to our workflow under test, we can rerun this test and
let Touca automatically compare our captured data points against those of a
previous baseline version and report any difference in behavior or performance.

## Documentation

- [Documentation Website](https://touca.io/docs): If you are new to Touca, this
  is the best place to start.
- [JavaScript SDK API Reference](https://touca.io/docs/external/sdk/js/index.html):
  Auto-generated source code documentation for Touca JavaScript SDK with
  explanation about individual API functions.
- [JavaScript Examples](https://github.com/trytouca/trytouca/tree/main/examples/js):
  Sample JavaScript projects that show how to use Touca in various real-world
  use-cases.

## Community

We hang on [Discord](https://touca.io/discord). Come say hi! We love making new
friends. If you need help, have any questions, or like to contribute or provide
feedback, that's the best place to be.

## Contributing

We welcome all forms of contributions, from adding new features to improving
documentation and sharing feedback.

- [Code of Conduct](https://touca.io/docs/contributing/conduct/)
- [Contributing Guide](https://touca.io/docs/contributing/)
- [Good First Issues](https://touca.io/docs/contributing/good-first-issues/)

## License

This repository is released under the Apache-2.0 License. See
[`LICENSE`](https://github.com/trytouca/trytouca/blob/main/sdk/js/LICENSE).
