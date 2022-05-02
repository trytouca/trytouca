# Touca SDK For Python

[![PyPI](https://img.shields.io/pypi/v/touca?color=blue)](https://pypi.org/project/touca/)
[![License](https://img.shields.io/pypi/l/touca?color=blue)](https://github.com/trytouca/trytouca/blob/main/sdk/python/LICENSE)
[![PyPI - Python Version](https://img.shields.io/pypi/pyversions/touca)](https://pypi.org/project/touca)
[![Build Status](https://img.shields.io/github/workflow/status/trytouca/trytouca/touca-build)](https://github.com/trytouca/trytouca/actions/workflows/build.yml?query=branch:main+event:push)
[![Documentation Status](https://readthedocs.org/projects/touca-python/badge/?version=latest)](https://touca-python.readthedocs.io)
[![Codecov](https://img.shields.io/codecov/c/github/trytouca/trytouca)](https://app.codecov.io/gh/trytouca/trytouca)

## Install

You can install Touca with [pip](https://pypi.org/project/touca):

```bash
pip install touca
```

We formally support Python v3.6 and newer on Linux, macOS, and Windows
platforms.

## Sneak Peak

> For a more thorough guide of how to use Touca SDK for Python, check out the
> `examples` directory or visit our
> [documentation website](https://touca.io/docs).

Let us imagine that we want to test a software workflow that reports whether a
given number is prime.

```python
def is_prime(number: int):
```

We can use unit testing in which we hard-code a set of input numbers and list
our expected return value for each input. In this example, the input and output
of our code under test are a number and a boolean. If we were testing a video
compression algorithm, they may have been video files. In that case:

- Describing the expected output for a given video file would be difficult.
- When we make changes to our compression algorithm, accurately reflecting those
  changes in our expected values would be time-consuming.
- We would need a large number of input video files to gain confidence that our
  algorithm works correctly.

Touca makes it easier to continuously test workflows of any complexity and with
any number of test cases.

```python
import touca
from code_under_test import is_prime

@touca.Workflow
def test_is_prime(testcase: str):
    touca.check("is_prime", is_prime(int(testcase)))

if __name__ == "__main__":
    touca.run()
```

Touca tests have two main differences compared to typical unit tests:

- We have fully decoupled our test inputs from our test logic. We refer to these
  inputs as "test cases". The SDK retrieves the test cases from the command
  line, or a file, or a remote Touca server and feeds them one by one to our
  code under test.
- We have removed the concept of _expected values_. With Touca, we only describe
  the _actual_ behavior and performance of our code under test by capturing
  values of interesting variables and runtime of important functions, anywhere
  within our code. For each test case, the SDK submits this description to a
  remote server which compares it against the description for a trusted version
  of our code. The server visualizes any differences and reports them in near
  real-time.

We can run Touca tests with any number of inputs from the command line:

```bash
export TOUCA_API_KEY=<TOUCA_API_KEY>
export TOUCA_API_URL=<TOUCA_API_URL>
python is_prime_test.py --revision v1.0 --testcase 13 17 51
```

Where `TOUCA_API_KEY` and `TOUCA_API_URL` can be obtained from the Touca server
at [app.touca.io](https://app.touca.io). This command produces the following
output:

```text

Touca Test Framework
Suite: is_prime/v1.0

 1.  PASS   13    (109 ms)
 2.  PASS   17    (152 ms)
 3.  PASS   51    (127 ms)

Tests:      3 passed, 3 total
Time:       0.91 s

✨   Ran all test suites.

```

## Features

Touca is very effective in addressing common problems in the following
situations:

- When we need to test our workflow with a large number of inputs.
- When the output of our workflow is too complex, or too difficult to describe
  in our unit tests.
- When interesting information to check for regression is not exposed through
  the interface of our workflow.

The fundamental design features of Touca that we highlighted earlier can help us
test these workflows at any scale.

- Decoupling our test input from our test logic, can help us manage our long
  list of inputs without modifying the test logic. Managing that list on a
  remote server accessible to all members of our team, can help us add notes to
  each test case, explain why they are needed and track how their performance
  changes over time.
- Submitting our test results to a remote server, instead of storing them in
  files, can help us avoid the mundane tasks of managing and processing of those
  results. The Touca server retains test results and makes them accessible to
  all members of the team. It compares test results using their original data
  types and reports discovered differences in real-time to all interested
  members of our team. It allows us to audit how our software evolves over time
  and provides high-level information about our tests.

## Documentation

- If you are new to Touca, the best place to start is the
  [Quickstart Guide](https://touca.io/docs/basics/quickstart) on our
  documentation website.
- For information on how to use this SDK, see our
  [Python SDK Documentation](https://touca.io/docs/sdk/python/quickstart).
- If you cannot wait to start writing your first test with Touca, see our
  [Python API Reference](https://app.touca.io/docs/sdk/python/api.html).

## Ask for Help

We want Touca to work well for you. If you need help, have any questions, or
like to provide feedback, send us a note through the Intercom at
[touca.io](https://touca.io) or email us at <hello@touca.io>.

## License

This repository is released under the Apache-2.0 License. See
[`LICENSE`](https://github.com/trytouca/trytouca/blob/main/sdk/python/LICENSE).
