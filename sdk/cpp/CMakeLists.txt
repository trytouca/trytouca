# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

cmake_minimum_required(VERSION 3.14...3.19 FATAL_ERROR)

project(touca VERSION 1.4.0 LANGUAGES CXX)

option(BUILD_SHARED_LIBS "build client as a shared library" OFF)
option(TOUCA_BUILD_TESTS "build unittests" OFF)
option(TOUCA_BUILD_UTILS "build utility applications" OFF)
option(TOUCA_BUILD_EXAMPLES "build sample regression test tool" OFF)
option(TOUCA_BUILD_FRAMEWORK "build regression test framework" OFF)
option(TOUCA_BUILD_COVERAGE_REPORT "enable code coverage generation" OFF)

set(TOUCA_CLIENT_ROOT_DIR ${CMAKE_CURRENT_LIST_DIR})
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_CXX_VISIBILITY_PRESET hidden)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_VISIBILITY_INLINES_HIDDEN ON)
set(CONAN_CMAKE_SILENT_OUTPUT ON)

if (NOT DEFINED CMAKE_CXX_STANDARD)
  set(CMAKE_CXX_STANDARD 11)
  set(CMAKE_CXX_STANDARD_REQUIRED ON)
endif()

if (NOT DEFINED CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()

if (NOT DEFINED CMAKE_DEBUG_POSTFIX)
    set(CMAKE_DEBUG_POSTFIX "d" CACHE STRING "Default postfix for libraries with debug build type")
endif()

if (NOT DEFINED CMAKE_ARCHIVE_OUTPUT_DIRECTORY)
    set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
endif()

if (NOT DEFINED CMAKE_LIBRARY_OUTPUT_DIRECTORY)
    set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
endif()

if (NOT DEFINED CMAKE_RUNTIME_OUTPUT_DIRECTORY)
    set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
endif()

set(CMAKE_CONFIGURATION_TYPES "Debug;Release" CACHE STRING "" FORCE)

if (TOUCA_BUILD_TESTS)
    if (MSVC)
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /W4")
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /wd4251")
    else()
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wextra -Werror -Wfatal-errors")
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -pedantic")
    endif()
endif()

if (TOUCA_BUILD_COVERAGE_REPORT)
    if (NOT CMAKE_BUILD_TYPE STREQUAL "Debug")
        message(FATAL_ERROR "code-coverage with non-Debug build is inaccurate")
    endif()
    if (NOT CMAKE_CXX_COMPILER_ID STREQUAL "AppleClang")
        message(STATUS "${CMAKE_CXX_COMPILER_ID}")
        message(FATAL_ERROR "code-coverage support is limited to clang compiler")
    endif()
    set(COVERAGE_COMPILER_FLAGS "-fprofile-instr-generate -fcoverage-mapping")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${COVERAGE_COMPILER_FLAGS}")
    # we intentionally avoid adding executable linker flag --coverage
    # to prevent re-building dependencies from source
    # set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} --coverage")
    message(STATUS "added code-coverage compiler flags: ${COVERAGE_COMPILER_FLAGS}")
endif()

list(APPEND CMAKE_MODULE_PATH ${CMAKE_CURRENT_BINARY_DIR})
include(cmake/external.cmake)

message(DEBUG "Touca: using cxx standard: ${CMAKE_CXX_STANDARD}")
message(DEBUG "Touca: using build type: ${CMAKE_BUILD_TYPE}")

add_subdirectory(src)

if (TOUCA_BUILD_TESTS)
    include(CTest)
    add_subdirectory(tests/client)
    if (TOUCA_BUILD_FRAMEWORK)
        add_subdirectory(tests/framework)
    endif()
endif()

if (TOUCA_BUILD_UTILS)
    add_subdirectory(utils)
endif()

if (TOUCA_BUILD_EXAMPLES)
    add_subdirectory(example/basic)
    if (TOUCA_BUILD_FRAMEWORK)
        add_subdirectory(example/starter)
        add_subdirectory(example/advanced)
        add_subdirectory(example/casino)
    endif()
endif()

if (TOUCA_BUILD_FRAMEWORK)
    add_subdirectory(framework)
endif()
