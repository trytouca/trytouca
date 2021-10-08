# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

touca_find_package("Catch2")

add_executable(${TOUCA_TARGET_TEST} "")

target_sources(
        ${TOUCA_TARGET_TEST}
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

if (TOUCA_BUILD_FRAMEWORK)
    target_sources(
            ${TOUCA_TARGET_TEST}
        PRIVATE
            framework/framework.cpp
            framework/utils.hpp
    )
endif()

target_include_directories(
        ${TOUCA_TARGET_TEST}
    PRIVATE
        ${TOUCA_CLIENT_ROOT_DIR}
)

target_link_libraries(
        ${TOUCA_TARGET_TEST}
    PRIVATE
        ${TOUCA_TARGET_MAIN}
        Catch2::Catch2
)

target_compile_definitions(
        ${TOUCA_TARGET_TEST}
    PRIVATE
        $<$<CXX_COMPILER_ID:MSVC>:NOMINMAX>
)

set_target_properties(
        ${TOUCA_TARGET_TEST}
    PROPERTIES
        DEBUG_POSTFIX "${CMAKE_DEBUG_POSTFIX}"
        RELEASE_POSTFIX "${CMAKE_RELEASE_POSTFIX}"
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:${TOUCA_TARGET_TEST},SOURCES>
)

enable_testing()

add_test(
    NAME ${TOUCA_TARGET_TEST}
    COMMAND $<TARGET_FILE:${TOUCA_TARGET_TEST}>
)
