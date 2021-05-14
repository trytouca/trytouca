#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

include(GNUInstallDirs)

touca_find_package("cxxopts")

add_executable(touca_cli "")

target_sources(
        touca_cli
    PRIVATE
        main.cpp
        misc/file.cpp
        misc/file.hpp
        operations.cpp
        operations.hpp
        ops/compare.cpp
        ops/merge.cpp
        ops/post.cpp
        ops/update.cpp
        ops/view.cpp
)

set_target_properties(
        touca_cli
    PROPERTIES
        OUTPUT_NAME touca_cli
)

target_link_libraries(
        touca_cli
    PRIVATE
        touca_client
        cxxopts::cxxopts
)

target_include_directories(
        touca_cli
    PRIVATE
        ${TOUCA_CLIENT_ROOT_DIR}
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
