# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

include(FetchContent)

# This SDK has an optional dependency on OpenSSL that enables HTTPS
# communication. In most platforms, this library is automatically discovered
# and used by the build recipe. If OpenSSL is not installed in the default
# location, we may need to provide its root directory as a hint to the
# library’s build recipe. Here is a typical way to do so on macOS when
# OpenSSL is installed through homebrew.
set(OPENSSL_ROOT_DIR /opt/homebrew/opt/openssl@1.1)

function(touca_find_touca)
    # This repository always pulls the latest code in the main branch of
    # the Touca SDK for C++. We recommend that you always use a specific
    # annotated tag when integrating Touca as a third-party dependency.
    FetchContent_Declare(
        touca
        GIT_REPOSITORY https://github.com/trytouca/trytouca
        GIT_TAG        origin/main
        SOURCE_SUBDIR  sdk/cpp
    )
    FetchContent_MakeAvailable(touca)
endfunction()

function(touca_find_cxxopts)
    FetchContent_Declare(
        cxxopts
        GIT_REPOSITORY  https://github.com/jarro2783/cxxopts
        GIT_TAG         v3.0.0
    )
    FetchContent_GetProperties(cxxopts)
    if (NOT cxxopts_POPULATED)
        FetchContent_Populate(cxxopts)
        add_library(cxxopts INTERFACE)
        add_library(cxxopts::cxxopts ALIAS cxxopts)
        target_include_directories(cxxopts INTERFACE ${cxxopts_SOURCE_DIR}/include)
    endif()
endfunction()
