# Touca

> This week is _Touca Launch Week_! Check out our
> [Launch page](https://touca.io/launch) for upcoming blog-posts, webinars,
> conversations, and live-coding streams.

[![License](https://img.shields.io/github/license/trytouca/trytouca?color=blue)](https://github.com/trytouca/trytouca/blob/main/LICENSE)
[![Documentation Website](https://img.shields.io/static/v1?label=docs&message=touca.io/docs&color=blue)](https://touca.io/docs)
[![Community](https://img.shields.io/static/v1?label=community&message=touca.io/discord&color=blue)](https://touca.io/discord)

Touca is an open-source regression testing solution, built for engineers.

- Track regressions between different software versions
- Understand how your software evolves in behavior and performance

[![Touca Server](https://i.vimeocdn.com/filter/overlay?src0=https%3A%2F%2Fi.vimeocdn.com%2Fvideo%2F1420276355-a2760e21742b267f63e7e1599eefc02329dcc22c2f155f125ff8692c99161e9c-d_1920x1080&src1=http%3A%2F%2Ff.vimeocdn.com%2Fp%2Fimages%2Fcrawler_play.png)](https://vimeo.com/703039452 "Touca Quick Product Demo")

## Start for free

[![Server](https://img.shields.io/static/v1?label=Server&message=v1.4.0&color=blue)](https://hub.docker.com/repository/docker/touca)

### Option 1: Self-host locally

You could locally self-host the Touca Server by running the following command on
a UNIX machine with at least 2GB of RAM, with Docker and Docker Compose
installed.

```bash
/bin/bash -c "$(curl -fsSL https://touca.io/install.sh)"
```

### Option 2: Use our cloud instance

Or you could use https://app.touca.io that has a few more features suitable for
large teams. We have a generous free plan and leverage usage-based pricing to
charge for storage and service.

## Sneak Peak

> Touca offer SDKs in Python, C++, Java, and JavaScript.

[![C++ SDK](https://img.shields.io/static/v1?label=C%2B%2B&message=v1.5.2&color=blue)](https://github.com/trytouca/trytouca/tree/main/sdk/cpp)
[![Python SDK](https://img.shields.io/pypi/v/touca?label=Python&color=blue)](https://pypi.org/project/touca/)
[![JavaScript SDK](https://img.shields.io/npm/v/@touca/node?label=JavaScript&color=blue)](https://www.npmjs.com/package/@touca/node)
[![Java SDK](https://img.shields.io/maven-central/v/io.touca/touca?label=Java&color=blue)](https://search.maven.org/artifact/io.touca/touca)

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

## Value Proposition

Touca is very effective in addressing common problems in the following
situations:

- When we need to test our workflow with a large number of inputs.
- When the output of our workflow is too complex, or too difficult to describe
  in our unit tests.
- When interesting information to check for regression is not exposed through
  the interface of our workflow.

The highlighted design features of Touca can help us test these workflows at any
scale.

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

If you are new to Touca, the best place to start is the
[Quickstart Guide](https://touca.io/docs/basics/quickstart) on our documentation
website.

## Community

We hang on [Discord](https://touca.io/discord). Come say hi! We love making new
friends. If you need help, have any questions, or like to contribute or provide
feedback, that's the best place to be.

## License

This repository is released under the Apache-2.0 License. See
[`LICENSE`](https://github.com/trytouca/trytouca/blob/main/LICENSE).
