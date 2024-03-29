# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

include(GenerateExportHeader)
include(GNUInstallDirs)

touca_find_package("flatbuffers")
touca_find_package("fmt")
touca_find_package("ghcFilesystem" "ghc_filesystem")
touca_find_package("httplib")
touca_find_package("RapidJSON")
touca_find_package("mpark_variant")
if (TOUCA_BUILD_RUNNER)
    touca_find_package("cxxopts")
endif()

add_library(${TOUCA_TARGET_MAIN} "")

target_sources(
        ${TOUCA_TARGET_MAIN}
    PRIVATE
        client.cpp
        comparison.cpp
        deserialize.cpp
        filesystem.cpp
        options.cpp
        testcase.cpp
        touca.cpp
        transport.cpp
        types.cpp
)

if (TOUCA_BUILD_RUNNER)
    target_sources(${TOUCA_TARGET_MAIN} PRIVATE runner.cpp)
endif()

target_link_libraries(
        ${TOUCA_TARGET_MAIN}
    PRIVATE
        httplib::httplib
        touca_project_options
    PUBLIC
        ghcFilesystem::ghcFilesystem
        flatbuffers::flatbuffers
        fmt::fmt
        RapidJSON::RapidJSON
        mpark_variant::mpark_variant
        $<$<PLATFORM_ID:Linux>:pthread>
)

if (TOUCA_BUILD_RUNNER)
    target_link_libraries(${TOUCA_TARGET_MAIN} PRIVATE cxxopts::cxxopts)
endif()

target_include_directories(
        ${TOUCA_TARGET_MAIN}
    PUBLIC
        $<BUILD_INTERFACE:${TOUCA_CLIENT_ROOT_DIR}/include>
        $<BUILD_INTERFACE:${CMAKE_BINARY_DIR}/generated>
        $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>
)

target_compile_definitions(
        ${TOUCA_TARGET_MAIN}
    PRIVATE
        RAPIDJSON_HAS_STDSTRING
        $<$<CXX_COMPILER_ID:MSVC>:NOMINMAX>
        $<$<CXX_COMPILER_ID:MSVC>:_CRT_SECURE_NO_WARNINGS>
)

if (TOUCA_BUILD_RUNNER)
target_compile_definitions(
        ${TOUCA_TARGET_MAIN}
    PRIVATE
        TOUCA_INCLUDE_RUNNER
    INTERFACE
        TOUCA_INCLUDE_RUNNER
)
endif()

target_compile_features(
        ${TOUCA_TARGET_MAIN}
    PRIVATE
        cxx_variadic_templates
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
        ${TOUCA_TARGET_MAIN}
    PROPERTIES
        SOVERSION ${CPACK_PACKAGE_VERSION_MAJOR}
        VERSION ${TOUCA_VERSION}
        POSITION_INDEPENDENT_CODE ON
        DEBUG_POSTFIX ${CMAKE_DEBUG_POSTFIX}
)

find_package(OpenSSL QUIET)
if (OpenSSL_FOUND)
    target_link_libraries(${TOUCA_TARGET_MAIN} PRIVATE OpenSSL::SSL OpenSSL::Crypto)
    target_compile_definitions(${TOUCA_TARGET_MAIN} PRIVATE CPPHTTPLIB_OPENSSL_SUPPORT)
else()
    message(WARNING
        " Failed to find OpenSSL."
        " Touca will be built without HTTPS support.\n"
        " See https://touca.io/docs/sdk/installing/#enabling-https")
endif()

generate_export_header(
    ${TOUCA_TARGET_MAIN}
    EXPORT_MACRO_NAME "TOUCA_CLIENT_API"
    EXPORT_FILE_NAME "${CMAKE_BINARY_DIR}/generated/touca/lib_api.hpp"
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:${TOUCA_TARGET_MAIN},SOURCES>
)
