#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

include(GNUInstallDirs)

# weasel_find_package("cxxopts")

add_executable(weasel_cli "")

target_sources(
        weasel_cli
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
        weasel_cli
    PROPERTIES
        OUTPUT_NAME weasel_cli
)

target_link_libraries(
        weasel_cli
    PRIVATE
        weasel_client
        cxxopts::cxxopts
)

target_include_directories(
        weasel_cli
    PRIVATE
        ${WEASEL_CLIENT_ROOT_DIR}
)

target_compile_definitions(
        weasel_cli
    PRIVATE
        $<$<CXX_COMPILER_ID:MSVC>:_WIN32_WINNT=0x0601>
        $<$<CXX_COMPILER_ID:MSVC>:_CRT_SECURE_NO_WARNINGS>
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:weasel_cli,SOURCES>
)

install(
    TARGETS weasel_cli
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
