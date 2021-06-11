// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/devkit/utils.hpp"
#include "catch2/catch.hpp"

TEST_CASE("string formatting")
{
    SECTION("narrow")
    {
        CHECK(touca::narrow(L"hello") == "hello");
    }

    SECTION("format")
    {
        CHECK(touca::format("hello {}", "world") == "hello world");
    }

    SECTION("load missing file")
    {
        CHECK_THROWS_AS(touca::load_string_file("invalid"), std::invalid_argument);
        CHECK_THROWS_WITH(touca::load_string_file("invalid"), "failed to read file");
    }
}
