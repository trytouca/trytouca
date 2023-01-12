# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

include(GNUInstallDirs)
include(GenerateExportHeader)

touca_find_package("cxxopts")

add_library(touca_cli_lib "")

target_sources(
        touca_cli_lib
    PRIVATE
        comparison.cpp
        deserialize.cpp
        resultfile.cpp
)

target_link_libraries(
        touca_cli_lib
    PRIVATE
        ${TOUCA_TARGET_MAIN}
)

target_include_directories(
        touca_cli_lib
    PUBLIC
        ${CMAKE_CURRENT_LIST_DIR}
)

target_compile_definitions(
        touca_cli_lib
    PRIVATE
        RAPIDJSON_HAS_STDSTRING
        $<$<CXX_COMPILER_ID:MSVC>:NOMINMAX>
        $<$<CXX_COMPILER_ID:MSVC>:_CRT_SECURE_NO_WARNINGS>
)

generate_export_header(
    touca_cli_lib
    EXPORT_MACRO_NAME "TOUCA_CLI_API"
    EXPORT_FILE_NAME "${CMAKE_BINARY_DIR}/generated/touca/cli_lib_api.hpp"
)

add_executable(touca_cli "")

target_sources(
        touca_cli
    PRIVATE
        compare.cpp
        main.cpp
        operations.cpp
        view.cpp
)

set_target_properties(
        touca_cli
    PROPERTIES
        OUTPUT_NAME touca_cli
)

target_link_libraries(
        touca_cli
    PRIVATE
        touca_cli_lib
        ${TOUCA_TARGET_MAIN}
        cxxopts::cxxopts
)

source_group(
    TREE ${CMAKE_CURRENT_LIST_DIR}
    FILES $<TARGET_PROPERTY:touca_cli,SOURCES>
)

install(
    TARGETS touca_cli
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
