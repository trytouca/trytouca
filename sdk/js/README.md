# Touca JavaScript SDK

Write regression tests, the easy way.

[![npm version](https://img.shields.io/npm/v/@touca/node?color=blue)](https://www.npmjs.com/package/@touca/node)
[![License](https://img.shields.io/npm/l/@touca/node?color=blue)](https://github.com/trytouca/trytouca/blob/main/sdk/js/LICENSE)
[![Build Status](https://img.shields.io/github/workflow/status/trytouca/trytouca/touca-build)](https://github.com/trytouca/trytouca/actions/workflows/build.yml?query=branch:main+event:push)
[![Code Coverage](https://img.shields.io/codecov/c/github/trytouca/trytouca)](https://app.codecov.io/gh/trytouca/trytouca)

```ts
import { touca } from '@touca/node';
import { important_workflow } from './code_under_test';

touca.workflow('test_important_workflow', (testcase: string) => {
  const number = Number.parseInt(testcase);
  touca.check('output', important_workflow(number));
});

touca.run();
```

## Table of Contents

- [Requirements](#requirements)
- [Install](#install)
- [Usage](#usage)
- [Documentation](#documentation)
- [Community](#community)
- [Contributing](#contributing)
- [FAQ](#faq)
- [License](#license)

## Requirements

- Node 12 or newer

## Install

You can install Touca with [npm](https://www.npmjs.com/package/@touca/node):

```bash
npm install --save-dev @touca/node
```

## Usage

Suppose we want to test a software that checks whether a given number is prime.

```ts
export function is_prime(input: number): boolean {
  for (let i = 2; i < input; i++) {
    if (input % i === 0) {
      return false;
    }
  }
  return 1 < input;
}
```

We can use unit testing in which we verify that the _actual_ output of our
function matches our _expected_ output, for a small set of possible inputs.

```ts
import { is_prime } from './is_prime';

test('is_prime_test', () => {
  expect(is_prime(2)).toEqual(true);
  expect(is_prime(4)).toEqual(false);
});
```

Touca is different from unit testing:

- Touca tests do not hard-code input values.
- Touca tests do not hard-code expected outcome.

```ts
import { touca } from '@touca/node';
import { is_prime } from './is_prime';

touca.workflow('is_prime_test', (testcase: string) => {
  const number = Number.parseInt(testcase);
  touca.check('output', is_prime(number));
});

touca.run();
```

With Touca, instead of verifying that the actual behavior of our software
matches our expected behavior, we compare it against the actual behavior of a
previous _baseline_ version. This approach has two benefits:

- We can test our software with a much larger set of possible inputs.
- We won't need to change our test code when the expected behavior of our
  software changes.

Touca allows capturing values of any number of variables and runtime of any
number of functions to describe the actual behavior and performance of our
software.

This approach is similar to snapshot testing where, for each test case, we store
the actual output of our software in a _snapshot file_, to compare outputs of
future versions against them. But unlike snapshot tests, Touca tests submit our
captured data to a remote server that automatically compares it against our
baseline and visualizes any differences.

We can run Touca tests with any number of inputs from the command line:

```bash
export TOUCA_API_KEY=<TOUCA_API_KEY>
export TOUCA_API_URL=<TOUCA_API_URL>
node dist/is_prime_test.js --revision v1.0 --testcase 19 51 97
```

Where API Key and URL can be obtained from [app.touca.io](https://app.touca.io)
or your self-hosted server. This command produces the following output:

```text

Touca Test Framework

Suite: is_prime_test/v1.0

 1.  SENT   19    (0 ms)
 2.  SENT   51    (0 ms)
 3.  SENT   97    (0 ms)

Tests:      3 submitted, 3 total
Time:       0.39 s

✨   Ran all test suites.

```

Now if we make changes to our workflow under test, we can rerun this test and
rely on Touca to check if our changes affected the behavior or performance of
our software.

Unlike integration tests, we are not bound to the output of our workflow. We can
capture any number of data points and from anywhere within our code. This is
specially useful if our workflow has multiple stages. We can capture the output
of each stage without publicly exposing its API. When any stage changes behavior
in a future version of our software, our captured data points will help find the
root cause more easily.

## Documentation

- [Documentation Website](https://touca.io/docs): Exhaustive source of
  information about Touca and its various components. If you are new to Touca,
  our _[Getting Started](https://touca.io/docs/basics/quickstart/)_ guide is the
  best place to start.
- [JavaScript SDK API Reference](https://touca.io/docs/external/sdk/js/index.html):
  Auto-generated source code documentation for Touca JavaScript SDK with
  explanation about individual API functions and examples for how to use them.
- [JavaScript Examples](https://github.com/trytouca/trytouca/tree/main/examples/js):
  Sample JavaScript projects [on GitHub](https://touca.io/github) that serve as
  examples for how to use Touca to track regressions in real-world software.

## Community

We hang on [Discord](https://touca.io/discord). Come say hi! We love making new
friends. If you need help, have any questions, or like to contribute or provide
feedback, that's the best place to be.

## Contributing

We welcome contributions of all forms, from adding new features to improving
documentation and sharing feedback.

- [Code of Conduct](https://touca.io/docs/contributing/conduct/)
- [Contributing Guide](https://touca.io/docs/contributing/)
- [Good First Issues](https://touca.io/docs/contributing/good-first-issues/)

## FAQ

- Should I install Touca as a development dependency?

  Yes, unless you like to capture data-points that are not accessible through
  your software's public API. Touca data capturing functions (e.g. `touca.check`
  and `touca.scoped_timer`) are no-op in production environments. They only work
  when called from a `touca.workflow` context.

- How is Touca making money?

  Touca is open-source software that you can self-host for free. Touca, Inc.
  operates [Touca Cloud](https://app.touca.io): a managed cloud instance of
  Touca with additional enterprise-ready features. We have a free plan and
  leverage usage-based pricing to charge for storage and service. Visit our
  [pricing page](https://touca.io/pricing) to learn more.

## License

This repository is released under the Apache-2.0 License. See
[`LICENSE`](https://github.com/trytouca/trytouca/blob/main/sdk/js/LICENSE).
