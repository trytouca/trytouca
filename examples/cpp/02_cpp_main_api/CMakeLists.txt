# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

include(GNUInstallDirs)

add_executable(example_cpp_main_api "")

target_sources(
        example_cpp_main_api
    PRIVATE
        students.cpp
        students.hpp
        students_test.cpp
        students_types.hpp
)

target_link_libraries(
        example_cpp_main_api
    PRIVATE
        touca_framework
)

source_group(
    TREE ${CMAKE_CURRENT_LIST_DIR}
    FILES $<TARGET_PROPERTY:example_cpp_main_api,SOURCES>
)

install(
    TARGETS example_cpp_main_api
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
