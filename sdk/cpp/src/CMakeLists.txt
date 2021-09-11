# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

include(GenerateExportHeader)
include(GNUInstallDirs)

touca_find_package("flatbuffers" "Flatbuffers")
touca_find_package("fmt")
touca_find_package("ghcFilesystem")
touca_find_package("httplib")
touca_find_package("RapidJSON")
touca_find_package("spdlog")
if (TOUCA_BUILD_FRAMEWORK)
    touca_find_package("cxxopts")
endif()

add_library(touca_client "")

target_sources(
        touca_client
    PRIVATE
        client.cpp
        touca.cpp
        devkit/comparison.cpp
        devkit/filesystem.cpp
        devkit/logger.cpp
        devkit/object.cpp
        devkit/platform.cpp
        devkit/resultfile.cpp
        devkit/testcase.cpp
        devkit/types.cpp
        devkit/utils.cpp
)

if (TOUCA_BUILD_FRAMEWORK)
    target_sources(
        touca_client
    PRIVATE
        framework/framework.cpp
        framework/suites.cpp
        framework/utils.cpp
    )
endif()

target_link_libraries(
        touca_client
    PRIVATE
        httplib::httplib
        spdlog::spdlog
        touca_project_options
    PUBLIC
        ghcFilesystem::ghcFilesystem
        flatbuffers::flatbuffers
        fmt::fmt
        RapidJSON::RapidJSON
        $<$<PLATFORM_ID:Linux>:pthread>
)

if (TOUCA_BUILD_FRAMEWORK)
    target_link_libraries(touca_client PRIVATE cxxopts::cxxopts)
endif()

target_include_directories(
        touca_client
    PUBLIC
        $<BUILD_INTERFACE:${TOUCA_CLIENT_ROOT_DIR}/include>
        $<BUILD_INTERFACE:${CMAKE_BINARY_DIR}/generated>
        $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>
)

target_compile_definitions(
        touca_client
    PRIVATE
        RAPIDJSON_HAS_STDSTRING
        $<$<CXX_COMPILER_ID:MSVC>:NOMINMAX>
        $<$<CXX_COMPILER_ID:MSVC>:_CRT_SECURE_NO_WARNINGS>
)

target_compile_options(
        touca_client
    PRIVATE
        $<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wno-unused-parameter>
)

target_compile_features(
        touca_client
    PRIVATE
        cxx_variadic_templates
        $<$<NOT:$<CXX_COMPILER_ID:MSVC>>:cxx_aggregate_default_initializers>
        cxx_defaulted_functions
        cxx_lambdas
        cxx_long_long_type
        cxx_override
        cxx_range_for
        cxx_static_assert
        cxx_strong_enums
    PUBLIC
        cxx_auto_type
)

set_target_properties(
        touca_client
    PROPERTIES
        SOVERSION ${CPACK_PACKAGE_VERSION_MAJOR}
        VERSION ${TOUCA_VERSION}
        POSITION_INDEPENDENT_CODE ON
        DEBUG_POSTFIX ${CMAKE_DEBUG_POSTFIX}
)

find_package(OpenSSL QUIET)
if (OpenSSL_FOUND)
    target_link_libraries(touca_client PRIVATE OpenSSL::SSL OpenSSL::Crypto)
    target_compile_definitions(touca_client PRIVATE CPPHTTPLIB_OPENSSL_SUPPORT)
else()
    message(WARNING
        " Failed to find OpenSSL."
        " Touca will be built without HTTPS support.\n"
        " See https://docs.touca.io/sdk/cpp/installing#enabling-https")
endif()

generate_export_header(
    touca_client
    EXPORT_MACRO_NAME "TOUCA_CLIENT_API"
    EXPORT_FILE_NAME "${CMAKE_BINARY_DIR}/generated/touca/lib_api.hpp"
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:touca_client,SOURCES>
)
