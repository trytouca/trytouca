#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

include(GenerateExportHeader)
include(GNUInstallDirs)

add_library(weasel_framework "")

target_sources(weasel_framework
    PRIVATE
        framework.cpp
        suites.cpp
        utils.cpp
)

target_link_libraries(
    weasel_framework
PUBLIC
    weasel_client
)

target_include_directories(
        weasel_framework
    PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}
)

target_compile_options(
        weasel_framework
    PRIVATE
        $<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wno-unused-parameter>
        $<TARGET_PROPERTY:weasel_client,INTERFACE_COMPILE_OPTIONS>
)

generate_export_header(
    weasel_framework
    EXPORT_MACRO_NAME "WEASEL_FRAMEWORK_API"
    EXPORT_FILE_NAME "${CMAKE_BINARY_DIR}/generated/weasel/framework/lib_api.hpp"
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:weasel_framework,SOURCES>
)

install(TARGETS weasel_framework
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
            COMPONENT Weasel_Runtime
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
            COMPONENT Weasel_Runtime
            NAMELINK_COMPONENT Weasel_Development
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
            COMPONENT Weasel_Development
)
