# Touca SDK for C++

![Supported Platforms](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue.svg)
[![Latest version](https://img.shields.io/static/v1?label=release&message=v1.6.1&color=blue)](https://github.com/trytouca/trytouca/tree/main/sdk/cpp)
[![License](https://img.shields.io/static/v1?label=license&message=Apache-2.0&color=blue)](https://github.com/trytouca/trytouca/blob/main/sdk/cpp/LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/trytouca/trytouca/build.yml?branch=main)](https://github.com/trytouca/trytouca/actions/workflows/build.yml?query=branch:main+event:push)
[![Documentation Status](https://readthedocs.org/projects/touca-cpp/badge/?version=latest)](https://touca-cpp.readthedocs.io)
[![Code Coverage](https://img.shields.io/codecov/c/github/trytouca/trytouca)](https://app.codecov.io/gh/trytouca/trytouca)

## Sneak Peak

> For a more thorough guide of how to use Touca SDK for C++, refer to our
> [documentation website](https://touca.io/docs).

Let us imagine that we want to test a software workflow that takes the username
of a student and provides basic information about them.

```cpp
TEST_CASE("test_find_student") {
  alice = find_student("alice")
  CHECK(alice.fullname == "Alice Anderson")
  CHECK(alice.dob == Date{2006, 3, 1})
  CHECK(alice.gpa == 3.9)
}
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

```cpp
#include "touca/touca.hpp"
#include "code_under_test.hpp"

int main(int argc, char* argv[]) {
  touca::workflow("students_test", [](const std::string& username) {
    const auto& student = find_student(username);
    touca::check("fullname", student.fullname);
    touca::check("dob", student.dob);
    touca::check("gpa", student.gpa);
  });
  return touca::run(argc, argv);
}
```

This is slightly different from a typical unit test:

- Touca tests do not use expected values.
- Touca tests do not hard-code input values.

With Touca, we describe how we run our code under test for any given test case.
We can capture values of interesting variables and runtime of important
functions to describe the behavior and performance of our workflow for that test
case.

![Sample Test Output](https://touca.io/docs/external/assets/touca-run-cpp.dark.gif)

Now if we make changes to our workflow under test, we can rerun this test and
let Touca automatically compare our captured data points against those of a
previous baseline version and report any difference in behavior or performance.

## Documentation

- [Documentation Website](https://touca.io/docs): If you are new to Touca, this
  is the best place to start.
- [C++ SDK API Reference](https://touca.io/docs/external/sdk/cpp/index.html):
  Auto-generated source code documentation for Touca C++ SDK with explanation
  about individual API functions.
- [C++ Examples](https://github.com/trytouca/trytouca/tree/main/examples/cpp):
  Sample C++ projects that show how to use Touca in various real-world
  use-cases.

## Integration

You can install Touca with CMake 3.11 or higher:

```cmake
FetchContent_Declare(
    touca
    GIT_REPOSITORY https://github.com/trytouca/trytouca
    GIT_TAG        v1.6.1
    SOURCE_SUBDIR  sdk/cpp
)
FetchContent_MakeAvailable(touca)
```

Or you can use Conan:

```bash
conan remote add touca-cpp https://getweasel.jfrog.io/artifactory/api/conan/touca-cpp
conan install -if "${dir_build}" -g cmake_find_package -b missing "touca/1.6.1@_/_"
```

Refer to our [documentation website](https://touca.io/docs/sdk/installing#c-sdk)
for more information.

## Requirements

We formally support C++11 through C++20 on Windows, Linux and macOS platforms.
We test our library against the following compilers:

| Compiler     | Min Version |
| ------------ | ----------- |
| x86-64 gcc   | 9.4.0       |
| x86-64 clang | 11.0.0      |
| x64 MSVC     | 1900        |

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

Touca SDK for C++ is released under the Apache-2.0 License. See
[`LICENSE`](https://github.com/trytouca/trytouca/blob/main/sdk/cpp/LICENSE).
