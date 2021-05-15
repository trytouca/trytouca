#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

include(GNUInstallDirs)

touca_find_package("cxxopts")
touca_find_package("fmt")
touca_find_package("touca")
touca_find_package("AWSSDK")

add_executable(
    touca_cmp
    main.cpp
    object_store.cpp
    options.cpp
    options.hpp
    platform.cpp
    platform.hpp
    queue.hpp
    startup.cpp
    startup.hpp
    stats.cpp
    stats.hpp
    worker.cpp
    worker.hpp
)

target_link_libraries(
        touca_cmp
    PRIVATE
        cxxopts::cxxopts
        fmt::fmt
        touca::client
        AWS::aws-sdk-cpp-s3
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
