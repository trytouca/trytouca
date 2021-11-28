# Touca SDK for C++

![Supported Platforms](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue.svg)
[![Latest version](https://img.shields.io/github/v/release/trytouca/touca-cpp)](https://github.com/trytouca/touca-cpp/releases)
[![License](https://img.shields.io/github/license/trytouca/touca-cpp?color=blue)](https://github.com/trytouca/touca-cpp/blob/main/LICENSE)
[![Build Status](https://img.shields.io/github/workflow/status/trytouca/touca-cpp/touca-cpp-main)](https://github.com/trytouca/touca-cpp/actions/workflows/main.yml?query=branch:main+event:push)
[![Documentation Status](https://readthedocs.org/projects/touca-cpp/badge/?version=latest)](https://touca-cpp.readthedocs.io)
[![Codecov](https://img.shields.io/codecov/c/github/trytouca/touca-cpp)](https://app.codecov.io/gh/trytouca/touca-cpp)

Touca helps you understand the true impact of your day to day code changes on
the behavior and performance of your overall software, as you write code.

[![Touca Server](https://touca-public-assets.s3.us-east-2.amazonaws.com/touca-screenshot-suite-page.jpg)](https://touca-public-assets.s3.us-east-2.amazonaws.com/touca-screenshot-suite-page.jpg)

Touca SDKs let you describe the behavior and performance of your code by
capturing values of interesting variables and runtime of important functions. We
remotely compare your description against a trusted version of your software,
visualize all differences, and report them in near real-time.

## 👀 Sneak Peak

> For a more thorough guide of how to use Touca SDK for C++, check out the
> examples directory or visit our documentation website at
> [docs.touca.io](https://docs.touca.io).

Let us imagine that we want to test a software workflow that reports whether a
given number is prime.

```cpp
bool is_prime(const unsigned number);
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

```cpp
#include "touca/touca.hpp"
#include "code_under_test.hpp"

int main(int argc, char* argv[]) {
  touca::workflow("is_prime", [](const std::string& testcase) {
    const auto number = std::stoul(testcase);
    touca::check("output", is_prime(number));
  });
  touca::run(argc, argv);
}
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
./prime_app_test
  --api-key <TOUCA_API_KEY>
  --api-url <TOUCA_API_URL>
  --revision v1.0
  --testcase 13 17 51
```

Where `TOUCA_API_KEY` and `TOUCA_API_URL` can be obtained from the Touca server
at [app.touca.io](https://app.touca.io). This command produces the following
output:

```text
Touca Test Framework
Suite: is_prime_test
Revision: v1.0

 (  1 of 3  ) 13                   (pass, 127 ms)
 (  2 of 3  ) 17                   (pass, 123 ms)
 (  3 of 3  ) 51                   (pass, 159 ms)

Processed 3 of 3 testcases
Test completed in 565 ms
```

## ✨ Features

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

## 📖 Documentation

- If you are new to Touca, the best place to start is the
  [Quickstart Guide](https://docs.touca.io/basics/quickstart) on our
  documentation website.
- For information on how to use this SDK, see our
  [C++ SDK Documentation](https://docs.touca.io/sdk/cpp).
- If you cannot wait to start writing your first test with Touca, see our
  [C++ API Reference](https://app.touca.io/docs/clients/cpp/api.html).

## 🧑‍🔧 Integration

You can install Touca with CMake 3.11 or higher:

```cmake
FetchContent_Declare(
    touca
    GIT_REPOSITORY https://github.com/trytouca/touca-cpp.git
    GIT_TAG        v1.4.1
)
FetchContent_MakeAvailable(touca)
```

Or you can use Conan:

```bash
conan remote add touca-cpp https://getweasel.jfrog.io/artifactory/api/conan/touca-cpp
conan install -if "${dir_build}" -g cmake_find_package -b missing "touca/1.4.1@_/_"
```

See the [Integration](https://docs.touca.io/sdk/cpp/installing) section on our
documentation website to learn more.

## 🕵️ Requirements

We formally support C++11 and higher standards on Windows, Linux and macOS
platforms. We test our library against the following compilers:

| Compiler     | Min Version |
| ------------ | ----------- |
| x86-64 gcc   | 7.1         |
| x86-64 clang | 7.0.0       |
| x64 MSVC     | 1900        |

## 🙋 Ask for Help

We want Touca to work well for you. If you need help, have any questions, or
like to provide feedback, send us a note through the Intercom at
[app.touca.io](https://app.touca.io) or email us at <hello@touca.io>.

## 🚀 What's Next

Touca client libraries are free and open-source. Our cloud-hosted Touca server
at [app.touca.io](https://app.touca.io) has a free plan. You can create an
account and explore Touca on your own. We are also happy to
[chat 1:1](https://calendly.com/ghorbanzade/30min) to help you get on-boarded
and answer any questions you may have in the process. We'd love to learn more
about you, understand your software and its requirements, and help you decide if
Touca would be useful to you and your team.

## License

This repository is released under the Apache-2.0 License. See
[`LICENSE`](https://github.com/trytouca/touca-cpp/blob/main/LICENSE).
