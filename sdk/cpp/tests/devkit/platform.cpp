// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/devkit/platform.hpp"
#include "catch2/catch.hpp"
#include <string>
#include <vector>

void check_api(const touca::ApiUrl& api, const std::vector<std::string> parts)
{
    REQUIRE(!api.root().empty());
    std::vector<std::string> actual {
        api.root(), api.route(""), api._team, api._suite, api._revision
    };
    for (auto i = 0u; i < parts.size() && i < actual.size(); i++) {
        CHECK(actual.at(i) == parts.at(i));
    }
}

void check_api(const std::string& url, const std::vector<std::string> parts)
{
    touca::ApiUrl api(url);
    check_api(api, parts);
}

TEST_CASE("api-url")
{
    SECTION("empty-url")
    {
        touca::ApiUrl api("");
        CHECK(api.root().empty());
        CHECK_THAT(api._error, Catch::Contains("invalid"));
        REQUIRE_NOTHROW(api.route("somewhere"));
        CHECK(api.route("/some/path") == "/some/path");
    }

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
        touca::ApiUrl api("http://api.example.com:8081/api");
        check_api(api, { "http://api.example.com:8081", "api" });
        CHECK(api.route("/one") == "/api/one");
        CHECK(api.route("/two/three") == "/api/two/three");
    }

    SECTION("scheme-host-port-with-prefix-2")
    {
        touca::ApiUrl api("http://api.example.com:8081/api/v1");
        check_api(api, { "http://api.example.com:8081", "api/v1" });
        CHECK(api.route("/one") == "/api/v1/one");
        CHECK(api.route("/two/three") == "/api/v1/two/three");
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
        touca::ApiUrl api("example.com/api/@/team/suite/revision");
        check_api(api, { "example.com", "api", "team", "suite", "revision" });
    }

    SECTION("confirm-pass")
    {
        touca::ApiUrl api("example.com/api/@/team/suite/revision");
        CHECK_NOTHROW(api.confirm("team", "suite", "revision"));
        CHECK(api._error.empty());
        CHECK(api._team == "team");
        CHECK(api._suite == "suite");
        CHECK(api._revision == "revision");
    }

    SECTION("confirm-fail")
    {
        touca::ApiUrl api("example.com/api/@/team/suite/revision");
        SECTION("team")
        {
            CHECK_NOTHROW(api.confirm("team2", "suite", "revision"));
            CHECK_THAT(api._error, Catch::Contains("team"));
        }
        SECTION("suite")
        {
            CHECK_NOTHROW(api.confirm("team", "suite2", "revision"));
            CHECK_THAT(api._error, Catch::Contains("suite"));
        }
        SECTION("revision")
        {
            CHECK_NOTHROW(api.confirm("team", "suite", "revision2"));
            CHECK_THAT(api._error, Catch::Contains("revision"));
        }
        CHECK_THAT(api._error, Catch::Contains("conflict"));
    }
}

TEST_CASE("platform")
{
    SECTION("empty-url")
    {
        touca::ApiUrl api("");
        touca::Platform platform(api);
        CHECK_THAT(platform.get_error(), Catch::Contains("invalid"));
        CHECK(platform.has_token() == false);
    }
}
