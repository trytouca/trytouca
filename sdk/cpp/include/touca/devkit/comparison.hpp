// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <numeric>
#include <unordered_map>

#include "nlohmann/json_fwd.hpp"
#include "touca/core/testcase.hpp"
#include "touca/core/types.hpp"

namespace touca {

using ComparisonMap = std::unordered_map<std::string, TypeComparison>;

enum class Category { Common, Missing, Fresh };

struct Cellar {
  ComparisonMap common;
  KeyMap missing;
  KeyMap fresh;

  nlohmann::ordered_json json() const;

 private:
  std::string stringify(const internal_type type) const;

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

}  // namespace touca
