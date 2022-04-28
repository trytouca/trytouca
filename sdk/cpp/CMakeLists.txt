# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

cmake_minimum_required(VERSION 3.14...3.21 FATAL_ERROR)

include(cmake/find_version.cmake)

if (NOT DEFINED TOUCA_MAIN_PROJECT)
    set(TOUCA_MAIN_PROJECT OFF)
    if(CMAKE_CURRENT_SOURCE_DIR STREQUAL CMAKE_SOURCE_DIR)
        set(TOUCA_MAIN_PROJECT ON)
    endif()
endif()

option(BUILD_SHARED_LIBS "build client as a shared library" OFF)
option(TOUCA_BUILD_TESTS "build unittests" OFF)
option(TOUCA_BUILD_CLI "build utility command line tool" OFF)
option(TOUCA_BUILD_EXAMPLES "build example test projects" OFF)
option(TOUCA_BUILD_FRAMEWORK "build regression test framework" ON)
option(TOUCA_ENABLE_COVERAGE "enable code coverage generation" OFF)
option(TOUCA_INSTALL "Generate the install target" ${TOUCA_MAIN_PROJECT})

set(TOUCA_CLIENT_ROOT_DIR ${CMAKE_CURRENT_LIST_DIR})
set(TOUCA_TARGET_MAIN touca)
set(TOUCA_TARGET_TEST touca_tests)

set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_CXX_VISIBILITY_PRESET hidden)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_VISIBILITY_INLINES_HIDDEN ON)
set(CONAN_CMAKE_SILENT_OUTPUT ON)

project(touca VERSION ${TOUCA_VERSION} LANGUAGES CXX)

if (NOT DEFINED CMAKE_CXX_STANDARD)
    set(CMAKE_CXX_STANDARD 11)
    set(CMAKE_CXX_STANDARD_REQUIRED ON)
endif()

if (NOT DEFINED CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
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

add_library(touca_project_options INTERFACE)

if(CMAKE_GENERATOR STREQUAL "Ninja")
    if(CMAKE_CXX_COMPILER_ID STREQUAL "Clang" OR CMAKE_CXX_COMPILER_ID STREQUAL "AppleClang")
        target_compile_options(touca_project_options INTERFACE -fcolor-diagnostics)
    endif()
    if(CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
        target_compile_options(touca_project_options INTERFACE -fdiagnostics-color=always)
    endif()
endif()

if (TOUCA_BUILD_TESTS)
    if (MSVC)
        target_compile_options(touca_project_options INTERFACE /W4 /wd4251)
    else()
        target_compile_options(touca_project_options INTERFACE -Wextra -Werror -Wfatal-errors)
        target_compile_options(touca_project_options INTERFACE -Wall -pedantic)
    endif()
endif()

if (TOUCA_ENABLE_COVERAGE)
    if (NOT CMAKE_BUILD_TYPE STREQUAL "Debug")
        message(FATAL_ERROR "code-coverage with non-Debug build is inaccurate")
    endif()
    if (CMAKE_CXX_COMPILER_ID STREQUAL "GNU" OR CMAKE_CXX_COMPILER_ID STREQUAL "Clang")
        target_compile_options(touca_project_options INTERFACE --coverage -O0 -g)
        target_link_libraries(touca_project_options INTERFACE --coverage)
    endif()
    if (CMAKE_CXX_COMPILER_ID STREQUAL "AppleClang")
        # target_compile_options(touca_project_options -fprofile-instr-generate -fcoverage-mapping)
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fprofile-instr-generate -fcoverage-mapping")
        # we intentionally avoid adding executable linker flag --coverage
        # to prevent re-building dependencies from source
        # set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} --coverage")
    endif()
    message(STATUS "added compiler flags to generate coverage report")
endif()

list(APPEND CMAKE_MODULE_PATH ${CMAKE_CURRENT_BINARY_DIR})
include(cmake/external.cmake)

message(DEBUG "Touca: building version: ${TOUCA_VERSION}")
message(DEBUG "Touca: using cxx standard: ${CMAKE_CXX_STANDARD}")
message(DEBUG "Touca: using build type: ${CMAKE_BUILD_TYPE}")

add_subdirectory(src)

if (TOUCA_BUILD_TESTS)
    include(CTest)
    add_subdirectory(tests)
endif()

if (TOUCA_BUILD_CLI)
    add_subdirectory(cli)
endif()

if (TOUCA_BUILD_EXAMPLES)
    add_subdirectory(examples)
endif()

if (TOUCA_INSTALL)
    install(
        TARGETS ${TOUCA_TARGET_MAIN}
        EXPORT touca
        RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
                COMPONENT Touca_Runtime
        LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
                COMPONENT Touca_Runtime NAMELINK_COMPONENT Touca_Development
        ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
                COMPONENT Touca_Development
    )
    install(DIRECTORY "${TOUCA_CLIENT_ROOT_DIR}/include/touca"
            DESTINATION include MESSAGE_NEVER FILES_MATCHING PATTERN "*.h*")
    install(DIRECTORY "${CMAKE_BINARY_DIR}/generated/touca"
            DESTINATION include MESSAGE_NEVER FILES_MATCHING PATTERN "*.h*")

    set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "Touca SDK for C++")
    set(CPACK_PACKAGE_HOMEPAGE_URL "https://touca.io")
    set(CPACK_PACKAGE_NAME "touca")
    set(CPACK_PACKAGE_VENDOR "Touca, Inc.")
    set(CPACK_RESOURCE_FILE_LICENSE "${TOUCA_CLIENT_ROOT_DIR}/LICENSE")
    set(CPACK_RESOURCE_FILE_README "${TOUCA_CLIENT_ROOT_DIR}/README.md")
    set(CPACK_SOURCE_GENERATOR "TGZ;ZIP")
    include(CPack)
endif()
