# Build Instructions

This document provides instructions for building Weasel Client Library for C++
and its side components.

**Note**: To use Weasel as a dependency in your project, you may not need to
follow these instructions. Read our [Integration Guide](./docs/Integration.md)
to learn how to pull Weasel as a third-party dependency.

## Supported Toolchains

We formally support building our library on Windows, Linux and macOS platforms
using C++11, C++14 and C++17 standards. Both the library and the test framework
can be built as shared or static libraries.

We test our library against the following compilers.

| Compiler     | Min Version | Max Version |
| ------------ | ----------- | ----------- |
| x86-64 gcc   | 7.1         | 10.2        |
| x86-64 clang | 7.0.0       | 11.0.0      |
| x64 MSVC     | 1900        | 1927        |

## Required Build Tools

We use [CMake] as our build system. If you do not have a recent version
of CMake installed already, please consult with their documentation for
instructions to install it on your platform.

## Obtaining the Source Code

Copy the source code of the client library by cloning its repository to a
directory of your choice.
We refer to this directory as `<project_directory>` in subsequent sections
of this document.

```bash
git clone git@github.com:getweasel/weasel-cpp.git
```

## Building with our Helper Scripts

Weasel Client Library for C++ has five main components.

| Component Name               | Build Argument   |
| ---------------------------- | ---------------- |
| Client Library for C++       |                  |
| Test Framework for C++       | --with-framework |
| Sample Regression Test Tools | --with-examples  |
| Utility Command Line Tool    | --with-utils     |
| Unit Tests                   | --with-tests     |

We provide build scripts `build.sh` and `build.bat` for Unix and Windows
platforms, respectively. The build scripts build "Client Library for C++"
by default. You can pass the appropriate argument shown in the table above
to build other components as needed.

As an example, the command below builds all the components except the unit
tests.

```bash
./build.sh --with-framework --with-utils --with-examples
```

You can build all the components using the `--all` argument:

```bash
./build.sh --all
```

If, for any reason, you do not want to build the components using our helper
scripts, follow the subsequent sections to learn what our scripts do.

## Building with CMake

You can opt to directly use [CMake] to build Weasel Client Library for C++ and
its components. To do so, we recommend running the following command first, to
configure the set of targets to be built and the path in which build artifacts
should be generated. While you can change the build directory to the directory
of your choice, the subsequent instructions assume the default value of
`./local/build`.

```bash
cmake -B"<project_directory>/local/build" -H"<project_directory>"
```

By default, the above-mentioned command configures CMake to build the Weasel
Client Library. But as mentioned in previous section, this repository includes
several other components that can be enabled by passing the appropriate options
to the command above, as listed in the table below.

| Component Name               | CMake Option           | Default |
|------------------------------|------------------------|---------|
| Client Library for C++       |                        |         |
| Test Framework for C++       | WEASEL_BUILD_FRAMEWORK | OFF     |
| Sample Regression Test Tools | WEASEL_BUILD_UTILS     | OFF     |
| Utility Command Line Tool    | WEASEL_BUILD_EXAMPLES  | OFF     |
| Unit Tests                   | WEASEL_BUILD_TESTS     | OFF     |

As an example, the command below enables building Weasel Test Framework for C++.

```bash
cmake -B"<project_directory>/local/build" -H"<project_directory>" -DWEASEL_BUILD_FRAMEWORK=ON
```

Now we can proceed with building the source code via CMake which uses
the native build tool of your platform.

```bash
cmake --build "<project_directory>/local/build" --parallel
```

Optionally, as a last step, we can install the build artifacts in a directory
of our choice for easier packaging.
``.

```bash
cmake --install "<project_directory>/local/build" --prefix "<project_directory>/local/dist"
```

[CMake]: https://cmake.org/
