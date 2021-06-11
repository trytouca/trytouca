# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

touca_find_package("Catch2")

add_executable(touca_client_tests "")

target_sources(
        touca_client_tests
    PRIVATE
        client.cpp
        main.cpp
        devkit/options.cpp
        devkit/platform.cpp
        devkit/resultfile.cpp
        devkit/testcase.cpp
        devkit/types.cpp
        devkit/utils.cpp
        devkit/tmpfile.hpp
)

target_link_libraries(
        touca_client_tests
    PRIVATE
        touca_client
        Catch2::Catch2
)

target_compile_definitions(
        touca_client_tests
    PRIVATE
        $<$<CXX_COMPILER_ID:MSVC>:NOMINMAX>
)

set_target_properties(
        touca_client_tests
    PROPERTIES
        DEBUG_POSTFIX "${CMAKE_DEBUG_POSTFIX}"
        RELEASE_POSTFIX "${CMAKE_RELEASE_POSTFIX}"
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:touca_client_tests,SOURCES>
)

enable_testing()

add_test(
    NAME touca_client_tests
    COMMAND $<TARGET_FILE:touca_client_tests>
)
