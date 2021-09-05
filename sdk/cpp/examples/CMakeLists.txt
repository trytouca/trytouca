# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

add_subdirectory(01_cpp_minimal)
if (TOUCA_BUILD_FRAMEWORK)
    add_subdirectory(02_cpp_main_api)
    add_subdirectory(03_cpp_core_api)
    add_subdirectory(04_cpp_external_input)
endif()
