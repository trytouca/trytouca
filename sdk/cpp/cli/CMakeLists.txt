# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

include(GNUInstallDirs)
include(GenerateExportHeader)

touca_find_package("cxxopts")

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
