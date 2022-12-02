# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

include(GNUInstallDirs)

add_executable(example_minimal "")

target_sources(
        example_minimal
    PRIVATE
        is_prime.hpp
        is_prime_test.cpp
)

target_link_libraries(
        example_minimal
    PRIVATE
        ${TOUCA_TARGET_MAIN}
)

target_include_directories(
        example_minimal
    PRIVATE
        ${TOUCA_CLIENT_ROOT_DIR}
)

source_group(
    TREE ${CMAKE_CURRENT_LIST_DIR}
    FILES $<TARGET_PROPERTY:example_minimal,SOURCES>
)

install(
    TARGETS example_minimal
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
