#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

weasel_find_package("Catch2")

add_executable(weasel_client_tests "")

target_sources(
        weasel_client_tests
    PRIVATE
        client.cpp
        main.cpp
        devkit/platform.cpp
        devkit/resultfile.cpp
        devkit/testcase.cpp
        devkit/types.cpp
        devkit/utils.cpp
        devkit/tmpfile.hpp
)

target_link_libraries(
        weasel_client_tests
    PRIVATE
        weasel_client
        Catch2::Catch2
)

set_target_properties(
        weasel_client_tests
    PROPERTIES
        DEBUG_POSTFIX "${CMAKE_DEBUG_POSTFIX}"
        RELEASE_POSTFIX "${CMAKE_RELEASE_POSTFIX}"
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:weasel_client_tests,SOURCES>
)

enable_testing()

add_test(
    NAME weasel_client_tests
    COMMAND $<TARGET_FILE:weasel_client_tests>
)
