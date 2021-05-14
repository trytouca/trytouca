#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

add_executable(touca_example_casino "")

touca_find_package("cxxopts")

target_sources(
        touca_example_casino
    PRIVATE
        code_under_test.cpp
        code_under_test.hpp
        regression_test.cpp
)

target_link_libraries(
        touca_example_casino
    PRIVATE
        touca_framework
        cxxopts::cxxopts
)

target_include_directories(
        touca_example_casino
    PRIVATE
        ${TOUCA_CLIENT_ROOT_DIR}
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:touca_example_casino,SOURCES>
)
