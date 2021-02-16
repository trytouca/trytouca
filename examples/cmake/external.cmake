#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

include(FetchContent)

function(weasel_find_weasel)
    # This repository always pulls the latest code in the main branch of
    # the Weasel Client Library for C++. We recommend that you always use
    # a specific annotated tag when integrating Weasel as a third-party
    # dependency.
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

        # Weasel Client Library for C++ requires OpenSSL to communicate with
        # the Weasel Platform through HTTPS.
        # If OpenSSL is not installed in the default location, we may need to
        # provide its root directory as a hint to the library's build recipe.
        # Below is an typical example of doing so on macOS in case OpenSSL is
        # installed through `homebrew`.
        #   set(OPENSSL_ROOT_DIR /usr/local/opt/openssl)

        # proceed with building the Weasel Client Library and Test Framework.
        add_subdirectory(${weasel_SOURCE_DIR})
    endif()
endfunction()

function(weasel_find_cxxopts)
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
