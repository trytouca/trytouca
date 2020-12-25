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
}
