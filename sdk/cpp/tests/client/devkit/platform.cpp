/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/devkit/platform.hpp"
#include "catch2/catch.hpp"
#include <string>
#include <vector>

void check_api(const std::string& url, const std::vector<std::string> parts)
{
    weasel::ApiUrl api(url);
    REQUIRE(!api.root().empty());
    std::vector<std::string> actual {
        api.root(), api.route(""), api._team, api._suite, api._revision
    };
    for (auto i = 0u; i < parts.size() && i < actual.size(); i++) {
        CHECK(actual.at(i) == parts.at(i));
    }
}

TEST_CASE("api-url")
{
    SECTION("no-scheme-local")
    {
        check_api("localhost", { "localhost" });
    }

    SECTION("no-scheme-domain")
    {
        check_api("api.example.com", { "api.example.com" });
    }

    SECTION("no-scheme-with-port")
    {
        check_api("example.com:4200", { "example.com:4200" });
    }

    SECTION("scheme-host-port")
    {
        check_api("http://api.example.com:4200",
            { "http://api.example.com:4200" });
    }

    SECTION("scheme-host-extra-slash")
    {
        check_api("https://api.example.com/",
            { "https://api.example.com" });
    }

    SECTION("scheme-host-port-with-prefix-1")
    {
        check_api("http://api.example.com:8081/api",
            { "http://api.example.com:8081", "api" });
    }

    SECTION("scheme-host-port-with-prefix-2")
    {
        check_api("http://api.example.com:8081/api/v1",
            { "http://api.example.com:8081", "api/v1" });
    }

    SECTION("scheme-host-port-with-prefix-and-team")
    {
        check_api("https://api.example.com:8081/api/@/team",
            { "https://api.example.com:8081", "api", "team" });
    }

    SECTION("scheme-host-port-with-prefix-and-suite")
    {
        check_api("https://api.example.com:8081/api/@/team/suite",
            { "https://api.example.com:8081", "api", "team", "suite" });
    }

    SECTION("scheme-host-port-with-prefix-and-revision")
    {
        check_api("https://api.example.com:8081/api/@/team/suite/revision",
            { "https://api.example.com:8081", "api", "team", "suite", "revision" });
    }
}
