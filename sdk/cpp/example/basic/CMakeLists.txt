#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

include(GNUInstallDirs)

add_executable(touca_example_basic "")

target_sources(
        touca_example_basic
    PRIVATE
        code_under_test.cpp
        code_under_test.hpp
        regression_test.cpp
        regression_test.hpp
)

target_link_libraries(
        touca_example_basic
    PRIVATE
        touca_client
)

target_include_directories(
        touca_example_basic
    PRIVATE
        ${TOUCA_CLIENT_ROOT_DIR}
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:touca_example_basic,SOURCES>
)

install(
    TARGETS touca_example_basic
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
