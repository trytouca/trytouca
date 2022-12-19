// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/cli/comparison.hpp"

#include "catch2/catch.hpp"
#include "tests/core/shared.hpp"

using touca::data_point;
using touca::detail::internal_type;

TEST_CASE("Testcase Serialization") {
  touca::Testcase testcase =
      touca::Testcase("some-team", "some-suite", "some-version", "some-case");

  SECTION("compare: empty") {
    const auto& dst =
        std::make_shared<touca::Testcase>("team", "suite", "version", "case");
    touca::TestcaseComparison cmp(testcase, *dst);
    const auto& output = make_json(
        [&cmp](touca::RJAllocator& allocator) { return cmp.json(allocator); });
    const auto& check1 =
        R"("assertions":{"commonKeys":[],"missingKeys":[],"newKeys":[]})";
    const auto& check2 =
        R"("results":{"commonKeys":[],"missingKeys":[],"newKeys":[]})";
    const auto& check3 =
        R"("metrics":{"commonKeys":[],"missingKeys":[],"newKeys":[]})";
    CHECK_THAT(output, Catch::Contains(check1));
    CHECK_THAT(output, Catch::Contains(check2));
    CHECK_THAT(output, Catch::Contains(check3));
  }

  SECTION("compare: full") {
    auto dst =
        std::make_shared<touca::Testcase>("team", "suite", "version", "case");

    const auto value1 = data_point::string("leo-ferre");
    const auto value2 = data_point::string("jean-ferrat");
    const auto value3 = data_point::boolean(true);
    const auto value4 = data_point::boolean(true);

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

    touca::TestcaseComparison cmp(testcase, *dst);
    CHECK(cmp.overview().keysCountCommon == 1);
    CHECK(cmp.overview().keysCountFresh == 1);
    CHECK(cmp.overview().keysCountMissing == 1);
    CHECK(cmp.overview().metricsCountCommon == 1);
    CHECK(cmp.overview().keysCountCommon == 1);
    CHECK(cmp.overview().keysCountFresh == 1);
    CHECK(cmp.overview().keysCountMissing == 1);

    const auto& comparison = make_json(
        [&cmp](touca::RJAllocator& allocator) { return cmp.json(allocator); });
    const auto& check1 =
        R"("assertions":{"commonKeys":[],"missingKeys":[],"newKeys":[]})";
    const auto& check2 =
        R"("results":{"commonKeys":[{"name":"chanteur","score":0.0,"srcType":"array","srcValue":"[\"leo-ferre\"]","dstValue":"[\"jean-ferrat\"]"}],"missingKeys":[{"name":"some-other-key","dstType":"number","dstValue":"1"}],"newKeys":[{"name":"some-key","srcType":"number","srcValue":"1"}]})";
    const auto& check3 =
        R"("metrics":{"commonKeys":[{"name":"a","score":1.0,"srcType":"number","srcValue":"0"}],"missingKeys":[{"name":"c","dstType":"number","dstValue":"0"}],"newKeys":[{"name":"b","srcType":"number","srcValue":"0"}]})";
    CHECK_THAT(comparison, Catch::Contains(check1));
    CHECK_THAT(comparison, Catch::Contains(check2));
    CHECK_THAT(comparison, Catch::Contains(check3));

    const auto& overview = make_json([&cmp](touca::RJAllocator& allocator) {
      return cmp.overview().json(allocator);
    });
    const auto& check4 =
        R"({"keysCountCommon":1,"keysCountFresh":1,"keysCountMissing":1,"keysScore":0.0,"metricsCountCommon":1,"metricsCountFresh":1,"metricsCountMissing":1,"metricsDurationCommonDst":0,"metricsDurationCommonSrc":0})";
    CHECK_THAT(overview, Catch::Contains(check4));
  }
}
