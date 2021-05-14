#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

include(GenerateExportHeader)
include(GNUInstallDirs)

touca_find_package("flatbuffers" "Flatbuffers")
touca_find_package("fmt")
touca_find_package("ghcFilesystem")
touca_find_package("httplib")
touca_find_package("RapidJSON")
touca_find_package("spdlog")

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

target_link_libraries(
        touca_client
    PRIVATE
        httplib::httplib
        spdlog::spdlog
    PUBLIC
        ghcFilesystem::ghcFilesystem
        flatbuffers::flatbuffers
        fmt::fmt
        RapidJSON::RapidJSON
        $<$<PLATFORM_ID:Linux>:pthread>
)

target_include_directories(
        touca_client
    PUBLIC
        ${TOUCA_CLIENT_ROOT_DIR}/include
        ${CMAKE_BINARY_DIR}/generated
)

target_compile_definitions(
        touca_client
    PRIVATE
        RAPIDJSON_HAS_STDSTRING
        $<$<CXX_COMPILER_ID:MSVC>:NOMINMAX>
        $<$<CXX_COMPILER_ID:MSVC>:_CRT_SECURE_NO_WARNINGS>
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
        SOVERSION 1
        VERSION 1.4.0
        POSITION_INDEPENDENT_CODE ON
        DEBUG_POSTFIX ${CMAKE_DEBUG_POSTFIX}
)

find_package(OpenSSL QUIET)
if (OpenSSL_FOUND)
    target_link_libraries(touca_client PRIVATE OpenSSL::SSL OpenSSL::Crypto)
    target_compile_definitions(touca_client PRIVATE CPPHTTPLIB_OPENSSL_SUPPORT)
else()
    message(WARNING "Failed to find OpenSSL. Touca will be built without HTTPS support.")
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

install(TARGETS touca_client
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
            COMPONENT Touca_Runtime
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
            COMPONENT Touca_Runtime
            NAMELINK_COMPONENT Touca_Development
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
            COMPONENT Touca_Development
)
install(DIRECTORY "${TOUCA_CLIENT_ROOT_DIR}/include/touca"
        DESTINATION include MESSAGE_NEVER FILES_MATCHING PATTERN "*.h*")
install(DIRECTORY "${CMAKE_BINARY_DIR}/generated/touca"
        DESTINATION include MESSAGE_NEVER FILES_MATCHING PATTERN "*.h*")
