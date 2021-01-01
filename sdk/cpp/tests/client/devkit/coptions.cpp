/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "catch2/catch.hpp"
#include "weasel/detail/coptions.hpp"

using namespace weasel;
using Catch::Matchers::Contains;

TEST_CASE("coptions")
{
    weasel::COptions coptions;
    std::unordered_map<std::string, std::string> input;

    SECTION("empty")
    {
        REQUIRE_NOTHROW(coptions.parse(input));
        CHECK(coptions.parse(input) == false);
        REQUIRE(coptions.parse_error.empty() == false);
        CHECK_THAT(coptions.parse_error, Contains("team"));
    }
    SECTION("api-key")
    {
        input.emplace("api-key", "some-api-key");
        REQUIRE_NOTHROW(coptions.parse(input));
        CHECK(coptions.parse(input) == false);
        REQUIRE(coptions.parse_error.empty() == false);
        CHECK_THAT(coptions.parse_error, Contains("team"));
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
        REQUIRE(coptions.parse_error.empty() == true);
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
        REQUIRE(coptions.parse_error.empty() == false);
        CHECK_THAT(coptions.parse_error, Contains("suite"));
        CHECK(coptions.team == "some-team");
        input.emplace("suite", "some-suite");
        input.emplace("version", "some-version");
        CHECK(coptions.parse(input) == false);
        REQUIRE(coptions.parse_error.empty() == false);
        CHECK_THAT(coptions.parse_error, Contains("api-key"));
        CHECK(coptions.team == "some-team");
        CHECK(coptions.suite == "some-suite");
        CHECK(coptions.revision == "some-version");
        input.emplace("handshake", "false");
        CHECK(coptions.parse(input) == true);
        CHECK(coptions.handshake == false);
        CHECK(coptions.parse_error.empty() == true);
    }
    SECTION("long-api-url")
    {
        input.emplace("api-url", "https://api.example.com/@/some-team/some-suite/some-version");
        input.emplace("api-key", "some-api-key");
        input.emplace("handshake", "false");
        CHECK(coptions.parse(input) == true);
        CHECK(coptions.parse_error.empty() == true);
        CHECK(coptions.parse_error == "");
        CHECK(coptions.team == "some-team");
        CHECK(coptions.suite == "some-suite");
        CHECK(coptions.revision == "some-version");
    }
    SECTION("missing-api-key")
    {
        input.emplace("api-url", "https://api.example.com/@/some-team/some-suite/some-version");
        CHECK(coptions.parse(input) == false);
        CHECK(coptions.parse_error.empty() == false);
        CHECK_THAT(coptions.parse_error, Contains("api-key"));
        CHECK(coptions.team == "some-team");
        CHECK(coptions.suite == "some-suite");
        CHECK(coptions.revision == "some-version");
    }
    SECTION("override-defaults")
    {
        input.emplace("api-url", "https://api.example.com/@/some-team/some-suite/some-version");
        input.emplace("handshake", "false");
        CHECK(coptions.parse(input) == true);
        CHECK(coptions.parse_error.empty() == true);
        CHECK(coptions.case_declaration == weasel::ConcurrencyMode::AllThreads);
        CHECK(coptions.post_max_cases == 10);
        CHECK(coptions.post_max_retries == 2);
        input.emplace("testcase-declaration-mode", "per-thread");
        input.emplace("post-testcases", "3");
        input.emplace("post-maxretries", "20");
        CHECK(coptions.parse(input) == true);
        CHECK(coptions.case_declaration == weasel::ConcurrencyMode::PerThread);
        CHECK(coptions.post_max_cases == 3);
        CHECK(coptions.post_max_retries == 20);
    }
}
