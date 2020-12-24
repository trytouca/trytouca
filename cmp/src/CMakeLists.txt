#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

include(GNUInstallDirs)

weasel_find_package("cxxopts")
weasel_find_package("fmt")
weasel_find_package("spdlog")
weasel_find_package("weasel")

add_executable(
    weasel_cmp
    logger.cpp
    main.cpp
    options.cpp
    service.hpp
    service.cpp
)

target_link_libraries(
        weasel_cmp
    PRIVATE
        cxxopts::cxxopts
        fmt::fmt
        spdlog::spdlog
        weasel::client
)

target_include_directories(
        weasel_cmp
    PRIVATE
        ${WEASEL_COMPARATOR_ROOT_DIR}/include
)

target_compile_definitions(
        weasel_cmp
    PRIVATE
        $<$<CXX_COMPILER_ID:MSVC>:NOMINMAX=>
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:weasel_cmp,SOURCES>
)

install(
    TARGETS weasel_cmp
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
