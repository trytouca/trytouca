# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

include(GNUInstallDirs)

touca_find_package("cxxopts")

add_executable(touca_example_advanced "")

target_sources(
        touca_example_advanced
    PRIVATE
        code_under_test.cpp
        code_under_test.hpp
        regression_test.cpp
        regression_test.hpp
)

target_link_libraries(
        touca_example_advanced
    PRIVATE
        touca_framework
        cxxopts::cxxopts
)

target_include_directories(
        touca_example_advanced
    PRIVATE
        ${TOUCA_CLIENT_ROOT_DIR}
)

target_compile_definitions(
        touca_example_advanced
    PRIVATE
        RAPIDJSON_HAS_STDSTRING
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:touca_example_advanced,SOURCES>
)

install(
    TARGETS touca_example_advanced
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
