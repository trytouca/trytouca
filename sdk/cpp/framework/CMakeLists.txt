# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

include(GenerateExportHeader)
include(GNUInstallDirs)

touca_find_package("cxxopts")

add_library(touca_framework "")

target_sources(touca_framework
    PRIVATE
        framework.cpp
        suites.cpp
        utils.cpp
)

target_link_libraries(
        touca_framework
    PUBLIC
        touca_client
    PRIVATE
        cxxopts::cxxopts
)

target_include_directories(
        touca_framework
    PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}
)

target_compile_definitions(
        touca_framework
    PRIVATE
        $<$<CXX_COMPILER_ID:MSVC>:_CRT_SECURE_NO_WARNINGS>
)

target_compile_options(
        touca_framework
    PRIVATE
        $<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wno-unused-parameter>
        $<TARGET_PROPERTY:touca_client,INTERFACE_COMPILE_OPTIONS>
)

generate_export_header(
    touca_framework
    EXPORT_MACRO_NAME "TOUCA_FRAMEWORK_API"
    EXPORT_FILE_NAME "${CMAKE_BINARY_DIR}/generated/touca/framework/lib_api.hpp"
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:touca_framework,SOURCES>
)

install(TARGETS touca_framework
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
            COMPONENT Touca_Runtime
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
            COMPONENT Touca_Runtime
            NAMELINK_COMPONENT Touca_Development
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
            COMPONENT Touca_Development
)
