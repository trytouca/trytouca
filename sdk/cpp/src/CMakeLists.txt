#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

include(GenerateExportHeader)
include(GNUInstallDirs)

weasel_find_package("fmt")
weasel_find_package("Flatbuffers")
weasel_find_package("flatc")
weasel_find_package("ghcFilesystem")
weasel_find_package("httplib")
weasel_find_package("RapidJSON")
weasel_find_package("spdlog")

function(WeaselFlatbuffersGenerateCpp SCHEMA_FILES GENERATED_DIR GENERATED_CXX)
    get_filename_component(_flatc_dir ${flatc_BUILD_MODULES_PATHS} DIRECTORY)
    get_filename_component(_flatc_dir ${_flatc_dir} DIRECTORY)
    set(flatbuffers_FLATC_EXECUTABLE "${_flatc_dir}/flatc")
    foreach(SCHEMA_FILE ${SCHEMA_FILES})
        get_filename_component(NAME ${SCHEMA_FILE} NAME_WE)
        set(GENERATED_HEADER_FILE_PATH ${GENERATED_DIR}/${NAME}_generated.h)
        add_custom_command(
            DEPENDS ${flatbuffers_FLATC_EXECUTABLE}
            OUTPUT ${GENERATED_HEADER_FILE_PATH}
            COMMAND ${flatbuffers_FLATC_EXECUTABLE} --scoped-enums -o ${GENERATED_DIR} -c ${SCHEMA_FILE}
            COMMENT "generating flatbuffers c++ header file: ${GENERATED_HEADER_FILE_PATH}"
        )
        list(APPEND GENERATED_FILES ${GENERATED_HEADER_FILE_PATH})
    endforeach()
    set(${GENERATED_CXX} ${GENERATED_FILES} PARENT_SCOPE)
endfunction()

WeaselFlatbuffersGenerateCpp(
    "${WEASEL_CLIENT_ROOT_DIR}/config/weasel.fbs"
    "${CMAKE_BINARY_DIR}/generated/weasel/impl"
    flatbuffers_GENERATED_CXX
)

set_source_files_properties(
    ${flatbuffers_GENERATED_CXX} PROPERTIES GENERATED TRUE
)

add_library(weasel_client "")

target_sources(
        weasel_client
    PRIVATE
        client.cpp
        weasel.cpp
        devkit/comparison.cpp
        devkit/filesystem.cpp
        devkit/logger.cpp
        devkit/object.cpp
        devkit/platform.cpp
        devkit/resultfile.cpp
        devkit/testcase.cpp
        devkit/types.cpp
        devkit/utils.cpp
        ${flatbuffers_GENERATED_CXX}
)

target_link_libraries(
        weasel_client
    PRIVATE
        httplib::httplib
        spdlog::spdlog
    PUBLIC
        ghcFilesystem::ghcFilesystem
        flatbuffers::flatbuffers
        fmt::fmt
        RapidJSON::RapidJSON
)

target_include_directories(
        weasel_client
    PUBLIC
        ${WEASEL_CLIENT_ROOT_DIR}/include
        ${CMAKE_BINARY_DIR}/generated
)

target_compile_definitions(
        weasel_client
    PRIVATE
        RAPIDJSON_HAS_STDSTRING
        CPPHTTPLIB_OPENSSL_SUPPORT
        $<$<CXX_COMPILER_ID:MSVC>:_WIN32_WINNT=0x0601>
        $<$<CXX_COMPILER_ID:MSVC>:_CRT_SECURE_NO_WARNINGS>
)

target_compile_features(
        weasel_client
    PRIVATE
        $<$<NOT:$<CXX_COMPILER_ID:MSVC>>:cxx_aggregate_default_initializers>
        cxx_defaulted_functions
        cxx_lambdas
        cxx_long_long_type
        cxx_override
        cxx_range_for
        cxx_static_assert
        cxx_strong_enums
    PUBLIC
        cxx_auto_type
)

set_target_properties(
        weasel_client
    PROPERTIES
        POSITION_INDEPENDENT_CODE ON
        SOVERSION 1
        VERSION 1.2.1
)

generate_export_header(
    weasel_client
    EXPORT_MACRO_NAME "WEASEL_CLIENT_API"
    EXPORT_FILE_NAME "${CMAKE_BINARY_DIR}/generated/weasel/lib_api.hpp"
)

source_group(
    TREE
        ${CMAKE_CURRENT_LIST_DIR}
    FILES
        $<TARGET_PROPERTY:weasel_client,SOURCES>
)

install(TARGETS weasel_client
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
            COMPONENT Weasel_Runtime
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
            COMPONENT Weasel_Runtime
            NAMELINK_COMPONENT Weasel_Development
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
            COMPONENT Weasel_Development
)
install(DIRECTORY "${WEASEL_CLIENT_ROOT_DIR}/include/weasel"
        DESTINATION include MESSAGE_NEVER FILES_MATCHING PATTERN "*.h*")
install(DIRECTORY "${CMAKE_BINARY_DIR}/generated/weasel"
        DESTINATION include MESSAGE_NEVER FILES_MATCHING PATTERN "*.h*")
