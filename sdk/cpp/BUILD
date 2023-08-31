# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

load("@rules_cc//cc:defs.bzl", "cc_binary", "cc_library", "cc_test")
load("//bazel:cpp.bzl", "generate_export_header")

licenses(["notice"])

exports_files(["LICENSE"])

generate_export_header(
    name = "touca_export_header",
    out = "include/touca/lib_api.hpp",
)

cc_library(
    name = "touca",
    srcs = [
        "src/client.cpp",
        "src/comparison.cpp",
        "src/deserialize.cpp",
        "src/filesystem.cpp",
        "src/options.cpp",
        "src/runner.cpp",
        "src/testcase.cpp",
        "src/touca.cpp",
        "src/transport.cpp",
        "src/types.cpp",
    ],
    hdrs = [":include/touca/lib_api.hpp"] + glob([
        "include/**/*.hpp",
    ]),
    defines = [
        "TOUCA_INCLUDE_RUNNER",
    ],
    linkstatic = 1,
    strip_include_prefix = "include",
    visibility = ["//visibility:public"],
    deps = [
        "@cxxopts",
        "@flatbuffers",
        "@fmt",
        "@gh_filesystem",
        "@httplib",
        "@mpark_variant",
        "@rapidjson",
    ],
)

cc_test(
    name = "touca_tests",
    srcs = [
        "tests/core/client.cpp",
        "tests/core/comparison.cpp",
        "tests/core/deserialize.cpp",
        "tests/core/filesystem.cpp",
        "tests/core/options.cpp",
        "tests/core/runner.cpp",
        "tests/core/shared.cpp",
        "tests/core/shared.hpp",
        "tests/core/testcase.cpp",
        "tests/core/transport.cpp",
        "tests/core/types.cpp",
    ],
    visibility = ["//visibility:public"],
    deps = [
        ":touca",
        "@catch2",
    ],
)

cc_binary(
    name = "sample_app",
    srcs = [
        "tests/sample_app/students.cpp",
        "tests/sample_app/students.hpp",
        "tests/sample_app/students_test.cpp",
        "tests/sample_app/students_types.hpp",
    ],
    includes = ["tests/sample_app"],
    visibility = ["//visibility:public"],
    deps = [":touca"],
)
