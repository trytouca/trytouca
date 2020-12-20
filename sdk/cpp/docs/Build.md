# Build Instructions

This document provides instructions for building client-side tools, libraries,
and frameworks including Weasel Client Library for C++, Weasel Test Framework
for C++, and Weasel Utility Command Line Tool.

## Supported Toolchains

We formally support building our library on Windows, Linux and macOS platforms
using C++11, C++14 and C++17 standards. Both the library and the test framework
can be built as shared or static libraries.

We test our library against the following compilers.

| Compiler     | Min Version | Min Version |
| ------------ | ----------- | ----------- |
| x86-64 gcc   | 7.1         | 10.2        |
| x86-64 clang | 7.0.0       | 11.0.0      |
| x64 MSVC     | 1900        | 1927        |

## Required Build Tools

As of v1.2, We use [Conan] for managing our third-party dependencies and
[CMake] as our build system. If you do not have [Conan] or [CMake] installed
already, please consult with their documentation for instructions to install
these tools on your platform.

## Obtaining the Source Code

Copy the source code of the client library by cloning the Weasel repository
to a directory of your choice.
We refer to this directory as `<project_directory>` in subsequent sections
of this document.

```bash
git clone git@github.com:getweasel/weasel-cpp.git weasel-cpp
```

## Building with our Helper Scripts

Weasel C++ Client has five main components.

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

If, for any reason, you do not want to build the components using our helper
scripts, follow the subsequent sections to learn what our scripts do.

## Installing Dependencies

Weasel Client Library for C++ has the following dependencies:

| Dependency  | Version |
|-------------|---------|
| boost       | 1.71.0  |
| catch2      | 2.13.3  |
| cxxopts     | 2.2.1   |
| flatbuffers | 1.12.0  |
| flatc       | 1.12.0  |
| fmt         | 7.1.3   |
| libcurl     | 7.74.0  |
| rapidjson   | 1.1.0   |

Since building these dependencies from source is time-consuming and
inconvenient, we leverage [Conan] dependency manager to download their
pre-compiled binaries for your build platform and use them during the
build process. Once you downloaded and installed Conan, run the following
commands to setup a Conan profile:

```bash
conan profile update settings.compiler.libcxx=libstdc++11 default
```

Now we can install the dependencies:

```bash
conan install -o with_tests=True \
  --install-folder "<project_directory>/local/build" \
  "<project_directory>/conanfile.py" --build=missing
```

Note the use of option `with_tests` in the command above that includes
installation of the dependency `catch2` which is required only for building
the unit tests.

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
| WEASEL_BUILD_TESTS     | Unit-Tests                  | ON      |
| WEASEL_BUILD_UTILS     | Command-Line Utility Tool   | ON      |
| WEASEL_BUILD_EXAMPLES  | Sample Test Tools           | ON      |
| WEASEL_BUILD_FRAMEWORK | Test Framework Library      | OFF     |

As an example, the command below enables building the test framework
and disables building the unit-tests.

```bash
cmake -B"<project_directory>/local/build" -H"<project_directory>" \
  -DWEASEL_BUILD_TESTS=OFF -DWEASEL_BUILD_FRAMEWORK=ON
```

## Running the Building System

Finally, we can proceed with building the source code via CMake which uses
the native build tool of your platform.

```bash
cmake --build "<project_directory>/local/build"
```

This command produces the build artifacts in `<project_directory>/local/dist`
including the library `weasel_client` and the test framework `weasel_framework`
to which you can link your regression test tools.

[Conan]: https://conan.io/
[CMake]: https://cmake.org/
