// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/devkit/utils.hpp"

#include "catch2/catch.hpp"
#include "touca/core/filesystem.hpp"

TEST_CASE("string formatting") {
  SECTION("format") {
    CHECK(touca::detail::format("hello {}", "world") == "hello world");
  }

  SECTION("load missing file") {
    CHECK_THROWS_AS(touca::detail::load_string_file("invalid"),
                    std::invalid_argument);
    CHECK_THROWS_WITH(touca::detail::load_string_file("invalid"),
                      "failed to read file");
  }
}
