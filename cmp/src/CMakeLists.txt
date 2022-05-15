# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

include(GNUInstallDirs)

touca_find_package("AWSSDK")
touca_find_package("cxxopts")
touca_find_package("fmt")
touca_find_package("spdlog")
touca_find_package("touca")

add_executable(
    touca_cmp
    main.cpp
    logger.cpp
    object_store.cpp
    options.cpp
    platform.cpp
    startup.cpp
    stats.cpp
    worker.cpp
)

target_link_libraries(
        touca_cmp
    PRIVATE
        AWS::aws-sdk-cpp-s3
        cxxopts::cxxopts
        fmt::fmt
        spdlog::spdlog
        touca::client
)

target_include_directories(
        touca_cmp
    PRIVATE
        ${TOUCA_COMPARATOR_ROOT_DIR}/include
)

target_compile_definitions(
        touca_cmp
    PRIVATE
        $<$<CXX_COMPILER_ID:MSVC>:NOMINMAX=>
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:touca_cmp,SOURCES>
)

install(
    TARGETS touca_cmp
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
