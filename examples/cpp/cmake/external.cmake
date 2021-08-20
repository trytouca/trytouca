# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

include(FetchContent)

function(touca_find_touca)
    # This repository always pulls the latest code in the main branch of
    # the Touca SDK for C++. We recommend that you always use a specific
    # annotated tag when integrating Touca as a third-party dependency.
    FetchContent_Declare(
        touca
        GIT_REPOSITORY https://github.com/trytouca/touca-cpp.git
        GIT_TAG        origin/main
    )

    FetchContent_GetProperties(touca)
    if(NOT touca_POPULATED)
        FetchContent_Populate(touca)

        # enable building of the Touca Test Framework
        set(TOUCA_BUILD_FRAMEWORK ON)

        # Touca Client Library for C++ requires OpenSSL to communicate with
        # the Touca Platform through HTTPS.
        # If OpenSSL is not installed in the default location, we may need to
        # provide its root directory as a hint to the library's build recipe.
        # Below is a typical example of doing so on macOS in case OpenSSL is
        # installed through `homebrew`.
        # set(OPENSSL_ROOT_DIR /usr/local/opt/openssl)

        # proceed with building the Touca Client Library and Test Framework.
        add_subdirectory(${touca_SOURCE_DIR})
    endif()
endfunction()

function(touca_find_cxxopts)
    FetchContent_Declare(
        cxxopts
        GIT_REPOSITORY  https://github.com/jarro2783/cxxopts
        GIT_TAG         v2.2.1
    )
    FetchContent_GetProperties(cxxopts)
    if (NOT cxxopts_POPULATED)
        FetchContent_Populate(cxxopts)
        add_library(cxxopts INTERFACE)
        add_library(cxxopts::cxxopts ALIAS cxxopts)
        target_include_directories(cxxopts INTERFACE ${cxxopts_SOURCE_DIR}/include)
    endif()
endfunction()
