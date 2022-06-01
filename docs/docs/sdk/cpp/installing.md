# Installing

This document walks you through adding the Touca SDK for C++ and its components
as a dependency to your own project. Refer to our
[Build Instructions](./building.md) if you like to build Touca from source.

## Using CMake

Assuming that your project is already using CMake, the easiest way to pull Touca
as a dependency is to use [CMake](https://cmake.org/) v3.11 or newer which
includes CMake's
[FetchContent](https://cmake.org/cmake/help/latest/module/FetchContent.html)
module.

```text
FetchContent_Declare(
    touca
    GIT_REPOSITORY https://github.com/trytouca/trytouca
    GIT_TAG        v1.5.2
    SOURCE_SUBDIR  sdk/cpp
)
FetchContent_MakeAvailable(touca)
```

### Building Extra Components

The above code pulls the latest stable release of the Touca SDK for C++ and
generates a `touca_client` CMake target that you can link to.

We can use the slightly more verbose `FetchContent_GetProperties` pattern to
customize the set of build targets, to include building Touca command-line
application and example projects or to exclude building the test framework:

```text
FetchContent_Declare(
    touca
    GIT_REPOSITORY https://github.com/trytouca/trytouca
    GIT_TAG        v1.5.2
    SOURCE_SUBDIR  sdk/cpp
)

FetchContent_GetProperties(touca)
if(NOT touca_POPULATED)
    FetchContent_Populate(touca)
    set(TOUCA_BUILD_CLI ON)
    set(TOUCA_BUILD_EXAMPLES ON)
    add_subdirectory(${touca_SOURCE_DIR})
endif()
```

### Enabling HTTPS

The SDK has an optional dependency on OpenSSL for communicating with the Touca
server over HTTPS. In most platforms, this library is automatically discovered
and used by the build recipe. If OpenSSL is not installed in the default
location, we may need to provide its root directory as a hint to the library’s
build recipe. Here is a typical way to do so on macOS when OpenSSL is installed
through `homebrew`.

```text
set(OPENSSL_ROOT_DIR /usr/local/opt/openssl)
```

## Using Conan

As an alternative, you can use [Conan](https://conan.io/) to pull Touca as a
dependency. Conan is a cross-platform package manager that enables efficient
management of project dependencies. Refer to
[Conan documentation](https://docs.conan.io/) to learn more.

### Setting Up Conan

If you do not have Conan locally installed, the preferred way to install it is
through the Python Package Index using the `pip` command:

```bash
pip install conan
```

If this is the first time you are using Conan, we recommend that you setup a
Conan profile based on your system environment.

```bash
conan profile new default --detect
conan profile update settings.compiler.libcxx=libstdc++11 default
```

### Installing Touca

We can now install Touca using the Conan package manager. To do so, we first
register Touca's Conan remote repository.

```bash
conan remote add touca-cpp https://getweasel.jfrog.io/artifactory/api/conan/touca-cpp
```

We can now ask Conan to install Touca as a dependency and generate a CMake find
module that we can integrate with our build system.

```bash
conan install -if "${dir_build}" -g cmake_find_package -b missing "touca/1.4.1@_/_"
```

Where `${dir_build}` is the path to the CMake build directory.

### Discovering Conan Packages

Assuming we use `${dir_build}` as our CMake binary directory, to discover and
use the Conan-generated CMake find module we can ensure `${dir_build}` is part
of our CMake module path.

```text
list(APPEND CMAKE_MODULE_PATH ${CMAKE_BINARY_DIR})
find_package("touca" QUIET)
```

This lets us link the Touca client library or test framework with our project
like any other library.

```text
target_link_libraries(<YOUR_PROJECT> PRIVATE touca_framework)
```
