/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "catch2/catch.hpp"
#include "weasel/detail/coptions.hpp"

using namespace weasel;

TEST_CASE("coptions")
{
    weasel::COptions coptions;
    std::unordered_map<std::string, std::string> input;

    SECTION("empty")
    {
        REQUIRE_NOTHROW(coptions.parse(input));
        CHECK(coptions.parse(input) == false);
    }
    SECTION("api-key")
    {
        input.emplace("api-key", "some-api-key");
        REQUIRE_NOTHROW(coptions.parse(input));
        CHECK(coptions.parse(input) == false);
        CHECK(coptions.api_key == "some-api-key");
    }
    SECTION("single-call")
    {
        input = {
            { "team", "some-team" },
            { "suite", "some-suite" },
            { "version", "some-version" },
            { "api-key", "some-api-key" },
            { "api-url", "some-api-url" },
            { "handshake", "false" }
        };
        REQUIRE_NOTHROW(coptions.parse(input));
        CHECK(coptions.parse(input) == true);
        CHECK(coptions.team == "some-team");
        CHECK(coptions.suite == "some-suite");
        CHECK(coptions.revision == "some-version");
        CHECK(coptions.api_key == "some-api-key");
        CHECK(coptions.api_url == "some-api-url");
        CHECK(coptions.handshake == false);
    }
    SECTION("multiple-calls")
    {
        input.emplace("team", "some-team");
        REQUIRE_NOTHROW(coptions.parse(input));
        CHECK(coptions.parse(input) == false);
        CHECK(coptions.team == "some-team");
        input.emplace("suite", "some-suite");
        input.emplace("version", "some-version");
        CHECK(coptions.parse(input) == false);
        CHECK(coptions.team == "some-team");
        CHECK(coptions.suite == "some-suite");
        CHECK(coptions.revision == "some-version");
        input.emplace("handshake", "false");
        CHECK(coptions.parse(input) == true);
        CHECK(coptions.handshake == false);
    }
}
