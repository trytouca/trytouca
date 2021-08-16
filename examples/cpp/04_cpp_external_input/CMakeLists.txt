# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

include(GNUInstallDirs)

touca_find_package("cxxopts")

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
        touca_framework
        cxxopts::cxxopts
)

target_include_directories(
        example_cpp_external_input
    PRIVATE
        ${TOUCA_CLIENT_ROOT_DIR}
)

target_compile_definitions(
        example_cpp_external_input
    PRIVATE
        RAPIDJSON_HAS_STDSTRING
)

source_group(
    TREE ${CMAKE_CURRENT_LIST_DIR}
    FILES $<TARGET_PROPERTY:example_cpp_external_input,SOURCES>
)

install(
    TARGETS example_cpp_external_input
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
