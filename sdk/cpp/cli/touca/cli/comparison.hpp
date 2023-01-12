// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <map>
#include <numeric>
#include <set>
#include <string>
#include <unordered_map>

#include "rapidjson/fwd.h"
#include "touca/cli_lib_api.hpp"
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

struct TOUCA_CLI_API TypeComparison {
  std::string srcValue;
  std::string dstValue;
  touca::detail::internal_type srcType = touca::detail::internal_type::unknown;
  touca::detail::internal_type dstType = touca::detail::internal_type::unknown;
  double score = 0.0;
  std::set<std::string> desc;
  MatchType match = MatchType::None;
};

struct TOUCA_CLI_API Cellar {
  using ComparisonMap = std::unordered_map<std::string, TypeComparison>;
  using KeyMap = std::map<std::string, data_point>;
  enum class Category { Common, Missing, Fresh };

  ComparisonMap common;
  KeyMap missing;
  KeyMap fresh;

  rapidjson::Value json(RJAllocator& allocator) const;

 private:
  std::string stringify(const touca::detail::internal_type type) const;

  rapidjson::Value build_json_solo(const KeyMap& elements,
                                   const Category category,
                                   RJAllocator& allocator) const;

  rapidjson::Value build_json_common(const ComparisonMap& elements,
                                     RJAllocator& allocator) const;
};

class TOUCA_CLI_API TestcaseComparison {
 public:
  struct TOUCA_CLI_API Overview {
    double keysScore;
    std::int32_t keysCountCommon;
    std::int32_t keysCountFresh;
    std::int32_t keysCountMissing;
    std::int32_t metricsCountCommon;
    std::int32_t metricsCountFresh;
    std::int32_t metricsCountMissing;
    std::int32_t metricsDurationCommonDst;
    std::int32_t metricsDurationCommonSrc;

    rapidjson::Value json(RJAllocator& allocator) const;
  };

  explicit TestcaseComparison(const Testcase& src, const Testcase& dst);

  rapidjson::Value json(RJAllocator& allocator) const;

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

/**
 * @brief represents output of comparing two elements maps.
 *
 * @param fresh testcases missing from object compared with
 * @param missing testcases missing from object compared against
 * @param common comparison results of the common testcases
 */
struct TOUCA_CLI_API ElementsMapComparison {
  ElementsMap fresh;
  ElementsMap missing;
  std::map<std::string, TestcaseComparison> common;

  /**
   * @brief provides description of this object in json format.
   *
   * @return string representation of the comparison result
   *         between two result files in json format
   */
  std::string json() const;
};

TOUCA_CLI_API TypeComparison compare(const data_point& src,
                                     const data_point& dst);

TOUCA_CLI_API TestcaseComparison compare(const Testcase& src,
                                         const Testcase& dst);

TOUCA_CLI_API ElementsMapComparison compare(const ElementsMap& src,
                                            const ElementsMap& dst);

TOUCA_CLI_API std::map<std::string, data_point> flatten(
    const data_point& input);

}  // namespace touca
