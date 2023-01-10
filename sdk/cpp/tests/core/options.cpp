// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "catch2/catch.hpp"
#include "tests/core/shared.hpp"
#include "touca/client/detail/client.hpp"

TEST_CASE("configure") {
  touca::ClientImpl client;
  const auto& opts = client.options();

  SECTION("empty") {
    REQUIRE_NOTHROW(client.configure());
    CHECK(client.configure() == true);
    REQUIRE(client.configuration_error().empty() == true);
    CHECK(opts.team.empty());
    CHECK(opts.suite.empty());
    CHECK(opts.version.empty());
    CHECK(opts.api_key.empty());
    CHECK(opts.api_url.empty());
  }
  SECTION("missing-api-params") {
    auto a = [](touca::ClientOptions& x) {
      x.offline = true;
      x.team = "some-team";
    };
    CHECK(client.configure(a) == false);
    CHECK_THAT(client.configuration_error(), Catch::Contains("suite"));
    auto b = [](touca::ClientOptions& x) { x.suite = "some-suite"; };
    CHECK(client.configure(b) == false);
    CHECK_THAT(client.configuration_error(), Catch::Contains("revision"));
    auto c = [](touca::ClientOptions& x) { x.version = "some-version"; };
    CHECK(client.configure(c) == true);
    REQUIRE(client.configuration_error().empty() == true);
    CHECK(opts.team == "some-team");
    CHECK(opts.suite == "some-suite");
    CHECK(opts.version == "some-version");
    CHECK(opts.api_key.empty());
    CHECK(opts.api_url.empty());
    CHECK(opts.offline == true);
  }
  SECTION("missing-api-url") {
    auto input = [](touca::ClientOptions& x) { x.api_key = "some-api-key"; };
    REQUIRE_NOTHROW(client.configure(input));
    CHECK(client.configure(input) == false);
    REQUIRE(client.configuration_error().empty() == false);
    CHECK_THAT(client.configuration_error(), Catch::Contains("team"));
    CHECK(opts.team.empty());
    CHECK(opts.suite.empty());
    CHECK(opts.version.empty());
    CHECK(opts.api_key == "some-api-key");
    CHECK(opts.api_url == "https://api.touca.io");
    CHECK(opts.offline == false);
  }
  SECTION("missing-api-key-1") {
    auto input = [](touca::ClientOptions& x) { x.api_url = "some-api-url"; };
    REQUIRE_NOTHROW(client.configure(input));
    CHECK(client.configure(input) == false);
    CHECK_THAT(client.configuration_error(), Catch::Contains("team"));
    CHECK(opts.team.empty());
    CHECK(opts.suite.empty());
    CHECK(opts.version.empty());
    CHECK(opts.api_key.empty());
    CHECK(opts.api_url == "some-api-url");
    CHECK(opts.offline == false);
  }
  SECTION("missing-api-key-2") {
    auto input = [](touca::ClientOptions& x) {
      x.api_url = "http://example.com/api/@/some-team/some-suite/some-version";
    };
    CHECK(client.configure(input) == false);
    CHECK_THAT(client.configuration_error(), Catch::Contains("api-key"));
    CHECK(opts.team == "some-team");
    CHECK(opts.suite == "some-suite");
    CHECK(opts.version == "some-version");
    CHECK(opts.api_key.empty());
    CHECK(opts.api_url == "http://example.com/api");
    CHECK(opts.offline == false);
  }
  SECTION("missing-version-info") {
    auto input = [](touca::ClientOptions& x) {
      x.api_key = "some-api-key";
      x.api_url = "some-api-url";
      x.offline = true;
    };
    CHECK(client.configure(input) == true);
    CHECK(client.configuration_error().empty() == true);
    CHECK(opts.team.empty());
    CHECK(opts.suite.empty());
    CHECK(opts.version.empty());
    CHECK(opts.api_key == "some-api-key");
    CHECK(opts.api_url == "some-api-url");
    CHECK(opts.offline == true);
  }
  SECTION("basic-use-case") {
    auto a = [](touca::ClientOptions& x) {
      x.team = "some-team";
      x.suite = "some-suite";
      x.version = "some-version";
      x.api_key = "some-api-key";
      x.api_url = "some-api-url";
      x.offline = true;
    };
    REQUIRE_NOTHROW(client.configure(a));
    auto b = [](touca::ClientOptions& x) {};
    CHECK(client.configure(b) == true);
    REQUIRE(client.configuration_error().empty() == true);
    CHECK(opts.team == "some-team");
    CHECK(opts.suite == "some-suite");
    CHECK(opts.version == "some-version");
    CHECK(opts.api_key == "some-api-key");
    CHECK(opts.api_url == "some-api-url");
    CHECK(opts.offline == true);
  }
  SECTION("long-api-url") {
    auto input = [](touca::ClientOptions& x) {
      x.api_url = "https://api.example.com/@/some-team/some-suite/some-version",
      x.api_key = "some-api-key";
      x.offline = true;
    };
    CHECK(client.configure(input) == true);
    CHECK(client.configuration_error().empty() == true);
    CHECK(opts.api_url == "https://api.example.com");
    CHECK(opts.team == "some-team");
    CHECK(opts.suite == "some-suite");
    CHECK(opts.version == "some-version");
  }
  SECTION("override-defaults") {
    auto a = [](touca::ClientOptions& x) {};
    CHECK(client.configure(a) == true);
    CHECK(client.configuration_error().empty() == true);
    CHECK(opts.concurrency);
    auto b = [](touca::ClientOptions& x) { x.concurrency = false; };
    CHECK(client.configure(b) == true);
    CHECK(!opts.concurrency);
  }
}
