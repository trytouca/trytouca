// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <numeric>
#include <unordered_map>

#include "nlohmann/json_fwd.hpp"
#include "touca/core/types.hpp"
#include "touca/devkit/testcase.hpp"

namespace touca {
namespace compare {

/**
 * @enum touca::compare::MatchType
 * @brief describes overall result of comparing two testcases
 */
enum class MatchType : unsigned char {
  Perfect, /**< Indicates that compared objects were identical */
  None     /**< Indicates that compared objects were different */
};

struct TOUCA_CLIENT_API TypeComparison {
  std::string srcValue;
  std::string dstValue;
  types::value_t srcType = types::value_t::unknown;
  types::value_t dstType = types::value_t::unknown;
  double score = 0.0;
  std::set<std::string> desc;
  MatchType match = MatchType::None;
};

using ComparisonMap = std::unordered_map<std::string, TypeComparison>;

enum class Category { Common, Missing, Fresh };

struct Cellar {
  ComparisonMap common;
  KeyMap missing;
  KeyMap fresh;

  nlohmann::ordered_json json() const;

 private:
  std::string stringify(const types::value_t type) const;

  nlohmann::ordered_json buildJsonSolo(const KeyMap& elements,
                                       const Category category) const;

  nlohmann::ordered_json buildJsonCommon(const ComparisonMap& elements) const;
};

class TOUCA_CLIENT_API TestcaseComparison {
 public:
  struct TOUCA_CLIENT_API Overview {
    std::int32_t keysCountCommon;
    std::int32_t keysCountFresh;
    std::int32_t keysCountMissing;
    double keysScore;
    std::int32_t metricsCountCommon;
    std::int32_t metricsCountFresh;
    std::int32_t metricsCountMissing;
    std::int32_t metricsDurationCommonDst;
    std::int32_t metricsDurationCommonSrc;

    /**
     *
     */
    nlohmann::ordered_json json() const;
  };

  TestcaseComparison(const Testcase& src, const Testcase& dst);

  nlohmann::ordered_json json() const;

  Overview overview() const;

 private:
  double scoreResults() const;

  void compare();

  void initCellar(const ResultsMap& src, const ResultsMap& dst,
                  const ResultCategory& type, Cellar& result);

  void initCellar(const MetricsMap& src, const MetricsMap& dst, Cellar& result);

  void initMetadata(const Testcase& tc, Testcase::Metadata& meta);

  // metadata
  Testcase::Metadata _srcMeta;
  Testcase::Metadata _dstMeta;
  // containers to hold comparison results
  Cellar _assumptions;
  Cellar _results;
  Cellar _metrics;
  // pointers to testcases we are comparing
  const Testcase& _src;
  const Testcase& _dst;
};

}  // namespace compare
}  // namespace touca
