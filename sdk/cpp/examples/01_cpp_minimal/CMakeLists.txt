# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

include(GNUInstallDirs)

add_executable(example_cpp_minimal "")

target_sources(
        example_cpp_minimal
    PRIVATE
        is_prime.hpp
        is_prime_test.cpp
)

target_link_libraries(
        example_cpp_minimal
    PRIVATE
        touca_framework
)

target_include_directories(
        example_cpp_minimal
    PRIVATE
        ${TOUCA_CLIENT_ROOT_DIR}
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:example_cpp_minimal,SOURCES>
)

install(
    TARGETS example_cpp_minimal
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
