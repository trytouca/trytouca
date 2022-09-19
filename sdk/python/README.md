# Touca Python SDK

Write regression tests, the easy way.

[![PyPI](https://img.shields.io/pypi/v/touca?color=blue)](https://pypi.org/project/touca/)
[![License](https://img.shields.io/pypi/l/touca?color=blue)](https://github.com/trytouca/trytouca/blob/main/sdk/python/LICENSE)
[![PyPI - Python Version](https://img.shields.io/pypi/pyversions/touca)](https://pypi.org/project/touca)
[![Build Status](https://img.shields.io/github/workflow/status/trytouca/trytouca/touca-build)](https://github.com/trytouca/trytouca/actions/workflows/build.yml?query=branch:main+event:push)
[![Documentation Status](https://readthedocs.org/projects/touca-python/badge/?version=latest)](https://touca-python.readthedocs.io)
[![Code Coverage](https://img.shields.io/codecov/c/github/trytouca/trytouca)](https://app.codecov.io/gh/trytouca/trytouca)

```python
import touca
from code_under_test import important_workflow

@touca.Workflow
def test_important_workflow(testcase: str):
    touca.check("output", important_workflow(testcase))
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

- Python v3.6 or newer

## Install

You can install Touca with [pip](https://pypi.org/project/touca):

```bash
pip install touca
```

## Usage

Suppose we want to test a software that checks whether a given number is prime.

```python
def is_prime(number: int):
    for i in range(2, number):
        if number % i == 0:
            return False
    return 1 < number
```

We can use unit testing in which we verify that the _actual_ output of our
function matches our _expected_ output, for a small set of possible inputs.

```python
def test_is_prime():
    assert is_prime(2) == True
    assert is_prime(4) == False
```

Touca is different from unit testing:

- Touca tests do not hard-code input values.
- Touca tests do not hard-code expected outcome.

```python
import touca
from is_prime import is_prime

@touca.Workflow
def is_prime_test(testcase: str):
    touca.check("output", is_prime(int(testcase)))
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
touca config set api-key="<your_api_key>"
touca config set api-url="<your_api_url>"
touca test --revision=1.0 --testcase 19 51 97
```

Where API Key and URL can be obtained from [app.touca.io](https://app.touca.io)
or your self-hosted server. This command produces the following output:

```text

Touca Test Framework

Suite: is_prime_test/1.0

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
- [Python SDK API Reference](https://touca.io/docs/external/sdk/python/index.html):
  Auto-generated source code documentation for Touca Python SDK with explanation
  about individual API functions and examples for how to use them.
- [Python Examples](https://github.com/trytouca/trytouca/tree/main/examples/python):
  Sample Python projects [on GitHub](https://touca.io/github) that serve as
  examples for how to use Touca to track regressions in real-world software.

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

## FAQ

- Should I install Touca as a development dependency?

  Yes, unless you like to capture data-points that are not accessible through
  your software's public API. Touca data capturing functions (e.g. `touca.check`
  and `touca.scoped_timer`) are no-op in production environments. They only work
  when called from a `@touca.Workflow` context.

- How is Touca making money?

  Touca is open-source software that you can self-host for free. Touca, Inc.
  operates [Touca Cloud](https://app.touca.io): a managed cloud instance of
  Touca with additional enterprise-ready features. We have a free plan and
  leverage usage-based pricing to charge for storage and service. Visit our
  [pricing page](https://touca.io/pricing) to learn more.

## License

This repository is released under the Apache-2.0 License. See
[`LICENSE`](https://github.com/trytouca/trytouca/blob/main/sdk/python/LICENSE).
