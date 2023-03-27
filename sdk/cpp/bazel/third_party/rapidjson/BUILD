# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

load("@rules_cc//cc:defs.bzl", "cc_library")

package(default_visibility = ["//visibility:public"])

licenses(["notice"])

cc_library(
    name = "rapidjson",
    hdrs = glob(["include/rapidjson/**/*.h"]),
    defines = ["RAPIDJSON_HAS_STDSTRING=1"],
    includes = ["include"],
    visibility = ["//visibility:public"],
)
