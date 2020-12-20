/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/devkit/utils.hpp"
#include "catch2/catch.hpp"

TEST_CASE("string formatting")
{
    SECTION("toUtf8")
    {
        CHECK(weasel::toUtf8(L"hello") == "hello");
    }

    SECTION("format")
    {
        CHECK(weasel::format("hello {}", "world") == "hello world");
    }
}
