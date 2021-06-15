// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "catch2/catch.hpp"
#include "tmpfile.hpp"
#include "touca/detail/client.hpp"

TEST_CASE("configure")
{
    touca::ClientImpl client;
    const auto& opts = client.options();
    std::unordered_map<std::string, std::string> input;

    SECTION("empty")
    {
        REQUIRE_NOTHROW(client.configure(input));
        CHECK(client.configure(input) == true);
        REQUIRE(opts.parse_error.empty() == true);
        CHECK(opts.team.empty());
        CHECK(opts.suite.empty());
        CHECK(opts.revision.empty());
        CHECK(opts.api_key.empty());
        CHECK(opts.api_url.empty());
    }
    SECTION("missing-api-params")
    {
        input.emplace("handshake", "false");
        input.emplace("team", "some-team");
        CHECK(client.configure(input) == false);
        CHECK_THAT(opts.parse_error, Catch::Contains("suite"));
        input.emplace("suite", "some-suite");
        CHECK(client.configure(input) == false);
        CHECK_THAT(opts.parse_error, Catch::Contains("version"));
        input.emplace("version", "some-version");
        CHECK(client.configure(input) == true);
        REQUIRE(opts.parse_error.empty() == true);
        CHECK(opts.team == "some-team");
        CHECK(opts.suite == "some-suite");
        CHECK(opts.revision == "some-version");
        CHECK(opts.api_key.empty());
        CHECK(opts.api_url.empty());
        CHECK(opts.handshake == false);
    }
    SECTION("missing-api-url")
    {
        input.emplace("api-key", "some-api-key");
        REQUIRE_NOTHROW(client.configure(input));
        CHECK(client.configure(input) == false);
        REQUIRE(opts.parse_error.empty() == false);
        CHECK_THAT(opts.parse_error, Catch::Contains("team"));
        CHECK(opts.team.empty());
        CHECK(opts.suite.empty());
        CHECK(opts.revision.empty());
        CHECK(opts.api_key == "some-api-key");
        CHECK(opts.api_url.empty());
        CHECK(opts.handshake == true);
    }
    SECTION("missing-api-key-1")
    {
        input.emplace("api-url", "some-api-url");
        REQUIRE_NOTHROW(client.configure(input));
        CHECK(client.configure(input) == false);
        CHECK_THAT(opts.parse_error, Catch::Contains("team"));
        CHECK(opts.team.empty());
        CHECK(opts.suite.empty());
        CHECK(opts.revision.empty());
        CHECK(opts.api_key.empty());
        CHECK(opts.api_url == "some-api-url");
        CHECK(opts.handshake == true);
    }
    SECTION("missing-api-key-2")
    {
        input.emplace("api-url", "http://example.com/api/@/some-team/some-suite/some-version");
        CHECK(client.configure(input) == false);
        CHECK_THAT(opts.parse_error, Catch::Contains("api-key"));
        CHECK(opts.team == "some-team");
        CHECK(opts.suite == "some-suite");
        CHECK(opts.revision == "some-version");
        CHECK(opts.api_key.empty());
        CHECK(opts.api_url == "http://example.com/api/@/some-team/some-suite/some-version");
        CHECK(opts.handshake == true);
    }
    SECTION("missing-version-info")
    {
        input.emplace("api-key", "some-api-key");
        input.emplace("api-url", "some-api-url");
        input.emplace("handshake", "false");
        CHECK(client.configure(input) == false);
        REQUIRE(opts.parse_error.empty() == false);
        CHECK_THAT(opts.parse_error, Catch::Contains("team"));
        CHECK(opts.team.empty());
        CHECK(opts.suite.empty());
        CHECK(opts.revision.empty());
        CHECK(opts.api_key == "some-api-key");
        CHECK(opts.api_url == "some-api-url");
        CHECK(opts.handshake == false);
    }
    SECTION("basic-usecase")
    {
        REQUIRE_NOTHROW(client.configure({ { "team", "some-team" },
            { "suite", "some-suite" },
            { "version", "some-version" },
            { "api-key", "some-api-key" },
            { "api-url", "some-api-url" },
            { "handshake", "false" } }));
        CHECK(client.configure(input) == true);
        REQUIRE(opts.parse_error.empty() == true);
        CHECK(opts.team == "some-team");
        CHECK(opts.suite == "some-suite");
        CHECK(opts.revision == "some-version");
        CHECK(opts.api_key == "some-api-key");
        CHECK(opts.api_url == "some-api-url");
        CHECK(opts.handshake == false);
    }
    SECTION("long-api-url")
    {
        input.emplace("api-url", "https://api.example.com/@/some-team/some-suite/some-version");
        input.emplace("api-key", "some-api-key");
        input.emplace("handshake", "false");
        CHECK(client.configure(input) == true);
        CHECK(opts.parse_error.empty() == true);
        CHECK(opts.api_url == "https://api.example.com/@/some-team/some-suite/some-version");
        CHECK(opts.team == "some-team");
        CHECK(opts.suite == "some-suite");
        CHECK(opts.revision == "some-version");
    }
    SECTION("override-defaults")
    {
        CHECK(client.configure(input) == true);
        CHECK(opts.parse_error.empty() == true);
        CHECK(opts.case_declaration == touca::ConcurrencyMode::AllThreads);
        CHECK(opts.post_max_cases == 10);
        CHECK(opts.post_max_retries == 2);
        input.emplace("concurrency-mode", "per-thread");
        input.emplace("post-testcases", "3");
        input.emplace("post-maxretries", "20");
        CHECK(client.configure(input) == true);
        CHECK(opts.case_declaration == touca::ConcurrencyMode::PerThread);
        CHECK(opts.post_max_cases == 3);
        CHECK(opts.post_max_retries == 20);
    }
}

TEST_CASE("configure-by-file")
{
    touca::ClientImpl client;
    const auto& opts = client.options();
    TmpFile file;

    SECTION("missing-file")
    {
        REQUIRE_NOTHROW(client.configure_by_file(file.path));
        REQUIRE(client.configure_by_file(file.path) == false);
        REQUIRE(opts.parse_error == "configuration file is missing");
    }

    SECTION("invalid-file")
    {
        file.write("");
        REQUIRE_NOTHROW(client.configure_by_file(file.path));
        REQUIRE(client.configure_by_file(file.path) == false);
        REQUIRE(opts.parse_error == "configuration file is not valid");
    }

    SECTION("valid-file")
    {
        file.write(R"({"touca":{"team":"myteam","suite":"mysuite","version":"myversion"}})");
        CHECK_NOTHROW(client.configure_by_file(file.path));
        CHECK(opts.team == "myteam");
        CHECK(opts.suite == "mysuite");
        CHECK(opts.revision == "myversion");
    }

    SECTION("valid-file-verbose")
    {
        file.write(R"({"touca":{"team":"myteam","suite":"mysuite","version":"myversion"}})");
        CHECK_NOTHROW(client.configure_by_file(file.path));
    }
}
