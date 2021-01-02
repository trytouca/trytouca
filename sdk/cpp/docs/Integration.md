# Integration

This document describes how to pull Weasel client library and/or Weasel test
framework as a dependency into your own project.

## Requirements

At this time, the recommended way to use Weasel as a third-party library is
to use [Conan]. Conan is an open-source cross-platform package manager that
enables efficient management of project dependencies across build systems.
If you have never used Conan, we refer you to their [online documentation][conan-docs]
to learn more about it.

## Setting Up Conan

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

## Installing Weasel as a Dependency

We can now install Weasel using the Conan package manager. To do so, we first
register Weasel's Conan remote repository.

```bash
conan remote add weasel-conan https://api.bintray.com/conan/getweasel/weasel-cpp
```

We can now ask Conan to install Weasel as a dependency and generate a CMake
find module that we can integrate with our build system.

```bash
conan install -if "${dir_build}" -g cmake_find_package -b missing "weasel/1.2.1@_/_"
```

Where `${dir_build}` is the path to the CMake build directory.

## Configuring CMake

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
