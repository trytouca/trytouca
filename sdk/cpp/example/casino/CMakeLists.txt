#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

add_executable(weasel_example_casino "")

target_sources(
        weasel_example_casino
    PRIVATE
        code_under_test.cpp
        code_under_test.hpp
        regression_test.cpp
        regression_test.hpp
)

target_link_libraries(
        weasel_example_casino
    PRIVATE
        weasel_framework
)

target_include_directories(
        weasel_example_casino
    PRIVATE
        ${WEASEL_CLIENT_ROOT_DIR}
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:weasel_example_casino,SOURCES>
)
