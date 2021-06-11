# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

include(GNUInstallDirs)

add_executable(touca_example_starter regression_test.cpp)
target_link_libraries(touca_example_starter PRIVATE touca_framework)
target_include_directories(touca_example_starter PRIVATE ${TOUCA_CLIENT_ROOT_DIR})
install(TARGETS touca_example_starter RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR})
