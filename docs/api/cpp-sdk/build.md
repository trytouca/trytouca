# Building Touca

This document walks you through building Touca SDK for C++ and its side
components from its source code. Refer to our [Using Touca](integration.md)
document to learn how to pull Touca as a third-party dependency.

## Requirements

You can build Touca on Linux, macOS, and Windows platforms. We support C++11 and
newer standards. We use [CMake](https://cmake.org/) as our build system. You
would need CMake v3.14 or newer to build Touca. We formally support the
following compilers:

| Compiler     | Min Version |
| ------------ | ----------- |
| x86-64 gcc   | 7.1         |
| x86-64 clang | 7.0.0       |
| x64 MSVC     | 1900        |

## Obtaining the Source Code

Touca SDK for C++ is available
[on GitHub](https://github.com/trytouca/touca-cpp) under the Apache-2.0 license.
Clone this repository to a directory of your choice. We refer to this directory
as `<project_directory>`.

```bash
git clone git@github.com:trytouca/touca-cpp.git <project_directory>
```

### Using Our Helper Script

Touca SDK for C++ has five main components.

| Name                         | Build Argument     |
| ---------------------------- | ------------------ |
| Client Library for C++       |                    |
| Test Framework for C++       | `--with-framework` |
| Sample Regression Test Tools | `--with-examples`  |
| Utility Command Line Tool    | `--with-utils`     |
| Unit Tests                   | `--with-tests`     |

We provide build scripts `build.sh` and `build.bat` for Unix and Windows
platforms, respectively. The build scripts build "Client Library for C++" by
default. You can pass the appropriate argument shown in the table above to build
other components as needed.

As an example, the command below builds all the components except the unit
tests.

```bash
./build.sh --with-framework --with-utils --with-examples
```

You can build all of the components using the `--all` argument.

```bash
./build.sh --all
```

### Using CMake Directly

If, for any reason, you do not want to build Touca using our helper scripts, you
can always use CMake directly. To do so, we recommend running the following
command first, to configure the build targets and specify the path in which
build artifacts should be generated. While you can change the build directory to
the directory of your choice, the subsequent instructions assume the default
value of `./local/build`.

```bash
cmake -B"<project_directory>/local/build" -H"<project_directory>"
```

By default, the above-mentioned command configures CMake to build the core Touca
Client Library. But Touca has several other components that can be enabled by
passing the appropriate options to the command above, as listed in the table
below.

| Component Name            | CMake Option            | Default |
| ------------------------- | ----------------------- | ------- |
| Test Framework Library    | `TOUCA_BUILD_FRAMEWORK` | OFF     |
| Command-Line Utility Tool | `TOUCA_BUILD_UTILS`     | OFF     |
| Sample Test Tools         | `TOUCA_BUILD_EXAMPLES`  | OFF     |
| Unit-Tests                | `TOUCA_BUILD_TESTS`     | OFF     |

As an example, the command below enables building Touca Test Framework for C++.

```bash
cmake -B"<project_directory>/local/build" -H"<project_directory>" -DTOUCA_BUILD_FRAMEWORK=ON
```

Now we can proceed with building the source code via CMake which uses the native
build tool of your platform.

```bash
cmake --build "<project_directory>/local/build" --parallel
```

Optionally, as a last step, we can install the build artifacts in a directory of
our choice for easier packaging.

```bash
cmake --install "<project_directory>/local/build" --prefix "<project_directory>/local/dist"
```
