---
description: Using Touca SDK for C++ as a third-party dependency
---

# Integration

This document describes how to pull Touca SDK for C++ and its components as a dependency into your own project. Checkout our [Build Instructions](build.md) if your process involves building dependencies from source.

## Using CMake

The easiest way to use Touca as a third-party dependency in your project is to use [CMake](https://cmake.org/) version 3.11 or higher. If you do not have a recent version of CMake installed already, please consult with their documentation for instructions to install it on your platform.

### Pulling the Client Library

Assuming that your project is already using CMake, you can pull Touca as a dependency, using CMake’s [FetchContent](https://cmake.org/cmake/help/latest/module/FetchContent.html) module as shown below.

```text
FetchContent_Declare(
    touca
    GIT_REPOSITORY https://github.com/trytouca/touca-cpp.git
    GIT_TAG        v1.3.0
)
FetchContent_MakeAvailable(touca)
```

The above CMake code pulls the latest stable code of the Client Library and generates a `touca_client` CMake target to which you can link your own project.

### Pulling the Test Framework

But in addition to the Client Library, Touca SDK for C++ also includes a Test Framework which is disabled by default. For serious regression test tools, we encourage the use of this test framework which can be build with a small modification to the code above:

```text
FetchContent_Declare(
    touca
    GIT_REPOSITORY https://github.com/trytouca/touca-cpp.git
    GIT_TAG        v1.4.0
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

The code above builds an additional CMake target `touca_framework` to be linked by regression test tools that make use of the Touca Test Framework.

### Enabling HTTPS

Touca SDK for C++ requires OpenSSL to communicate with the Touca server through HTTPS. In most platforms, this library is automatically discovered and used by the build recipe. But if OpenSSL is not installed in the default location, we may need to provide its root directory as a hint to the library’s build recipe. Below is a typical example of doing so on macOS if OpenSSL is installed through `homebrew`.

```text
set(OPENSSL_ROOT_DIR /usr/local/opt/openssl)
```

## Using Conan

As an alternative, you can use [Conan](https://conan.io/) to pull Touca as a third-party library. Conan is an open-source cross-platform package manager that enables efficient management of project dependencies across build systems. If you have never used Conan, we refer you to their [online documentation](https://docs.conan.io/) to learn more about it.

### Setting Up Conan

If you do not have Conan locally installed, the preferred way to install it is through the Python Package Index using the `pip` command:

```bash
pip install conan
```

If this is the first time you are using Conan, we recommend that you setup a Conan profile based on your system environment.

```bash
conan profile new default --detect
conan profile update settings.compiler.libcxx=libstdc++11 default
```

### Installing Conan Package

We can now install Touca using the Conan package manager. To do so, we first register Touca's Conan remote repository.

```bash
conan remote add touca-cpp https://getweasel.jfrog.io/artifactory/api/conan/touca-cpp
```

We can now ask Conan to install Touca as a dependency and generate a CMake find module that we can integrate with our build system.

```bash
conan install -if "${dir_build}" -g cmake_find_package -b missing "touca/1.4.0@_/_"
```

Where `${dir_build}` is the path to the CMake build directory.

### Discovering Conan Packages

Assuming we use `${dir_build}` as our CMake binary directory, to discover and use the Conan-generated CMake find module we can ensure `${dir_build}` is part of our CMake module path.

```text
list(APPEND CMAKE_MODULE_PATH ${CMAKE_BINARY_DIR})
find_package("touca" QUIET)
```

This lets us link the Touca Client Library or Test Framework with our project like any other library.

```text
target_link_libraries(<YOUR_PROJECT> PRIVATE touca::client)
```
