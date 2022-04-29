// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <map>
#include <numeric>
#include <set>
#include <unordered_map>

#include "nlohmann/json_fwd.hpp"
#include "touca/core/testcase.hpp"
#include "touca/core/types.hpp"

namespace touca {

/**
 * @enum touca::MatchType
 * @brief describes overall result of comparing two testcases
 */
enum class MatchType : unsigned char {
  Perfect, /**< Indicates that compared objects were identical */
  None     /**< Indicates that compared objects were different */
};

struct TOUCA_CLIENT_API TypeComparison {
  std::string srcValue;
  std::string dstValue;
  detail::internal_type srcType = detail::internal_type::unknown;
  detail::internal_type dstType = detail::internal_type::unknown;
  double score = 0.0;
  std::set<std::string> desc;
  MatchType match = MatchType::None;
};

struct Cellar {
  using ComparisonMap = std::unordered_map<std::string, TypeComparison>;
  using KeyMap = std::map<std::string, data_point>;
  enum class Category { Common, Missing, Fresh };

  ComparisonMap common;
  KeyMap missing;
  KeyMap fresh;

  nlohmann::ordered_json json() const;

 private:
  std::string stringify(const detail::internal_type type) const;

  nlohmann::ordered_json build_json_solo(const KeyMap& elements,
                                         const Category category) const;

  nlohmann::ordered_json build_json_common(const std::string& key,
                                           const TypeComparison& second) const;
};

class TOUCA_CLIENT_API TestcaseComparison {
 public:
  struct TOUCA_CLIENT_API Overview {
    double keysScore;
    std::int32_t keysCountCommon;
    std::int32_t keysCountFresh;
    std::int32_t keysCountMissing;
    std::int32_t metricsCountCommon;
    std::int32_t metricsCountFresh;
    std::int32_t metricsCountMissing;
    std::int32_t metricsDurationCommonDst;
    std::int32_t metricsDurationCommonSrc;

    nlohmann::ordered_json json() const;
  };

  explicit TestcaseComparison(const Testcase& src, const Testcase& dst);

  nlohmann::ordered_json json() const;

  Overview overview() const;

 private:
  double score_results() const;

  void init_cellar(const ResultsMap& src, const ResultsMap& dst,
                   const ResultCategory& type, Cellar& result);

  void init_cellar(const MetricsMap& src, const MetricsMap& dst,
                   Cellar& result);

  void init_metadata(const Testcase& tc, Testcase::Metadata& meta);

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

TOUCA_CLIENT_API TypeComparison compare(const data_point& src,
                                        const data_point& dst);

TOUCA_CLIENT_API TestcaseComparison compare(const Testcase& src,
                                            const Testcase& dst);

TOUCA_CLIENT_API std::map<std::string, data_point> flatten(
    const data_point& input);

}  // namespace touca
