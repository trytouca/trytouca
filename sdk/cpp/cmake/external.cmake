# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

include_guard()

include(FetchContent)

function(touca_find_catch2)
    FetchContent_Declare(
        catch2
        GIT_REPOSITORY  https://github.com/catchorg/Catch2.git
        GIT_TAG         v2.13.4
    )
    FetchContent_GetProperties(catch2)
    if (NOT catch2_POPULATED)
        FetchContent_Populate(catch2)
        add_library(Catch2 INTERFACE)
        add_library(Catch2::Catch2 ALIAS Catch2)
        target_include_directories(Catch2 INTERFACE ${catch2_SOURCE_DIR}/single_include)
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

function(touca_find_fmt)
    FetchContent_Declare(
        fmt
        GIT_REPOSITORY  https://github.com/fmtlib/fmt.git
        GIT_TAG         7.1.3
    )
    FetchContent_GetProperties(fmt)
    if (NOT fmt_POPULATED)
        FetchContent_Populate(fmt)
        add_library(fmt INTERFACE)
        add_library(fmt::fmt ALIAS fmt)
        target_compile_definitions(fmt INTERFACE FMT_HEADER_ONLY=1)
        target_include_directories(fmt INTERFACE ${fmt_SOURCE_DIR}/include)
    endif()
endfunction()

function(touca_find_ghcfilesystem)
    FetchContent_Declare(
        ghcFilesystem
        GIT_REPOSITORY  https://github.com/gulrak/filesystem.git
        GIT_TAG         v1.5.4
    )
    FetchContent_GetProperties(ghcFilesystem)
    if(NOT ghcfilesystem_POPULATED)
        FetchContent_Populate(ghcFilesystem)
        add_library(ghcFilesystem INTERFACE)
        add_library(ghcFilesystem::ghcFilesystem ALIAS ghcFilesystem)
        target_include_directories(ghcFilesystem INTERFACE ${ghcfilesystem_SOURCE_DIR}/include)
    endif()
endfunction()

function(touca_find_flatbuffers)
    FetchContent_Declare(
        flatbuffers
        GIT_REPOSITORY  https://github.com/google/flatbuffers.git
        GIT_TAG         v1.12.0
    )
    FetchContent_GetProperties(flatbuffers)
    if (NOT flatbuffers_POPULATED)
        FetchContent_Populate(flatbuffers)
        add_library(flatbuffers INTERFACE)
        add_library(flatbuffers::flatbuffers ALIAS flatbuffers)
        target_include_directories(flatbuffers INTERFACE ${flatbuffers_SOURCE_DIR}/include)
    endif()
endfunction()

function(touca_find_httplib)
    FetchContent_Declare(
        httplib
        GIT_REPOSITORY  https://github.com/yhirose/cpp-httplib.git
        GIT_TAG         v0.8.3
    )
    FetchContent_GetProperties(httplib)
    if (NOT httplib_POPULATED)
        FetchContent_Populate(httplib)
        add_library(httplib INTERFACE)
        add_library(httplib::httplib ALIAS httplib)
        target_include_directories(httplib INTERFACE ${httplib_SOURCE_DIR})
    endif()
endfunction()

function(touca_find_rapidjson)
    FetchContent_Declare(
        rapidjson
        GIT_REPOSITORY  https://github.com/Tencent/rapidjson.git
        GIT_TAG         13dfc96c9c2b104be7b0b09a9f6e06871ed3e81d
    )
    FetchContent_GetProperties(RapidJSON)
    if (NOT rapidjson_POPULATED)
        FetchContent_Populate(RapidJSON)
        add_library(RapidJSON INTERFACE)
        add_library(RapidJSON::RapidJSON ALIAS RapidJSON)
        target_include_directories(RapidJSON INTERFACE ${rapidjson_SOURCE_DIR}/include)
    endif()
endfunction()

function(touca_find_spdlog)
    FetchContent_Declare(
        spdlog
        GIT_REPOSITORY  https://github.com/gabime/spdlog.git
        GIT_TAG         v1.8.2
    )
    FetchContent_GetProperties(spdlog)
    if (NOT spdlog_POPULATED)
        FetchContent_Populate(spdlog)
        add_library(spdlog INTERFACE)
        add_library(spdlog::spdlog ALIAS spdlog)
        target_compile_definitions(spdlog INTERFACE SPDLOG_FMT_EXTERNAL)
        target_include_directories(spdlog INTERFACE ${spdlog_SOURCE_DIR}/include)
    endif()
endfunction()

function(touca_find_package)
    set(target_name ${ARGV0}::${ARGV0})
    set(find_module_name ${ARGV0})
    string(TOLOWER ${ARGV0} ots_name)
    if (1 LESS ${ARGC})
        set(find_module_name ${ARGV1})
    endif()

    if (TARGET ${target_name})
        return()
    endif()
    find_package(${find_module_name} QUIET)
    if (${find_module_name}_FOUND AND TARGET ${target_name})
        message(DEBUG "Touca: found package: ${ots_name}")
        return()
    endif()
    message(STATUS "Touca: fetching thirdparty dependency: ${ots_name}")
    cmake_language(CALL touca_find_${ots_name})
endfunction()
