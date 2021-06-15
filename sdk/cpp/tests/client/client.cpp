// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/detail/client.hpp"
#include "catch2/catch.hpp"
#include "devkit/tmpfile.hpp"
#include "rapidjson/document.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#include "touca/devkit/resultfile.hpp"
#include "touca/devkit/utils.hpp"

using namespace touca;

std::string saveAndReadBack(const touca::ClientImpl& client)
{
    TmpFile file;
    CHECK_NOTHROW(client.save(file.path, {}, DataFormat::JSON, true));
    return load_string_file(file.path.string());
}

ElementsMap saveAndLoadBack(const touca::ClientImpl& client)
{
    TmpFile file;
    CHECK_NOTHROW(client.save(file.path, {}, DataFormat::FBS, true));
    ResultFile resultFile(file.path);
    return resultFile.parse();
}

TEST_CASE("empty client")
{
    touca::ClientImpl client;
    REQUIRE(client.is_configured() == false);
    CHECK(client.configuration_error().empty() == true);
    REQUIRE_NOTHROW(client.configure({ { "api-key", "some-secret-key" },
        { "api-url", "http://localhost:8081" },
        { "team", "myteam" },
        { "suite", "mysuite" },
        { "version", "myversion" },
        { "handshake", "false" } }));
    CHECK(client.is_configured() == true);
    CHECK(client.configuration_error().empty() == true);

    // Calling post for a client with no testcase should fail.
    SECTION("post")
    {
        REQUIRE_NOTHROW(client.post());
        CHECK(client.post() == false);
    }

    SECTION("save")
    {
        const auto& output = saveAndReadBack(client);
        CHECK(output == "[]");
    }
}

TEST_CASE("using a configured client")
{
    touca::ClientImpl client;
    const touca::ClientImpl::OptionsMap options_map = {
        { "team", "myteam" },
        { "suite", "mysuite" },
        { "version", "myversion" },
        { "handshake", "false" }
    };
    REQUIRE_NOTHROW(client.configure(options_map));
    REQUIRE(client.is_configured() == true);
    CHECK(client.configuration_error().empty() == true);

    /**
     *
     */
    SECTION("testcase switch")
    {
        CHECK_NOTHROW(client.add_hit_count("ignored-key"));
        CHECK(client.declare_testcase("some-case"));
        CHECK_NOTHROW(client.add_hit_count("some-key"));
        CHECK(client.declare_testcase("some-other-case"));
        CHECK_NOTHROW(client.add_hit_count("some-other-key"));
        CHECK(client.declare_testcase("some-case"));
        CHECK_NOTHROW(client.add_hit_count("some-other-key"));
        const auto& content = saveAndLoadBack(client);
        REQUIRE(content.count("some-case"));
        REQUIRE(content.count("some-other-case"));
        CHECK(content.at("some-case")->overview().keysCount == 2);
        CHECK(content.at("some-other-case")->overview().keysCount == 1);
    }

    /**
     *
     */
    SECTION("results")
    {
        client.declare_testcase("some-case");
        const auto& v1 = std::make_shared<types::Bool>(true);
        CHECK_NOTHROW(client.add_result("some-value", v1));
        CHECK_NOTHROW(client.add_hit_count("some-other-value"));
        CHECK_NOTHROW(client.add_array_element("some-array-value", v1));
        const auto& content = saveAndReadBack(client);
        const auto& expected = R"("results":[{"key":"some-array-value","value":"[true]"},{"key":"some-other-value","value":"1"},{"key":"some-value","value":"true"}])";
        CHECK_THAT(content, Catch::Contains(expected));
    }

    /**
     * bug
     */
    SECTION("assertions")
    {
        client.declare_testcase("some-case");
        const auto& v1 = std::make_shared<types::Bool>(true);
        CHECK_NOTHROW(client.add_assertion("some-value", v1));
        const auto& content = saveAndReadBack(client);
        const auto& expected = R"([])";
        CHECK_THAT(content, Catch::Contains(expected));
    }

    SECTION("metrics")
    {
        const auto& tc = client.declare_testcase("some-case");
        CHECK(tc->metrics().empty());
        CHECK_NOTHROW(client.start_timer("a"));
        CHECK(tc->metrics().empty());
        CHECK_THROWS_AS(client.stop_timer("b"), std::invalid_argument);
        CHECK_NOTHROW(client.start_timer("b"));
        CHECK(tc->metrics().empty());
        CHECK_NOTHROW(client.stop_timer("b"));
        CHECK(tc->metrics().size() == 1);
        CHECK(tc->metrics().count("b"));
        const auto& content = saveAndReadBack(client);
        const auto& expected = R"("results":[],"assertion":[],"metrics":[{"key":"b","value":"0"}])";
        CHECK_THAT(content, Catch::Contains(expected));
    }

    /**
     *
     */
    SECTION("forget_testcase")
    {
        client.declare_testcase("some-case");
        const auto& v1 = std::make_shared<types::Bool>(true);
        client.add_result("some-value", v1);
        client.add_assertion("some-assertion", v1);
        client.start_timer("some-metric");
        client.stop_timer("some-metric");
        client.forget_testcase("some-case");
        const auto& content = saveAndReadBack(client);
        CHECK_THAT(content, Catch::Contains(R"([])"));
    }

    /**
     * Calling post when client is locally configured should throw exception.
     */
    SECTION("post")
    {
        REQUIRE_NOTHROW(client.declare_testcase("mycase"));
        REQUIRE_NOTHROW(client.post());
        REQUIRE(client.post() == false);
    }
}
