# Touca SDK For Python

[![PyPI](https://img.shields.io/pypi/v/touca?color=blue)](https://pypi.org/project/touca/)
[![License](https://img.shields.io/pypi/l/touca?color=blue)](https://github.com/trytouca/trytouca/blob/main/sdk/python/LICENSE)
[![PyPI - Python Version](https://img.shields.io/pypi/pyversions/touca)](https://pypi.org/project/touca)
[![Build Status](https://img.shields.io/github/workflow/status/trytouca/trytouca/touca-build)](https://github.com/trytouca/trytouca/actions/workflows/build.yml?query=branch:main+event:push)
[![Documentation Status](https://readthedocs.org/projects/touca-python/badge/?version=latest)](https://touca-python.readthedocs.io)
[![Code Coverage](https://img.shields.io/codecov/c/github/trytouca/trytouca)](https://app.codecov.io/gh/trytouca/trytouca)

## Install

You can install Touca with [pip](https://pypi.org/project/touca):

```bash
pip install touca
```

We formally support Python v3.6 and newer on Linux, macOS, and Windows
platforms.

## Sneak Peak

> For a more thorough guide of how to use Touca SDK for Python, check out our
> [documentation website](https://touca.io/docs/sdk/python/quickstart/).

Let us imagine that we want to test a software workflow that reports whether a
given number is prime.

```python
def is_prime(number: int):
    for i in range(2, number):
        if number % i == 0:
            return False
    return 1 < number
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
from is_prime import is_prime

@touca.Workflow
def is_prime_test(testcase: str):
    touca.check("is_prime_output", is_prime(int(testcase)))
```

This is slightly different from a typical unit test:

- Touca tests do not use expected values.
- Touca tests do not hard-code input values.

With Touca, we can define how to run our code under test for any given test
case. We can capture values of interesting variables and runtime of important
functions to describe the behavior and performance of our workflow for that test
case.

We can run Touca tests with any number of inputs from the command line:

```bash
touca config set api-key="<your_key>"
touca config set api-url="https://api.touca.io/@/tutorial"
touca test --revision=1.0 --testcase 19 51 97
```

Where `TOUCA_API_KEY` can be obtained from the Touca server at
[app.touca.io](https://app.touca.io). This command produces the following
output:

```text

Touca Test Framework

Suite: is_prime_test/1.0

 1.  PASS   19    (0 ms)
 2.  PASS   51    (0 ms)
 3.  PASS   97    (0 ms)

Tests:      3 passed, 3 total
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

## License

This repository is released under the Apache-2.0 License. See
[`LICENSE`](https://github.com/trytouca/trytouca/blob/main/sdk/python/LICENSE).
