#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

# weasel_find_package("Catch2")

add_executable(
    weasel_framework_tests
    main.cpp
    framework.cpp
    utils.hpp
)

target_include_directories(
        weasel_framework_tests
    PRIVATE
        ${WEASEL_CLIENT_ROOT_DIR}
)

target_link_libraries(
        weasel_framework_tests
    PRIVATE
        weasel_framework
        Catch2::Catch2
)

set_target_properties(
        weasel_framework_tests
    PROPERTIES
        DEBUG_POSTFIX "${CMAKE_DEBUG_POSTFIX}"
        RELEASE_POSTFIX "${CMAKE_RELEASE_POSTFIX}"
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:weasel_framework_tests,SOURCES>
)

enable_testing()

add_test(
    NAME weasel_framework_tests
    COMMAND $<TARGET_FILE:weasel_framework_tests>
)
