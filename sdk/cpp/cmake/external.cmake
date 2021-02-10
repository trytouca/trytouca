include(FetchContent)

# weasel_find_package("fmt")
# weasel_find_package("flatbuffers")
# weasel_find_package("flatc")
# weasel_find_package("ghcFilesystem")
# weasel_find_package("httplib")
# weasel_find_package("RapidJSON")
# weasel_find_package("spdlog")

FetchContent_Declare(
    Catch2
    GIT_REPOSITORY  https://github.com/catchorg/catch2.git
    GIT_TAG         v2.13.4
)
FetchContent_Declare(
    fmt
    GIT_REPOSITORY  https://github.com/fmtlib/fmt.git
    GIT_TAG         7.1.3
)
FetchContent_Declare(
    spdlog
    GIT_REPOSITORY  https://github.com/gabime/spdlog.git
    GIT_TAG         v1.8.2
)
FetchContent_Declare(
    httplib
    GIT_REPOSITORY  https://github.com/yhirose/cpp-httplib.git
    GIT_TAG         v0.8.3
)
FetchContent_Declare(
    rapidjson
    GIT_REPOSITORY  https://github.com/Tencent/rapidjson.git
    GIT_TAG         v1.1.0
)
FetchContent_Declare(
    flatbuffers
    GIT_REPOSITORY  https://github.com/google/flatbuffers.git
    GIT_TAG         v1.12.0
)
FetchContent_Declare(
    ghcFilesystem
    GIT_REPOSITORY  https://github.com/gulrak/filesystem.git
    GIT_TAG         v1.5.0
)
FetchContent_Declare(
    cxxopts
    GIT_REPOSITORY  https://github.com/jarro2783/cxxopts
    GIT_TAG         v2.2.1
)

FetchContent_MakeAvailable(Catch2)
FetchContent_MakeAvailable(fmt)
FetchContent_MakeAvailable(httplib)
FetchContent_MakeAvailable(spdlog)

FetchContent_GetProperties(RapidJSON)
if(NOT rapidjson_POPULATED)
    FetchContent_Populate(RapidJSON)
    add_library(RapidJSON INTERFACE)
    add_library(RapidJSON::RapidJSON ALIAS RapidJSON)
    target_include_directories(RapidJSON INTERFACE ${rapidjson_SOURCE_DIR}/include)
endif()

FetchContent_GetProperties(cxxopts)
if(NOT cxxopts_POPULATED)
    FetchContent_Populate(cxxopts)
    add_library(cxxopts INTERFACE)
    add_library(cxxopts::cxxopts ALIAS cxxopts)
    target_include_directories(cxxopts INTERFACE ${cxxopts_SOURCE_DIR}/include)
endif()

FetchContent_GetProperties(ghcFilesystem)
if(NOT ghcfilesystem_POPULATED)
    FetchContent_Populate(ghcFilesystem)
    add_library(ghcFilesystem INTERFACE)
    add_library(ghcFilesystem::ghcFilesystem ALIAS ghcFilesystem)
    target_include_directories(ghcFilesystem INTERFACE ${ghcfilesystem_SOURCE_DIR}/include)
endif()

# FetchContent_GetProperties(flatbuffers)
# if(NOT flatbuffers_POPULATED)
#     FetchContent_Populate(flatbuffers)
#     set(CMAKE_POLICY_DEFAULT_CMP0063 NEW)
#     set(FLATBUFFERS_BUILD_TESTS OFF CACHE INTERNAL "")
#     set(FLATBUFFERS_INSTALL OFF CACHE INTERNAL "")
#     set(FLATBUFFERS_BUILD_FLATHASH OFF CACHE INTERNAL "")
#     add_subdirectory(${flatbuffers_SOURCE_DIR} ${flatbuffers_BINARY_DIR})
# endif()

FetchContent_Populate(flatbuffers)

add_library(flatbuffers_flatlib STATIC)
add_library(flatbuffers::flatbuffers ALIAS flatbuffers_flatlib)
target_include_directories(flatbuffers_flatlib
    PUBLIC ${flatbuffers_SOURCE_DIR}/include
    PRIVATE ${flatbuffers_SOURCE_DIR}
)
target_compile_definitions(flatbuffers_flatlib PRIVATE
    -DFLATBUFFERS_LOCALE_INDEPENDENT=1
    -D_CRT_SECURE_NO_WARNINGS=1
)
target_compile_features(flatbuffers_flatlib PUBLIC
    cxx_std_17
)
target_sources(flatbuffers_flatlib PRIVATE
    ${flatbuffers_SOURCE_DIR}/src/code_generators.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_parser.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_text.cpp
    ${flatbuffers_SOURCE_DIR}/src/reflection.cpp
    ${flatbuffers_SOURCE_DIR}/src/util.cpp
)

add_executable(flatbuffers_flatc EXCLUDE_FROM_ALL)
add_executable(flatbuffers::flatc ALIAS flatbuffers_flatc)
target_include_directories(flatbuffers_flatc PRIVATE
    ${flatbuffers_SOURCE_DIR}
    ${flatbuffers_SOURCE_DIR}/grpc
)
target_sources(flatbuffers_flatc PRIVATE
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_cpp.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_csharp.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_dart.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_go.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_java.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_js_ts.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_php.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_python.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_lobster.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_lua.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_rust.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_fbs.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_grpc.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_json_schema.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_kotlin.cpp
    ${flatbuffers_SOURCE_DIR}/src/idl_gen_swift.cpp
    ${flatbuffers_SOURCE_DIR}/src/flatc.cpp
    ${flatbuffers_SOURCE_DIR}/src/flatc_main.cpp
    ${flatbuffers_SOURCE_DIR}/grpc/src/compiler/schema_interface.h
    ${flatbuffers_SOURCE_DIR}/grpc/src/compiler/cpp_generator.cc
    ${flatbuffers_SOURCE_DIR}/grpc/src/compiler/go_generator.cc
    ${flatbuffers_SOURCE_DIR}/grpc/src/compiler/java_generator.cc
    ${flatbuffers_SOURCE_DIR}/grpc/src/compiler/python_generator.cc
    ${flatbuffers_SOURCE_DIR}/grpc/src/compiler/swift_generator.cc
)
target_link_libraries(flatbuffers_flatc PRIVATE flatbuffers::flatbuffers)

function(WeaselFlatbuffersGenerateCpp SCHEMA_FILES GENERATED_DIR GENERATED_CXX)
    foreach(SCHEMA_FILE ${SCHEMA_FILES})
        get_filename_component(NAME ${SCHEMA_FILE} NAME_WE)
        set(GENERATED_HEADER_FILE_PATH ${GENERATED_DIR}/${NAME}_generated.h)
        add_custom_command(
            DEPENDS flatbuffers::flatc
            OUTPUT ${GENERATED_HEADER_FILE_PATH}
            COMMAND flatbuffers::flatc --scoped-enums -o ${GENERATED_DIR} -c ${SCHEMA_FILE}
            COMMENT "generating flatbuffers c++ header file: ${GENERATED_HEADER_FILE_PATH}"
        )
        list(APPEND GENERATED_FILES ${GENERATED_HEADER_FILE_PATH})
    endforeach()
    set(${GENERATED_CXX} ${GENERATED_FILES} PARENT_SCOPE)
endfunction()
