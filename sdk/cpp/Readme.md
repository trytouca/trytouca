<div align="center">
  <a href="https://touca.io" target="_blank" rel="noopener">
    <img alt="Touca Logo" height="48px" src="https://touca.io/logo/touca-logo-w-text.svg" />
  </a>
  <h1>Touca SDK for C++</h1>
  <p>
    <a href="https://app.touca.io" target="_blank" rel="noopener">Get Started</a>
    <span> &middot; </span>
    <a href="https://docs.touca.io/api/cpp-sdk" target="_blank" rel="noopener">Documentation</a>
    <span> &middot; </span>
    <a href="https://github.com/trytouca/touca-cpp/blob/main/LICENSE">License</a>
  </p>
</div>

Touca helps engineering teams understand the true impact of their code changes
on the behavior and performance of their software.
Test your most complex software workflows with any number of real-world inputs
to significantly reduce the risks of changing code in mission-critical systems.

<img alt="Touca Server" src="https://gblobscdn.gitbook.com/assets%2F-MWzZns5gcbaOLND3iQY%2F-MbwEQRnyNCcNhCOZail%2F-MbwFdJnPRjj4AxZb5a9%2Fpic1.png?alt=media&token=53187b81-7358-4701-95e6-b3e420dd10bd" />

# ✨ Features

Touca is an automated regression testing system for testing complex
mission-critical workflows with any number of real-world inputs.

* **Say Goodbye to Snapshot Files**  
  Touca offers client libraries that help you capture test results or
  performance benchmarks from anywhere within your workflow and submit
  them to a remote Touca server where they are stored and compared
  against your baseline.

* **Capture without Compromise**  
  Unlike snapshot files that often store the output of a given version
  of your workflows, Touca gives you fine-grained control over what
  variables and return values to capture as test result.

* **Lossless Comparison**  
  Touca client libraries preserve the types of your captured data. The
  Touca server compares test results of any two versions of your workflow
  in their original data type.

* **Scale without Worry**  
  Managing result files for hundreds of test cases is not feasible at
  scale. Let the Touca server manage your test results, compare them
  against previous versions, and report any found differences in an easy
  to understand format.

And many more! Checkout a [recorded product demo][YouTube] to learn more.

# 📖 Documentation

* If you are new to Touca, the best place to start is our
  [Quickstart Guide][docs-quickstart] on our documentation website.
* For information on how to use this library, examples, and tutorials,
  checkout our [C++ SDK Documentation][docs-cpp].
* If you cannot wait to start writing your first test with Touca,
  checkout our [C++ API Reference][docs-cpp-api].

# 🚀 Getting Started

> This section is a condensed version of the Quick Start Guide on our
> documentation website, meant to give you a general idea of how Touca works.
> For more information and examples in other programming languages, check out
> our documentation website at docs.touca.io.

Let us imagine that we want to test a simple Code Under Test such as a function
that checks if a given number is prime or not.

```cpp
bool is_prime(const unsigned number);
```

If we want to use unit testing, we'd write a test that invokes this function
with a number, and checks whether the actual return value of the function
matches our expected value. Here's a sample unit test.

```cpp
#include "catch2/catch.hpp"
#include "code_under_test.hpp"

TEST_CASE("is_prime")
{
    CHECK(is_prime(-1) == false);
    CHECK(is_prime(1) == false);
    CHECK(is_prime(2) == true);
    CHECK(is_prime(13) == true);
}
```

In the example above, the input and output of the Code Under Test were a
number and a boolean, respectively. If we were testing a video compression
algorithm, they may have been video files. In that case:

* Describing the expected output for a given video file would be difficult.
* When we make changes to our compression algorithm, accurately reflecting
  those changes in our expected values would be time-consuming.
* We would need a large number of input video files to gain confidence that
  our algorithm works correctly.

We've built Touca to make it easier for software engineering teams to
continuously test their complex workflows with any number of real-world inputs.

> Touca is a regression testing system; not a unit testing library.
> It tries to complement unit testing, not to replace it.

Touca takes a very different approach than unit testing.
Here's how the above test would look like:

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

Yes, we agree. This code needs some explanation. Let us start by reviewing
what is missing:

* We have fully decoupled our test inputs from our test logic. Touca refers to
  these inputs as "test cases". The SDK retrieves the test cases from a file or
  a remote Touca server and feeds them one by one to our code under test.
* We have completely removed the concept of "expected values". Instead, we
  are capturing the actual return value of `is_prime` via `add_result`. We can
  capture any number of values, from anywhere within our code under test.
  These captured values are associated with their corresponding input value
  (test case) and are submitted to a remote Touca server, as we run the code
  under test for each input.

You may wonder how we verify the correctness of our code under test without
using expected values. Let us clarify: we don't. Since Touca is a regression
testing system, its objective is to help us verify if our code under test works
as before. The remote server compares the submitted "actual values" against
those submitted for a previous "baseline" version of our code, and reports
differences. As long as we trust the "baseline" version of our software,
knowing that such comparison does not reveal any differences, can help us
conclude that our new version works as well as before.

Once we build this code as a separate executable, we can run it as shown below.

```bash
export TOUCA_API_KEY=<YOUR_API_KEY>
./prime_app_test --api-url https://api.touca.io/@/acme/prime_app/v2.0
```

Notice that we are including the version of our code as part of the URL to
our remote Touca server. Touca SDKs are very flexible in how we pass this
information. The above command produces the following output:

```plaintext
Touca Regression Test Framework
Suite: prime_app
Revision: v2.0

 (  1 of 4  ) 1                          (pass, 127 ms)
 (  2 of 4  ) 2                          (pass, 123 ms)
 (  3 of 4  ) 13                         (pass, 159 ms)
 (  4 of 4  ) 71                         (pass, 140 ms)

processed 4 of 4 test cases
test completed in 565 ms
```

If and when we change the implementation of `is_prime`, we can rerun the test
and submit the new results for the new version to the Touca server. The server
takes care of storing and comparing the results submitted between the two
versions and reports the differences in near real-time.

This approach is effective in addressing common problems in the following
situations:

* When we need to test our workflow with a large number of inputs.
* When the output of our workflow is too complex, or too difficult to describe
  in our unit tests.
* When interesting information to check for regression is not exposed by the
  workflow's interface.

The fundamental design features of Touca that we highlighted earlier can help
us test these workflows at any scale.

* Decoupling our test input from our test logic, can help us manage our long
  list of inputs without modifying the test logic. Managing that list on a
  remote server accessible to all members of our team, can help us add notes
  to each test case, explain why they are needed and track how their
  performance changes over time.
* Submitting our test results to a remote server, instead of storing them in
  files, can help us avoid the mundane tasks of managing and processing of
  those results. The Touca server retains test results and makes them
  accessible to all members of the team. It compares test results using their
  original data types and reports discovered differences in real-time to all
  interested members of our team. It allows us to audit how our software
  evolves over time and provides high-level information about our tests.

# 🧑‍🔧 Integration

> This section is a summarized version of the [Integration][docs-cpp-integration]
> document on our documentation website.

The easiest way to use Touca as a third-party dependency in your project is
to use CMake version 3.11 or higher, via the FetchContent module as shown below:

```cmake
FetchContent_Declare(
    touca
    GIT_REPOSITORY https://github.com/trytouca/touca-cpp.git
    GIT_TAG        v1.3.0
)
FetchContent_MakeAvailable(touca)
```

But in addition to the Client Library, Touca SDK for C++ also includes a
Test Framework which is disabled by default. For serious regression test
tools, we encourage the use of this test framework which can be build with
a small modification to the code above:

```cmake
FetchContent_Declare(
    touca
    GIT_REPOSITORY https://github.com/trytouca/touca-cpp.git
    GIT_TAG        v1.3.0
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
conan install -if "${dir_build}" -g cmake_find_package -b missing "touca/1.4.0@_/_"
```

# 🕵️ Requirements

We formally support building our library on Windows, Linux and macOS platforms
using C++11, C++14 and C++17 standards. Both the library and the test framework
can be built as shared or static libraries. We test our library against the
following compilers. We intend to support any new version of these compilers.

| Compiler     | Min Version | Max Version |
| --------     | ----------- | ----------- |
| x86-64 gcc   | 7.1         | 10.2        |
| x86-64 clang | 7.0.0       | 11.0.0      |
| x64 MSVC     | 1900        | 1927        |

# 🙋 Ask for Help

We want Touca to work well for you. If you need help, have any questions, or
like to provide feedback, send us a note through the Intercom at Touca.io or
send us an email us at [hello@touca.io].

# 💸 What's Next?

Touca client libraries are free and open-source. Our cloud-hosted version of
Touca server at Touca.io has a free forever plan. You can create an account
and explore Touca server capabilities on your own. But we want to help you
get on-boarded and answer any questions you may have in the process.
So we ask that you schedule a no-pressure chat with us [here][Calendly].
We like to learn more about you, understand your software and its requirements,
and do our best to make Touca provide value to you and your team.

# License

This repository is released under the Apache-2.0 License. See [`LICENSE`][license].

[Calendly]: https://calendly.com/ghorbanzade/30min
[YouTube]: https://www.youtube.com/channel/UCAGugoQDJY3wdMuqETTOvIA
[hello@touca.io]: mailto:hello@touca.io
[license]: https://github.com/trytouca/touca-cpp/blob/main/LICENSE

[docs-quickstart]: https://docs.touca.io/getting-started/quickstart
[docs-submit]: https://docs.touca.io/guides/submit
[docs-cpp-integration]: https://docs.touca.io/api/cpp-sdk/integration
[docs-cpp]: https://docs.touca.io/api/cpp-sdk
[docs-cpp-api]: https://touca.io/docs/clients/cpp/api.html
