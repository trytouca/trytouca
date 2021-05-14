#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

include(GenerateExportHeader)
include(GNUInstallDirs)

weasel_find_package("flatbuffers" "Flatbuffers")
weasel_find_package("fmt")
weasel_find_package("ghcFilesystem")
weasel_find_package("httplib")
weasel_find_package("RapidJSON")
weasel_find_package("spdlog")

add_library(weasel_client "")

target_sources(
        weasel_client
    PRIVATE
        client.cpp
        weasel.cpp
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
        weasel_client
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
        weasel_client
    PUBLIC
        ${WEASEL_CLIENT_ROOT_DIR}/include
        ${CMAKE_BINARY_DIR}/generated
)

target_compile_definitions(
        weasel_client
    PRIVATE
        RAPIDJSON_HAS_STDSTRING
        $<$<CXX_COMPILER_ID:MSVC>:NOMINMAX>
        $<$<CXX_COMPILER_ID:MSVC>:_CRT_SECURE_NO_WARNINGS>
)

target_compile_features(
        weasel_client
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
        weasel_client
    PROPERTIES
        SOVERSION 1
        VERSION 1.4.0
        POSITION_INDEPENDENT_CODE ON
        DEBUG_POSTFIX ${CMAKE_DEBUG_POSTFIX}
)

find_package(OpenSSL QUIET)
if (OpenSSL_FOUND)
    target_link_libraries(weasel_client PRIVATE OpenSSL::SSL OpenSSL::Crypto)
    target_compile_definitions(weasel_client PRIVATE CPPHTTPLIB_OPENSSL_SUPPORT)
else()
    message(WARNING "Failed to find OpenSSL. Weasel will be built without HTTPS support.")
endif()

generate_export_header(
    weasel_client
    EXPORT_MACRO_NAME "WEASEL_CLIENT_API"
    EXPORT_FILE_NAME "${CMAKE_BINARY_DIR}/generated/weasel/lib_api.hpp"
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:weasel_client,SOURCES>
)

install(TARGETS weasel_client
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
            COMPONENT Weasel_Runtime
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
            COMPONENT Weasel_Runtime
            NAMELINK_COMPONENT Weasel_Development
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
            COMPONENT Weasel_Development
)
install(DIRECTORY "${WEASEL_CLIENT_ROOT_DIR}/include/weasel"
        DESTINATION include MESSAGE_NEVER FILES_MATCHING PATTERN "*.h*")
install(DIRECTORY "${CMAKE_BINARY_DIR}/generated/weasel"
        DESTINATION include MESSAGE_NEVER FILES_MATCHING PATTERN "*.h*")
