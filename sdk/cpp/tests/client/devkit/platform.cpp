/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/devkit/platform.hpp"
#include "catch2/catch.hpp"

TEST_CASE("parse api-url")
{
    using namespace weasel;

    SECTION("full format")
    {
        ApiUrl api("https://getweasel.com/api/@/weasel/tutorial/1.0");
        CHECK(api._root == "https://getweasel.com/api");
        CHECK(api._team == "weasel");
        CHECK(api._suite == "tutorial");
        CHECK(api._revision == "1.0");
        CHECK(api._error.empty());
    }

    SECTION("long format")
    {
        ApiUrl api("http://localhost:8081/@/weasel/tutorial");
        CHECK(api._root == "http://localhost:8081");
        CHECK(api._team == "weasel");
        CHECK(api._suite == "tutorial");
        CHECK(api._revision.empty());
        CHECK(api._error.empty());
    }

    SECTION("short format")
    {
        ApiUrl api("https://example-101.com");
        CHECK(api._root == "https://example-101.com");
        CHECK(api._team.empty());
        CHECK(api._suite.empty());
        CHECK(api._revision.empty());
        CHECK(api._error.empty());
    }
}
