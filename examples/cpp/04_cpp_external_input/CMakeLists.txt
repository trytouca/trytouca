# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

include(GNUInstallDirs)

touca_find_cxxopts()

add_executable(example_cpp_external_input "")

target_sources(
        example_cpp_external_input
    PRIVATE
        students.cpp
        students.hpp
        students_test.cpp
        students_test.hpp
)

target_link_libraries(
        example_cpp_external_input
    PRIVATE
        cxxopts::cxxopts
        touca_framework
)

source_group(
    TREE ${CMAKE_CURRENT_LIST_DIR}
    FILES $<TARGET_PROPERTY:example_cpp_external_input,SOURCES>
)

install(
    TARGETS example_cpp_external_input
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
