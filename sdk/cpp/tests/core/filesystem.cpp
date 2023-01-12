// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/core/filesystem.hpp"

#include "catch2/catch.hpp"

TEST_CASE("string formatting") {
  SECTION("format") {
    CHECK(touca::detail::format("hello {}", "world") == "hello world");
  }

  SECTION("load missing file") {
    CHECK_THROWS_AS(touca::detail::load_text_file("invalid"),
                    touca::detail::runtime_error);
    CHECK_THROWS_WITH(touca::detail::load_text_file("invalid"),
                      "failed to read file");
  }
}
