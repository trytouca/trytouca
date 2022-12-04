# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

include(GNUInstallDirs)

add_executable(sample_app "")

target_sources(
        sample_app
    PRIVATE
        students.cpp
        students.hpp
        students_test.cpp
        students_types.hpp
)

target_link_libraries(
        sample_app
    PRIVATE
        ${TOUCA_TARGET_MAIN}
)

target_include_directories(
        sample_app
    PRIVATE
        ${TOUCA_CLIENT_ROOT_DIR}
)

source_group(
    TREE ${CMAKE_CURRENT_LIST_DIR}
    FILES $<TARGET_PROPERTY:sample_app,SOURCES>
)

install(
    TARGETS sample_app
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
