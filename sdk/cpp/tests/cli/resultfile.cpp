// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/cli/resultfile.hpp"

#include "catch2/catch.hpp"
#include "tests/core/tmpfile.hpp"
#include "touca/client/detail/client.hpp"

using namespace touca;

ElementsMap save_and_load_back(const touca::ClientImpl& client) {
  TmpFile file;
  CHECK_NOTHROW(client.save(file.path, {}, DataFormat::FBS, true));
  ResultFile resultFile(file.path);
  return resultFile.parse();
}

TEST_CASE("Deserialize file") {
  touca::ClientImpl client;
  const touca::ClientImpl::OptionsMap options_map = {{"team", "myteam"},
                                                     {"suite", "mysuite"},
                                                     {"version", "myversion"},
                                                     {"offline", "true"}};
  REQUIRE_NOTHROW(client.configure(options_map));
  REQUIRE(client.is_configured() == true);
  CHECK(client.configuration_error().empty() == true);

  SECTION("testcase switch") {
    CHECK_NOTHROW(client.add_hit_count("ignored-key"));
    CHECK(client.declare_testcase("some-case"));
    CHECK_NOTHROW(client.add_hit_count("some-key"));
    CHECK(client.declare_testcase("some-other-case"));
    CHECK_NOTHROW(client.add_hit_count("some-other-key"));
    CHECK(client.declare_testcase("some-case"));
    CHECK_NOTHROW(client.add_hit_count("some-other-key"));
    const auto& content = save_and_load_back(client);
    REQUIRE(content.count("some-case"));
    REQUIRE(content.count("some-other-case"));
    CHECK(content.at("some-case")->overview().keysCount == 2);
    CHECK(content.at("some-other-case")->overview().keysCount == 1);
  }
}
