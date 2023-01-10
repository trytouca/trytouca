// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/core/transport.hpp"

#include <string>
#include <vector>

#include "catch2/catch.hpp"

void check_api(const touca::ApiUrl& url, const std::string& root = "",
               const std::string& prefix = "", const std::string& extra = "") {
  CHECK(url.root == root);
  CHECK(url.prefix == prefix);
  CHECK(url.extra == extra);
}

void check_api(const std::string& url, const std::string& root = "",
               const std::string& prefix = "", const std::string& extra = "") {
  check_api(touca::ApiUrl(url), root, prefix, extra);
}

TEST_CASE("ApiUrl") {
  SECTION("empty-url") {
    touca::ApiUrl api("");
    check_api(api);
    REQUIRE_NOTHROW(api.route("somewhere"));
    CHECK(api.route("/some/path") == "/some/path");
  }

  SECTION("no-scheme") {
    check_api("localhost", "localhost");
    check_api("api.example.com", "api.example.com");
    check_api("example.com:4200", "example.com:4200");
    check_api("http://api.example.com:4200", "http://api.example.com:4200");
    check_api("https://api.example.com/", "https://api.example.com");
  }

  SECTION("scheme-host-port-with-prefix-1") {
    touca::ApiUrl api("http://api.example.com:8080/api");
    check_api(api, "http://api.example.com:8080", "api");
    CHECK(api.route("/one") == "/api/one");
    CHECK(api.route("/two/three") == "/api/two/three");
  }

  SECTION("scheme-host-port-with-prefix-2") {
    touca::ApiUrl api("http://api.example.com:8080/api/v1");
    check_api(api, "http://api.example.com:8080", "api/v1");
    CHECK(api.route("/one") == "/api/v1/one");
    CHECK(api.route("/two/three") == "/api/v1/two/three");
  }

  SECTION("scheme-host-port-with-prefix-and-team") {
    check_api("https://api.example.com:8080/api/@/team",
              "https://api.example.com:8080", "api", "/team");
  }

  SECTION("scheme-host-port-with-prefix-and-suite") {
    check_api("https://api.example.com:8080/api/@/team/suite",
              "https://api.example.com:8080", "api", "/team/suite");
  }

  SECTION("scheme-host-port-with-prefix-and-revision") {
    check_api("example.com/api/@/team/suite/revision", "example.com", "api",
              "/team/suite/revision");
  }
}
