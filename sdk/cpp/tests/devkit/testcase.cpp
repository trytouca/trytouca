// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/devkit/testcase.hpp"
#include "catch2/catch.hpp"
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "touca/devkit/comparison.hpp"

/**
 * Helper function to provide `Testcase`, `TestcaseComparison`
 * and `TestcaseComparison::Overview` as json string.
 */
std::string make_json(const std::function<rapidjson::Value(touca::RJAllocator&)> func)
{
    rapidjson::Document doc(rapidjson::kObjectType);
    rapidjson::Document::AllocatorType& allocator = doc.GetAllocator();
    const auto& value = func(allocator);

    rapidjson::StringBuffer strbuf;
    rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
    writer.SetMaxDecimalPlaces(3);
    value.Accept(writer);
    return strbuf.GetString();
}

TEST_CASE("Testcase")
{
    touca::Testcase testcase = touca::Testcase("some-team", "some-suite", "some-version", "some-case");

    SECTION("metadata")
    {
        CHECK_NOTHROW(testcase.metadata());
        const auto& meta = testcase.metadata();
        CHECK(meta.teamslug == "some-team");
        CHECK(meta.testsuite == "some-suite");
        CHECK(meta.version == "some-version");
        CHECK(meta.testcase == "some-case");
        CHECK(meta.describe() == "some-team/some-suite/some-version/some-case");
    }

    SECTION("assertion")
    {
        const auto value = std::make_shared<touca::types::Bool>(true);
        testcase.add_assertion("some-key", value);
        testcase.add_assertion("some-other-key", value);
        CHECK_NOTHROW(testcase.add_assertion("some-key", value));
    }

    SECTION("add_hit_count")
    {
        SECTION("expected-use")
        {
            testcase.add_hit_count("some-key");
            testcase.add_hit_count("some-other-key");
            testcase.add_hit_count("some-key");
            const auto expected = R"("results":[{"key":"some-key","value":"2"},{"key":"some-other-key","value":"1"}])";
            const auto output = make_json([&testcase](touca::RJAllocator& allocator) { return testcase.json(allocator); });
            REQUIRE_THAT(output, Catch::Contains(expected));
        }

        SECTION("unexpected-use: key is already used to store boolean")
        {
            const auto value = std::make_shared<touca::types::Bool>(true);
            testcase.add_result("some-key", value);
            CHECK_THROWS_AS(
                testcase.add_hit_count("some-key"), std::invalid_argument);
            CHECK_THROWS_WITH(
                testcase.add_hit_count("some-key"),
                Catch::Contains("different type"));
            CHECK_NOTHROW(testcase.add_hit_count("some-other-key"));
        }

        SECTION("unexpected-use: key is already used to store float")
        {
            const auto value = std::make_shared<touca::types::Number<float>>(1.0f);
            testcase.add_result("some-key", value);
            CHECK_THROWS_AS(
                testcase.add_hit_count("some-key"), std::invalid_argument);
            CHECK_THROWS_WITH(
                testcase.add_hit_count("some-key"),
                Catch::Contains("different type"));
            CHECK_NOTHROW(testcase.add_hit_count("some-other-key"));
        }
    }

    SECTION("add_array_element")
    {
        SECTION("expected-use")
        {
            for (auto i = 0; i < 3; ++i) {
                const auto value = std::make_shared<touca::types::Number<uint64_t>>(i);
                testcase.add_array_element("some-key", value);
            }
            const auto expected = R"("results":[{"key":"some-key","value":"[0,1,2]"}])";
            const auto output = make_json([&testcase](touca::RJAllocator& allocator) { return testcase.json(allocator); });
            REQUIRE_THAT(output, Catch::Contains(expected));
        }
        SECTION("unexpected-use")
        {
            const auto someBool = std::make_shared<touca::types::Bool>(true);
            const auto someNumber = std::make_shared<touca::types::Number<uint64_t>>(1);
            testcase.add_result("some-key", someBool);
            CHECK_THROWS_AS(
                testcase.add_array_element("some-key", someNumber),
                std::invalid_argument);
            CHECK_THROWS_WITH(
                testcase.add_array_element("some-key", someNumber),
                Catch::Contains("different type"));
            CHECK_NOTHROW(testcase.add_result("some-key", someBool));
            CHECK_NOTHROW(testcase.add_result("some-other-key", someNumber));
        }
    }

    /**
     * Calling `clear` for a testcase removes all results, assertions and
     * metrics associated with it.
     */
    SECTION("clear")
    {
        const auto value = std::make_shared<touca::types::Bool>(true);
        testcase.add_result("some-key", value);
        testcase.add_assertion("some-other-key", value);
        testcase.tic("some-metric");
        testcase.add_hit_count("some-new-key");
        testcase.toc("some-metric");
        testcase.add_array_element("some-array", value);

        const auto before = make_json([&testcase](touca::RJAllocator& allocator) { return testcase.json(allocator); });
        testcase.clear();
        const auto after = make_json([&testcase](touca::RJAllocator& allocator) { return testcase.json(allocator); });

        const auto check1 = R"("results":[{"key":"some-array","value":"[true]"},{"key":"some-key","value":"true"},{"key":"some-new-key","value":"1"}])";
        const auto check2 = R"("assertion":[{"key":"some-other-key","value":"true"}])";
        const auto check3 = R"("metrics":[{"key":"some-metric","value":"0"}])";
        const auto check4 = R"("results":[],"assertion":[],"metrics":[])";
        CHECK_THAT(before, Catch::Contains(check1));
        CHECK_THAT(before, Catch::Contains(check2));
        CHECK_THAT(before, Catch::Contains(check3));
        CHECK_THAT(after, Catch::Contains(check4));
    }

    SECTION("overview")
    {
        const auto value = std::make_shared<touca::types::Bool>(true);
        const auto check_counters =
            [&testcase](const std::array<int32_t, 3>& counters) {
                CHECK(testcase.overview().keysCount == counters[0]);
                CHECK(testcase.overview().metricsCount == counters[1]);
                CHECK(testcase.overview().metricsDuration == counters[2]);
            };
        check_counters({ 0, 0, 0 });
        testcase.add_result("some-key", value);
        check_counters({ 1, 0, 0 });
        testcase.tic("some-metric");
        testcase.toc("some-metric");
        check_counters({ 1, 1, 0 });
        testcase.tic("some-other-metric");
        check_counters({ 1, 1, 0 });
    }

    SECTION("metrics")
    {
        SECTION("tictoc")
        {
            CHECK_NOTHROW(testcase.tic("some-key"));
            CHECK_NOTHROW(testcase.toc("some-key"));
            CHECK(testcase.metrics().size() == 1);
            CHECK(testcase.metrics().count("some-key"));
        }

        SECTION("add_metric")
        {
            CHECK_NOTHROW(testcase.add_metric("some-key", 1000));
            CHECK(testcase.metrics().size() == 1);
            REQUIRE(testcase.metrics().count("some-key"));
            const auto metric = testcase.metrics().at("some-key");
            CHECK(touca::types::ValueType::Number == metric.value->type());
            CHECK(metric.value->string() == "1000");
        }

        SECTION("unexpected-use: tic without toc")
        {
            CHECK_NOTHROW(testcase.tic("some-key"));
            CHECK_NOTHROW(testcase.metrics());
            CHECK(testcase.metrics().empty());
        }

        SECTION("unexpected-use: toc without tic")
        {
            CHECK_THROWS_AS(testcase.toc("some-key"), std::invalid_argument);
            CHECK_THROWS_WITH(
                testcase.toc("some-key"),
                "timer was never started for given key");
        }

        SECTION("kitchen-sink")
        {
            CHECK(testcase.metrics().empty());
            REQUIRE_NOTHROW(testcase.tic("a"));
            REQUIRE_NOTHROW(testcase.tic("a"));
            CHECK(testcase.metrics().empty());
            CHECK_THROWS_AS(testcase.toc("b"), std::invalid_argument);
            REQUIRE_NOTHROW(testcase.tic("b"));
            CHECK(testcase.metrics().empty());
            REQUIRE_NOTHROW(testcase.toc("b"));
            CHECK_FALSE(testcase.metrics().empty());
            CHECK_FALSE(testcase.metrics().count("a"));
            CHECK(testcase.metrics().size() == 1);
            CHECK(testcase.metrics().count("b"));
            const auto metric = testcase.metrics().at("b");
            CHECK(touca::types::ValueType::Number == metric.value->type());
        }
    }

    SECTION("compare: empty")
    {
        const auto& dst = std::make_shared<touca::Testcase>("team", "suite", "version", "case");
        CHECK_NOTHROW(testcase.compare(dst));
        const auto& cmp = testcase.compare(dst);
        const auto& output = make_json([&cmp](touca::RJAllocator& allocator) { return cmp.json(allocator); });
        const auto& check1 = R"("assertions":{"commonKeys":[],"missingKeys":[],"newKeys":[]})";
        const auto& check2 = R"("results":{"commonKeys":[],"missingKeys":[],"newKeys":[]})";
        const auto& check3 = R"("metrics":{"commonKeys":[],"missingKeys":[],"newKeys":[]})";
        CHECK_THAT(output, Catch::Contains(check1));
        CHECK_THAT(output, Catch::Contains(check2));
        CHECK_THAT(output, Catch::Contains(check3));
    }

    SECTION("compare: full")
    {
        auto dst = std::make_shared<touca::Testcase>("team", "suite", "version", "case");

        const auto value1 = std::make_shared<touca::types::String>("leo-ferre");
        const auto value2 = std::make_shared<touca::types::String>("jean-ferrat");
        const auto value3 = std::make_shared<touca::types::Bool>(true);
        const auto value4 = std::make_shared<touca::types::Bool>(true);

        // common result
        testcase.add_array_element("chanteur", value1);
        dst->add_array_element("chanteur", value2);
        // different result
        testcase.add_hit_count("some-key");
        dst->add_hit_count("some-other-key");

        testcase.tic("a");
        testcase.toc("a");
        testcase.tic("b");
        testcase.toc("b");
        dst->tic("a");
        dst->toc("a");
        dst->tic("c");
        dst->toc("c");

        CHECK_NOTHROW(testcase.compare(dst));
        const auto& cmp = testcase.compare(dst);
        CHECK(cmp.overview().keysCountCommon == 1);
        CHECK(cmp.overview().keysCountFresh == 1);
        CHECK(cmp.overview().keysCountMissing == 1);
        CHECK(cmp.overview().metricsCountCommon == 1);
        CHECK(cmp.overview().keysCountCommon == 1);
        CHECK(cmp.overview().keysCountFresh == 1);
        CHECK(cmp.overview().keysCountMissing == 1);

        const auto& comparison = make_json([&cmp](touca::RJAllocator& allocator) { return cmp.json(allocator); });
        const auto& check1 = R"("assertions":{"commonKeys":[],"missingKeys":[],"newKeys":[]})";
        const auto& check2 = R"("results":{"commonKeys":[{"name":"chanteur","score":0.0,"srcType":"array","srcValue":"[\"leo-ferre\"]","dstValue":"[\"jean-ferrat\"]"}],"missingKeys":[{"name":"some-other-key","dstType":"number","dstValue":"1"}],"newKeys":[{"name":"some-key","srcType":"number","srcValue":"1"}]})";
        const auto& check3 = R"("metrics":{"commonKeys":[{"name":"a","score":1.0,"srcType":"number","srcValue":"0"}],"missingKeys":[{"name":"c","dstType":"number","dstValue":"0"}],"newKeys":[{"name":"b","srcType":"number","srcValue":"0"}]})";
        CHECK_THAT(comparison, Catch::Contains(check1));
        CHECK_THAT(comparison, Catch::Contains(check2));
        CHECK_THAT(comparison, Catch::Contains(check3));

        const auto& overview = make_json([&cmp](touca::RJAllocator& allocator) { return cmp.overview().json(allocator); });
        const auto& check4 = R"({"keysCountCommon":1,"keysCountFresh":1,"keysCountMissing":1,"keysScore":0.0,"metricsCountCommon":1,"metricsCountFresh":1,"metricsCountMissing":1,"metricsDurationCommonDst":0,"metricsDurationCommonSrc":0})";
        CHECK_THAT(overview, Catch::Contains(check4));
    }
}
