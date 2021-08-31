<div align="center">
  <a href="https://touca.io" target="_blank" rel="noopener">
    <img alt="Touca Logo" height="48px" src="https://touca.io/logo/touca-logo-w-text.svg" />
  </a>
  <h1>Touca SDK for C++</h1>
  <p>
    <a href="https://github.com/trytouca/touca-cpp/releases" target="_blank" rel="noopener"><img alt="Latest version" src="https://img.shields.io/github/v/release/trytouca/touca-cpp" /></a>
    <a href="https://github.com/trytouca/touca-cpp/actions" target="_blank" rel="noopener"><img alt="Build Status" src="https://img.shields.io/github/workflow/status/trytouca/touca-cpp/touca-cpp-main" /></a>
    <a href="https://touca-cpp.readthedocs.io/" target="_blank" rel="noopener"><img alt="API Reference Documentation" src="https://readthedocs.org/projects/touca-cpp/badge/?version=latest" /></a>
    <a href="https://github.com/trytouca/touca-cpp/blob/main/LICENSE" target="_blank" rel="noopener"><img alt="License" src="https://img.shields.io/github/license/trytouca/touca-cpp" /></a>
  </p>
</div>

Touca helps you understand the true impact of your day to day code changes
on the behavior and performance of your overall software, as you write code.

[![Touca Server](https://touca-public-assets.s3.us-east-2.amazonaws.com/touca-screenshot-suite-page.png)](https://touca-public-assets.s3.us-east-2.amazonaws.com/touca-screenshot-suite-page.png)

Touca SDKs let you describe the behavior and performance of your code by
capturing values of interesting variables and runtime of important functions.
We remotely compare your description against a trusted version of your
software, visualize all differences, and report them in near real-time.

## 👀 Sneak Peak

> For a more thorough guide of how to use Touca SDK for C++, check out the
> [`examples`][cpp-examples] directory or visit our documentation website at
> [docs.touca.io](https://docs.touca.io).

Let us imagine that we want to test a software workflow that reports
whether a given number is prime.

```cpp
bool is_prime(const unsigned number);
```

We can use unit testing in which we hard-code a set of input numbers
and list our expected return value for each input. In this example,
the input and output of our code under test are a number and a boolean.
If we were testing a video compression algorithm, they may have been
video files. In that case:

*   Describing the expected output for a given video file would be difficult.

*   When we make changes to our compression algorithm, accurately reflecting
    those changes in our expected values would be time-consuming.

*   We would need a large number of input video files to gain confidence that
    our algorithm works correctly.

Touca makes it easier to continuously test workflows of any complexity
and with any number of test cases.

```cpp
#include "touca/touca.hpp"
#include "touca/touca_main.hpp"
#include "code_under_test.hpp"

void touca::main(const std::string& testcase)
{
    const auto number = std::stoul(testcase);
    touca::add_result("is_prime", is_prime(number));
}
```

Touca tests have two main differences compared to typical unit tests:

*   We have fully decoupled our test inputs from our test logic. We refer to
    these inputs as "test cases". The SDK retrieves the test cases from the
    command line, or a file, or a remote Touca server and feeds them one by one
    to our code under test.

*   We have removed the concept of *expected values*. With Touca, we only
    describe the *actual* behavior and performance of our code under test
    by capturing values of interesting variables and runtime of important
    functions, anywhere within our code.
    For each test case, the SDK submits this description to a remote server
    which compares it against the description for a trusted version of our code.
    The server visualizes any differences and reports them in near real-time.

We can run Touca tests with any number of inputs from the command line:

```bash
./prime_app_test
  --api-key <TOUCA_API_KEY>
  --api-url <TOUCA_API_URL>
  --revision v1.0
  --testcase 13 17 51
```

Where `TOUCA_API_KEY` and `TOUCA_API_URL` can be obtained from the
Touca server at [app.touca.io](https://app.touca.io).
This command produces the following output:

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

*   When we need to test our workflow with a large number of inputs.

*   When the output of our workflow is too complex, or too difficult
    to describe in our unit tests.

*   When interesting information to check for regression is not exposed
    through the interface of our workflow.

The fundamental design features of Touca that we highlighted earlier
can help us test these workflows at any scale.

*   Decoupling our test input from our test logic, can help us manage our
    long list of inputs without modifying the test logic. Managing that list
    on a remote server accessible to all members of our team, can help us add
    notes to each test case, explain why they are needed and track how their
    performance changes over time.

*   Submitting our test results to a remote server, instead of storing them
    in files, can help us avoid the mundane tasks of managing and processing
    of those results. The Touca server retains test results and makes them
    accessible to all members of the team. It compares test results using
    their original data types and reports discovered differences in real-time
    to all interested members of our team. It allows us to audit how our
    software evolves over time and provides high-level information about
    our tests.

## 📖 Documentation

*   If you are new to Touca, the best place to start is our
    [Quickstart Guide][docs-quickstart] on our documentation website.

*   For information on how to use our C++ SDK,
    see our [C++ SDK Documentation][docs-cpp].

*   If you cannot wait to start writing your first test with Touca,
    see our [C++ API Reference][docs-cpp-api].

## 🧑‍🔧 Integration

> This section is a summarized version of the [Integration][docs-cpp-installing]
> document on our documentation website.

The easiest way to use Touca as a third-party dependency in your project is
to use CMake version 3.11 or higher, via the FetchContent module as shown below:

```cmake
FetchContent_Declare(
    touca
    GIT_REPOSITORY https://github.com/trytouca/touca-cpp.git
    GIT_TAG        v1.4.1
)
FetchContent_MakeAvailable(touca)
```

But in addition to the Client Library, Touca SDK for C++ also includes a
Test Framework which is disabled by default. For serious regression test
tools, we encourage the use of this test framework which can be built with
a small modification to the code above:

```cmake
FetchContent_Declare(
    touca
    GIT_REPOSITORY https://github.com/trytouca/touca-cpp.git
    GIT_TAG        v1.4.1
)

FetchContent_GetProperties(touca)
if(NOT touca_POPULATED)
    FetchContent_Populate(touca)

    # enable building of touca test framework
    set(TOUCA_BUILD_FRAMEWORK ON)

    # optionally, provide the path to the OpenSSL root directory
    # set(OPENSSL_ROOT_DIR <path_to_openssl>)

    # proceed with building the touca Client Library and Test Framework.
    add_subdirectory(${touca_SOURCE_DIR})
endif()
```

The code above builds an additional CMake target touca_framework to be linked
by regression test tools that make use of the Touca Test Framework.

As an alternative, it is possible to use Conan for pulling Touca as a
third-party library:

```bash
conan remote add touca-cpp https://getweasel.jfrog.io/artifactory/api/conan/touca-cpp
conan install -if "${dir_build}" -g cmake_find_package -b missing "touca/1.4.1@_/_"
```

## 🕵️ Requirements

We formally support building our library on Windows, Linux and macOS platforms
using C++11, C++14 and C++17 standards. Both the library and the test framework
can be built as shared or static libraries. We test our library against the
following compilers.

| Compiler     | Min Version |
| --------     | ----------- |
| x86-64 gcc   | 7.1         |
| x86-64 clang | 7.0.0       |
| x64 MSVC     | 1900        |

## 🙋 Ask for Help

We want Touca to work well for you. If you need help, have any questions, or
like to provide feedback, send us a note through the Intercom at
[app.touca.io](https://app.touca.io) or email us at <hello@touca.io>.

## 🚀 What's Next

Touca client libraries are free and open-source. Our cloud-hosted Touca server
at [app.touca.io](https://app.touca.io) has a free forever plan. You can create an account and
explore Touca on your own. We are also happy to [chat 1:1][calendly] to help
you get on-boarded and answer any questions you may have in the process.
We'd love to learn more about you, understand your software and its requirements,
and help you decide if Touca would be useful to you and your team.

## License

This repository is released under the Apache-2.0 License. See [`LICENSE`][license].

[calendly]: https://calendly.com/ghorbanzade/30min

[license]: https://github.com/trytouca/touca-cpp/blob/main/LICENSE

[cpp-examples]: https://github.com/trytouca/touca-cpp/tree/main/examples

[docs-quickstart]: https://docs.touca.io/basics/quickstart

[docs-cpp]: https://docs.touca.io/sdk/cpp

[docs-cpp-api]: https://app.touca.io/docs/clients/cpp/api.html

[docs-cpp-installing]: https://docs.touca.io/sdk/cpp/installing
