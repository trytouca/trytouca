# Integration

This document describes how to pull Weasel client library and/or Weasel test
framework as a dependency into your own project.

**Note**: Read our [Build Instructions](./docs/Build.md) for instructions to
build the client library and other components from source.

## Using CMake

The easiest way to use Weasel as a third-party dependency in your project is
to use [CMake] version 3.11 or higher. If you do not have a recent version
of CMake installed already, please consult with their documentation for
instructions to install it on your platform.

Assuming that your project is already using CMake, you can pull Weasel as a
dependency, using CMake's [FetchContent] module as shown below.

```cmake
FetchContent_Declare(
    weasel
    GIT_REPOSITORY https://github.com/getweasel/weasel-cpp.git
    GIT_TAG        v1.3.0
)
FetchContent_MakeAvailable(weasel)
```

The above CMake code pulls the latest stable code of the Client Library and
generates a `weasel_client` CMake target to which you can link your own project.

But in addition to the Client Library for C++, this repository also includes
a Test Framework for C++ which is disabled by default. For serious regression
test tools, we encourage use of this test framework which can be build with
a small modification to the code above:

```cmake
FetchContent_Declare(
    weasel
    GIT_REPOSITORY https://github.com/getweasel/weasel-cpp.git
    GIT_TAG        origin/main
)

FetchContent_GetProperties(weasel)
if(NOT weasel_POPULATED)
    FetchContent_Populate(weasel)

    # enable building of weasel test framework
    set(WEASEL_BUILD_FRAMEWORK ON)

    # optionally, provide the path to the OpenSSL root directory
    # set(OPENSSL_ROOT_DIR <path_to_openssl>)

    # proceed with building the Weasel Client Library and Test Framework.
    add_subdirectory(${weasel_SOURCE_DIR})
endif()
```

The code above builds an additional CMake target `weasel_framework` to be
linked to by regression test tools that make use of the Weasel Test Framework.

Weasel Client Library for C++ requires OpenSSL to communicate with the Weasel
Platform through HTTPS. In most platforms, this library is automatically
discovered and used by the build recipe. But if OpenSSL is not installed in
the default location, we may need to provide its root directory as a hint to
the library's build recipe. Below is a typical example of doing so on macOS
in case OpenSSL is installed through `homebrew`.

```cmake
set(OPENSSL_ROOT_DIR /usr/local/opt/openssl)
```

## Using Conan

As an alternative, it is possible to use [Conan] for pulling Weasel as a
third-party library. Conan is an open-source cross-platform package manager
that enables efficient management of project dependencies across build systems.
If you have never used Conan, we refer you to their [online documentation][conan-docs]
to learn more about it.

### Setting Up Conan

If you do not have Conan locally installed, the preferrerd way to install it
is through the Python Package Index using the `pip` command:

```bash
pip install conan
```

If this is the first time you are using Conan, we recommend that you setup
a Conan profile based on your system environment.

```bash
conan profile new default --detect
conan profile update settings.compiler.libcxx=libstdc++11 default
```

### Installing Conan Package

We can now install Weasel using the Conan package manager. To do so, we first
register Weasel's Conan remote repository.

```bash
conan remote add weasel-conan https://api.bintray.com/conan/getweasel/weasel-cpp
```

We can now ask Conan to install Weasel as a dependency and generate a CMake
find module that we can integrate with our build system.

```bash
conan install -if "${dir_build}" -g cmake_find_package -b missing "weasel/1.3.0@_/_"
```

Where `${dir_build}` is the path to the CMake build directory.

### Discovering Conan Packages

Assuming we use `${dir_build}` as our CMake binary directory, to discover and
use the Conan-generated CMake find module we can ensure `${dir_build}` is part
of our CMake module path.

```cmake
list(APPEND CMAKE_MODULE_PATH ${CMAKE_BINARY_DIR})
find_package("weasel" QUIET)
```

This lets us link the Weasel Client Library or Test Framework with our project
like any other library.

```cmake
target_link_libraries(<YOUR_PROJECT> PRIVATE weasel::client)
```

[Conan]: https://conan.io/
[conan-docs]: https://docs.conan.io/
[conan-install]: https://docs.conan.io/en/latest/installation.html
[CMake]: https://cmake.org/

[FetchContent]: https://cmake.org/cmake/help/latest/module/FetchContent.html
