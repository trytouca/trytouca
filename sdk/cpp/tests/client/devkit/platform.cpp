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
        ApiUrl apiUrl("https://getweasel.com/api/@/weasel/tutorial/1.0");

        CHECK(apiUrl.root == "https://getweasel.com/api");

        REQUIRE(apiUrl.slugs.size() == 3);
        REQUIRE(apiUrl.slugs.count("team"));
        REQUIRE(apiUrl.slugs.count("suite"));
        REQUIRE(apiUrl.slugs.count("version"));

        CHECK(apiUrl.slugs.at("team") == "weasel");
        CHECK(apiUrl.slugs.at("suite") == "tutorial");
        CHECK(apiUrl.slugs.at("version") == "1.0");
    }

    SECTION("long format")
    {
        ApiUrl apiUrl("http://localhost:8081/@/weasel/tutorial");

        CHECK(apiUrl.root == "http://localhost:8081");

        REQUIRE(apiUrl.slugs.size() == 3);
        REQUIRE(apiUrl.slugs.count("team"));
        REQUIRE(apiUrl.slugs.count("suite"));
        REQUIRE(apiUrl.slugs.count("version"));

        CHECK(apiUrl.slugs.at("team") == "weasel");
        CHECK(apiUrl.slugs.at("suite") == "tutorial");
        CHECK(apiUrl.slugs.at("version").empty());
    }

    SECTION("short format")
    {
        ApiUrl apiUrl("https://example-101.com");

        CHECK(apiUrl.root == "https://example-101.com");
        REQUIRE(apiUrl.slugs.size() == 3);
        for (const auto& key : { "team", "suite", "version" })
        {
            REQUIRE(apiUrl.slugs.count(key));
            CHECK(apiUrl.slugs.at(key).empty());
        }
    }

    SECTION("construct by options")
    {
        ApiUrl apiUrl("http://localhost:8081", "team1", "suite1", "version1");
        CHECK(apiUrl.root == "http://localhost:8081");

        REQUIRE(apiUrl.slugs.size() == 3);
        for (const auto& key : { "team", "suite", "version" })
        {
            REQUIRE(apiUrl.slugs.count(key));
            CHECK(apiUrl.slugs.at(key) == std::string(key) + "1");
        }
    }
}
