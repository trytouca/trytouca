# Build Instructions

This document provides instructions for building Weasel Client Library for C++
and its side components.

**Note**: To use Weasel as a dependency in your project, you do not need to
follow these instructions. Follow our *Integration* document to learn how to
pull Weasel as a third-party dependency.

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

As of v1.3, We use [CMake] as our build system. If you do not have a recent
version of CMake installed already, please consult with their documentation
for instructions to install it on your platform.

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

| Name                         | Build Argument   |
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

## Configuring the Build System

Once the dependencies are installed, we can proceed with building the
source code using [CMake]. To do so, we recommend running the following
command first, to configure the set of targets to be built and the path
in which build artifacts should be generated. While you can change the
build directory to the directory of your choice, the subsequent
instructions assume the default value of `./local/build`.

```bash
cmake -B"<project_directory>/local/build" -H"<project_directory>"
```

By default, the above-mentioned command configures CMake to build the client
library, its unittests, a sample regression test tool that uses the library
and a utility tool that helps you manage generated Weasel results. The Weasel
Test Framework for C++ is not built unless explicitly enabled.

You can disable building these targets by passing appropriate options to
the command whose list is given in the table below.

| Option                 | Comment                     | Default |
|------------------------|-----------------------------|---------|
| WEASEL_BUILD_TESTS     | Unit-Tests                  | OFF     |
| WEASEL_BUILD_UTILS     | Command-Line Utility Tool   | OFF     |
| WEASEL_BUILD_EXAMPLES  | Sample Test Tools           | OFF     |
| WEASEL_BUILD_FRAMEWORK | Test Framework Library      | OFF     |

As an example, the command below enables building the test framework
and disables building the unit-tests.

```bash
cmake -B"<project_directory>/local/build" -H"<project_directory>" \
  -DWEASEL_BUILD_TESTS=OFF -DWEASEL_BUILD_FRAMEWORK=ON
```

## Running the Build System

Finally, we can proceed with building the source code via CMake which uses
the native build tool of your platform.

```bash
cmake --build "<project_directory>/local/build" --parallel
```

This command produces the build artifacts in `<project_directory>/local/dist`
including the library `weasel_client` and the test framework `weasel_framework`
to which you can link your regression test tools.

[CMake]: https://cmake.org/
