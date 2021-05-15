#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

cmake_minimum_required(VERSION 3.5.1 FATAL_ERROR)

project(touca_cmp VERSION 1.4.0 LANGUAGES CXX)

set(TOUCA_COMPARATOR_ROOT_DIR ${CMAKE_CURRENT_LIST_DIR})

set(CMAKE_CXX_STANDARD 17)
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

if(APPLE)
    set(CMAKE_INSTALL_RPATH "@executable_path/../lib")
else()
    set(CMAKE_INSTALL_RPATH "$ORIGIN/../lib")
endif()
set(CMAKE_BUILD_WITH_INSTALL_RPATH ON)

list(APPEND CMAKE_MODULE_PATH ${CMAKE_CURRENT_BINARY_DIR})
macro(touca_find_package package_name)
    find_package(${package_name} QUIET)
    if (NOT ${package_name}_FOUND)
        message (FATAL_ERROR "required dependency on ${package_name} is missing")
    endif()
endmacro()

add_subdirectory(src)
