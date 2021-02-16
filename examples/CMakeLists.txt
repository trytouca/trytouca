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

list(APPEND CMAKE_MODULE_PATH ${CMAKE_CURRENT_BINARY_DIR})
include(cmake/external.cmake)
weasel_find_weasel()

add_subdirectory(basic)
add_subdirectory(advanced)
