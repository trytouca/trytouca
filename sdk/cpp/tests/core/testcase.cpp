// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/core/testcase.hpp"

#include <array>

#include "catch2/catch.hpp"
#include "tests/core/shared.hpp"
#include "touca/core/comparison.hpp"

using touca::data_point;
using touca::detail::internal_type;

TEST_CASE("Testcase") {
  touca::Testcase testcase =
      touca::Testcase("some-team", "some-suite", "some-version", "some-case");

  SECTION("metadata") {
    CHECK_NOTHROW(testcase.metadata());
    const auto& meta = testcase.metadata();
    CHECK(meta.teamslug == "some-team");
    CHECK(meta.testsuite == "some-suite");
    CHECK(meta.version == "some-version");
    CHECK(meta.testcase == "some-case");
    CHECK(meta.describe() == "some-team/some-suite/some-version/some-case");
  }

  SECTION("assume") {
    const auto value = data_point::boolean(true);
    testcase.assume("some-key", value);
    testcase.assume("some-other-key", value);
    CHECK_NOTHROW(testcase.assume("some-key", value));
  }

  SECTION("add_hit_count") {
    SECTION("expected-use") {
      testcase.add_hit_count("some-key");
      testcase.add_hit_count("some-other-key");
      testcase.add_hit_count("some-key");
      const auto expected =
          R"("results":[{"key":"some-key","value":"2"},{"key":"some-other-key","value":"1"}])";
      const auto output = make_json([&testcase](touca::RJAllocator& allocator) {
        return testcase.json(allocator);
      });
      REQUIRE_THAT(output, Catch::Contains(expected));
    }

    SECTION("unexpected-use: key is already used to store boolean") {
      const auto value = data_point::boolean(true);
      testcase.check("some-key", value);
      CHECK_THROWS_AS(testcase.add_hit_count("some-key"),
                      std::invalid_argument);
      CHECK_THROWS_WITH(testcase.add_hit_count("some-key"),
                        Catch::Contains("different type"));
      CHECK_NOTHROW(testcase.add_hit_count("some-other-key"));
    }

    SECTION("unexpected-use: key is already used to store float") {
      const auto value = data_point::number_float(1.0f);
      testcase.check("some-key", value);
      CHECK_THROWS_AS(testcase.add_hit_count("some-key"),
                      std::invalid_argument);
      CHECK_THROWS_WITH(testcase.add_hit_count("some-key"),
                        Catch::Contains("different type"));
      CHECK_NOTHROW(testcase.add_hit_count("some-other-key"));
    }
  }

  SECTION("add_array_element") {
    SECTION("expected-use") {
      for (auto i = 0; i < 3; ++i) {
        const auto value = data_point::number_unsigned(i);
        testcase.add_array_element("some-key", value);
      }
      const auto expected =
          R"("results":[{"key":"some-key","value":"[0,1,2]"}])";
      const auto output = make_json([&testcase](touca::RJAllocator& allocator) {
        return testcase.json(allocator);
      });
      REQUIRE_THAT(output, Catch::Contains(expected));
    }
    SECTION("unexpected-use") {
      const auto someBool = data_point::boolean(true);
      const auto someNumber = data_point::number_unsigned(1);
      testcase.check("some-key", someBool);
      CHECK_THROWS_AS(testcase.add_array_element("some-key", someNumber),
                      std::invalid_argument);
      CHECK_THROWS_WITH(testcase.add_array_element("some-key", someNumber),
                        Catch::Contains("different type"));
      CHECK_NOTHROW(testcase.check("some-key", someBool));
      CHECK_NOTHROW(testcase.check("some-other-key", someNumber));
    }
  }

  /**
   * Calling `clear` for a testcase removes all results, assertions and
   * metrics associated with it.
   */
  SECTION("clear") {
    const auto value = data_point::boolean(true);
    testcase.check("some-key", value);
    testcase.assume("some-other-key", value);
    testcase.tic("some-metric");
    testcase.add_hit_count("some-new-key");
    testcase.toc("some-metric");
    testcase.add_array_element("some-array", value);

    const auto before = make_json([&testcase](touca::RJAllocator& allocator) {
      return testcase.json(allocator);
    });
    testcase.clear();
    const auto after = make_json([&testcase](touca::RJAllocator& allocator) {
      return testcase.json(allocator);
    });

    const auto check1 =
        R"("results":[{"key":"some-array","value":"[true]"},{"key":"some-key","value":"true"},{"key":"some-new-key","value":"1"}])";
    const auto check2 =
        R"("assertion":[{"key":"some-other-key","value":"true"}])";
    const auto check3 = R"("metrics":[{"key":"some-metric","value":"0"}])";
    const auto check4 = R"("results":[],"assertion":[],"metrics":[])";
    CHECK_THAT(before, Catch::Contains(check1));
    CHECK_THAT(before, Catch::Contains(check2));
    CHECK_THAT(before, Catch::Contains(check3));
    CHECK_THAT(after, Catch::Contains(check4));
  }

  SECTION("overview") {
    const auto value = data_point::boolean(true);
    const auto check_counters =
        [&testcase](const std::array<int32_t, 3>& counters) {
          CHECK(testcase.overview().keysCount == counters[0]);
          CHECK(testcase.overview().metricsCount == counters[1]);
          CHECK(testcase.overview().metricsDuration == counters[2]);
        };
    check_counters({0, 0, 0});
    testcase.check("some-key", value);
    check_counters({1, 0, 0});
    testcase.tic("some-metric");
    testcase.toc("some-metric");
    check_counters({1, 1, 0});
    testcase.tic("some-other-metric");
    check_counters({1, 1, 0});
  }

  SECTION("metrics") {
    SECTION("tictoc") {
      CHECK_NOTHROW(testcase.tic("some-key"));
      CHECK_NOTHROW(testcase.toc("some-key"));
      CHECK(testcase.metrics().size() == 1);
      CHECK(testcase.metrics().count("some-key"));
    }

    SECTION("add_metric") {
      CHECK_NOTHROW(testcase.add_metric("some-key", 1000));
      CHECK(testcase.metrics().size() == 1);
      REQUIRE(testcase.metrics().count("some-key"));
      const auto metric = testcase.metrics().at("some-key");
      CHECK(internal_type::number_signed == metric.value.type());
      CHECK(metric.value.to_string() == "1000");
    }

    SECTION("unexpected-use: tic without toc") {
      CHECK_NOTHROW(testcase.tic("some-key"));
      CHECK_NOTHROW(testcase.metrics());
      CHECK(testcase.metrics().empty());
    }

    SECTION("unexpected-use: toc without tic") {
      CHECK_THROWS_AS(testcase.toc("some-key"), std::invalid_argument);
      CHECK_THROWS_WITH(testcase.toc("some-key"),
                        "timer was never started for given key");
    }

    SECTION("kitchen-sink") {
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
      CHECK(internal_type::number_signed == metric.value.type());
    }
  }
}
