/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/detail/client.hpp"
#include "catch2/catch.hpp"
#include "devkit/tmpfile.hpp"
#include "rapidjson/document.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#include "weasel/devkit/resultfile.hpp"
#include "weasel/devkit/utils.hpp"

using namespace weasel;
using co = ConfigOption;

std::string saveAndReadBack(const weasel::ClientImpl& client)
{
    TmpFile file;
    CHECK_NOTHROW(client.save(file.path, {}, DataFormat::JSON, true));
    return load_string_file(file.path);
}

ElementsMap saveAndLoadBack(const weasel::ClientImpl& client)
{
    TmpFile file;
    CHECK_NOTHROW(client.save(file.path, {}, DataFormat::FBS, true));
    ResultFile resultFile(file.path);
    return resultFile.parse();
}

TEST_CASE("configure client")
{
    weasel::ClientImpl client;
    weasel::ClientImpl::OptionsMap opts;

    SECTION("successful configure: online")
    {
        const auto& options = { co::api_key, co::api_url,
                                co::api_root, co::case_declaration,
                                co::post_max_cases, co::post_max_retries,
                                co::handshake, co::suite,
                                co::team, co::version };

        SECTION("full format api-url")
        {
            opts = { { "api-key", "some-secret-key" },
                     { "api-url",
                       "https://getweasel.com/api/@/myteam/mysuite/myversion" },
                     { "handshake", "false" } };
        }

        SECTION("long format api-url")
        {
            opts = { { "api-key", "some-secret-key" },
                     { "api-url", "https://getweasel.com/api/@/myteam/mysuite" },
                     { "version", "myversion" },
                     { "handshake", "false" } };
        }

        SECTION("short format api-url")
        {
            opts = { { "api-key", "some-secret-key" },
                     { "api-url", "https://getweasel.com/api" },
                     { "team", "myteam" },
                     { "suite", "mysuite" },
                     { "version", "myversion" },
                     { "handshake", "false" } };
        }

        REQUIRE_NOTHROW(client.configure(opts));
        for (const auto& key : options)
        {
            REQUIRE(client.options().has(key));
        }
        CHECK(client.options().get(co::api_key) == "some-secret-key");
        CHECK(client.options().get(co::api_root) == "https://getweasel.com/api");
        CHECK(client.options().get(co::team) == "myteam");
        CHECK(client.options().get(co::suite) == "mysuite");
        CHECK(client.options().get(co::version) == "myversion");
    }

    SECTION("successful configure: offline")
    {
        REQUIRE_NOTHROW(client.configure({ { "team", "myteam" },
                                           { "suite", "mysuite" },
                                           { "version", "myversion" } }));

        for (const auto& key :
             { co::handshake, co::suite, co::team, co::version })
        {
            REQUIRE(client.options().has(key));
        }
        CHECK(client.options().get(co::handshake) == "true");
        CHECK(client.options().get(co::team) == "myteam");
        CHECK(client.options().get(co::suite) == "mysuite");
        CHECK(client.options().get(co::version) == "myversion");
    }

    SECTION("configureByFile")
    {
        TmpFile file;

        SECTION("missing file")
        {
            CHECK_THROWS_AS(
                client.configureByFile(file.path), std::invalid_argument);
            CHECK_THROWS_WITH(
                client.configureByFile(file.path),
                "configuration file is missing");
        }

        SECTION("invalid file")
        {
            file.write("");
            CHECK_THROWS_AS(
                client.configureByFile(file.path), std::invalid_argument);
            CHECK_THROWS_WITH(
                client.configureByFile(file.path),
                "configuration file is not valid");
        }

        SECTION("valid file")
        {
            file.write(
                R"({"weasel":{"team":"myteam","suite":"mysuite","version":"myversion"}})");
            CHECK_NOTHROW(client.configureByFile(file.path));
            for (const auto& key : { co::suite, co::team, co::version })
            {
                CHECK(client.options().has(key));
            }
            CHECK(client.options().get(co::team) == "myteam");
            CHECK(client.options().get(co::suite) == "mysuite");
            CHECK(client.options().get(co::version) == "myversion");
        }

        SECTION("valid file: verbose")
        {
            file.write(
                R"({"weasel":{"team":"myteam","suite":"mysuite","version":"myversion"}})");
            CHECK_NOTHROW(client.configureByFile(file.path));
        }
    }
}

/**
 * Calling post for a client with no testcase should be successful.
 */
TEST_CASE("empty client")
{
    weasel::ClientImpl client;
    REQUIRE_NOTHROW(client.configure({ { "api-key", "some-secret-key" },
                                       { "api-url", "http://localhost:8081" },
                                       { "team", "myteam" },
                                       { "suite", "mysuite" },
                                       { "version", "myversion" },
                                       { "handshake", "false" } }));

    SECTION("post")
    {
        REQUIRE_NOTHROW(client.post());
        CHECK(client.post());
    }

    SECTION("save")
    {
        const auto& output = saveAndReadBack(client);
        CHECK(output == "[]");
    }
}

TEST_CASE("using a configured client")
{
    weasel::ClientImpl client;
    REQUIRE_NOTHROW(client.configure({ { "team", "myteam" },
                                       { "suite", "mysuite" },
                                       { "version", "myversion" } }));

    /**
     *
     */
    SECTION("testcase switch")
    {
        CHECK_NOTHROW(client.add_hit_count("ignored-key"));
        CHECK(client.testcase("some-case"));
        CHECK_NOTHROW(client.add_hit_count("some-key"));
        CHECK(client.testcase("some-other-case"));
        CHECK_NOTHROW(client.add_hit_count("some-other-key"));
        CHECK(client.testcase("some-case"));
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
        client.testcase("some-case");
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
        client.testcase("some-case");
        const auto& v1 = std::make_shared<types::Bool>(true);
        CHECK_NOTHROW(client.add_assertion("some-value", v1));
        const auto& content = saveAndReadBack(client);
        const auto& expected = R"([])";
        CHECK_THAT(content, Catch::Contains(expected));
    }

    SECTION("metrics")
    {
        const auto& tc = client.testcase("some-case");
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
        client.testcase("some-case");
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
        REQUIRE_NOTHROW(client.testcase("mycase"));
        REQUIRE_THROWS_AS(client.post(), std::invalid_argument);
        REQUIRE_THROWS_WITH(
            client.post(), Catch::Contains("configuration parameter"));
    }
}
