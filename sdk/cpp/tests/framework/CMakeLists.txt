#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

touca_find_package("Catch2")

add_executable(
    touca_framework_tests
    main.cpp
    framework.cpp
    utils.hpp
)

target_include_directories(
        touca_framework_tests
    PRIVATE
        ${TOUCA_CLIENT_ROOT_DIR}
)

target_link_libraries(
        touca_framework_tests
    PRIVATE
        touca_framework
        Catch2::Catch2
)

set_target_properties(
        touca_framework_tests
    PROPERTIES
        DEBUG_POSTFIX "${CMAKE_DEBUG_POSTFIX}"
        RELEASE_POSTFIX "${CMAKE_RELEASE_POSTFIX}"
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:touca_framework_tests,SOURCES>
)

enable_testing()

add_test(
    NAME touca_framework_tests
    COMMAND $<TARGET_FILE:touca_framework_tests>
)
