#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

include(GNUInstallDirs)

touca_find_cxxopts()

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
        cxxopts::cxxopts
        touca_framework
)

source_group(
    TREE ${CMAKE_CURRENT_LIST_DIR}
    FILES $<TARGET_PROPERTY:touca_example_advanced,SOURCES>
)

install(
    TARGETS touca_example_advanced
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
