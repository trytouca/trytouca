/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/devkit/utils.hpp"
#include "catch2/catch.hpp"

TEST_CASE("string formatting")
{
    SECTION("narrow")
    {
        CHECK(weasel::narrow(L"hello") == "hello");
    }

    SECTION("format")
    {
        CHECK(weasel::format("hello {}", "world") == "hello world");
    }

    SECTION("load missing file")
    {
        CHECK_THROWS_AS(weasel::load_string_file("invalid"), std::invalid_argument);
        CHECK_THROWS_WITH(weasel::load_string_file("invalid"), "failed to read file");
    }
}
