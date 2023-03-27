# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

"""Defines a macro for pulling third party dependencies"""

load("@bazel_tools//tools/build_defs/repo:utils.bzl", "maybe")
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def load_third_party_libraries():
    """Load all third party dependencies"""
    maybe(
        http_archive,
        name = "catch2",
        url = "https://github.com/catchorg/Catch2/archive/v2.6.1.zip",
        sha256 = "cc21033c8085c83a867153982e90514c6b6072bed8cec0e688663cfcdaa8bb32",
        strip_prefix = "Catch2-2.6.1",
        build_file = "//bazel/third_party/catch2:BUILD",
    )

    maybe(
        http_archive,
        name = "rapidjson",
        url = "https://github.com/Tencent/rapidjson/archive/v1.1.0.tar.gz",
        sha256 = "bf7ced29704a1e696fbccf2a2b4ea068e7774fa37f6d7dd4039d0787f8bed98e",
        strip_prefix = "rapidjson-1.1.0",
        build_file = "//bazel/third_party/rapidjson:BUILD",
    )

    maybe(
        http_archive,
        name = "gh_filesystem",
        url = "https://github.com/gulrak/filesystem/archive/v1.5.12.tar.gz",
        sha256 = "7d62c5746c724d28da216d9e11827ba4e573df15ef40720292827a4dfd33f2e9",
        strip_prefix = "filesystem-1.5.12",
        build_file = "//bazel/third_party/filesystem:BUILD",
    )

    maybe(
        http_archive,
        name = "mpark_variant",
        url = "https://github.com/mpark/variant/archive/v1.4.0.tar.gz",
        sha256 = "8f6b28ab3640b5d76d5b6664dda7257a4405ce59179220431b8fd196c79b2ecb",
        strip_prefix = "variant-1.4.0",
        build_file = "//bazel/third_party/variant:BUILD",
    )

    maybe(
        http_archive,
        name = "flatbuffers",
        url = "https://github.com/google/flatbuffers/archive/v2.0.0.tar.gz",
        sha256 = "9ddb9031798f4f8754d00fca2f1a68ecf9d0f83dfac7239af1311e4fd9a565c4",
        strip_prefix = "flatbuffers-2.0.0",
        build_file = "//bazel/third_party/flatbuffers:BUILD",
    )

    maybe(
        http_archive,
        name = "httplib",
        url = "https://github.com/yhirose/cpp-httplib/archive/v0.11.3.tar.gz",
        sha256 = "799b2daa0441d207f6cd1179ae3a34869722084a434da6614978be1682c1e12d",
        strip_prefix = "cpp-httplib-0.11.3",
        build_file = "//bazel/third_party/httplib:BUILD",
    )

    maybe(
        http_archive,
        name = "fmt",
        url = "https://github.com/fmtlib/fmt/archive/9.1.0.tar.gz",
        sha256 = "5dea48d1fcddc3ec571ce2058e13910a0d4a6bab4cc09a809d8b1dd1c88ae6f2",
        strip_prefix = "fmt-9.1.0",
        build_file = "//bazel/third_party/fmt:BUILD",
    )

    maybe(
        http_archive,
        name = "cxxopts",
        url = "https://github.com/jarro2783/cxxopts/archive/v3.0.0.tar.gz",
        sha256 = "36f41fa2a46b3c1466613b63f3fa73dc24d912bc90d667147f1e43215a8c6d00",
        strip_prefix = "cxxopts-3.0.0",
        build_file = "//bazel/third_party/cxxopts:BUILD",
    )
