#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

cmake_minimum_required(VERSION 3.14...3.19 FATAL_ERROR)
project(weasel_cpp_tutorials VERSION 1.2.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_CXX_VISIBILITY_PRESET hidden)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_VISIBILITY_INLINES_HIDDEN ON)
set(CONAN_CMAKE_SILENT_OUTPUT ON)

if (NOT DEFINED CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

if (NOT DEFINED CMAKE_RUNTIME_OUTPUT_DIRECTORY)
    set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
endif()

# we use cmake FetchContent to pull Weasel Client Library and Test Framework
# as dependencies.

include(FetchContent)

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

    # Weasel Client Library for C++ requires OpenSSL to communicate with the
    # Weasel Platform through HTTPS.
    # If OpenSSL is not installed in the default location, we may need to
    # provide its root directory as a hint to the library's build recipe.
    # Below is an typical example of doing so on macOS in case OpenSSL is
    # installed through `homebrew`.
    #   set(OPENSSL_ROOT_DIR /usr/local/opt/openssl)

    # proceed with building the Weasel Client Library and Test Framework.
    add_subdirectory(${weasel_SOURCE_DIR})
endif()

add_subdirectory(basic)
add_subdirectory(advanced)
