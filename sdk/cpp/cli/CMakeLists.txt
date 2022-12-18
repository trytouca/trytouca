# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

include(GNUInstallDirs)

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
    PUBLIC
        ${TOUCA_TARGET_MAIN}
)

target_include_directories(
        touca_cli_lib
    PUBLIC
        ${CMAKE_CURRENT_LIST_DIR}
)

add_executable(touca_cli "")

target_sources(
        touca_cli
    PRIVATE
        compare.cpp
        filesystem.cpp
        main.cpp
        merge.cpp
        operations.cpp
        post.cpp
        update.cpp
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
        cxxopts::cxxopts
)


target_compile_definitions(
        touca_cli
    PRIVATE
        $<$<CXX_COMPILER_ID:MSVC>:_WIN32_WINNT=0x0601>
        $<$<CXX_COMPILER_ID:MSVC>:_CRT_SECURE_NO_WARNINGS>
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:touca_cli,SOURCES>
)

install(
    TARGETS touca_cli
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
