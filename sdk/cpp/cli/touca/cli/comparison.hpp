// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <numeric>

#include "touca/core/testcase.hpp"
#include "touca/core/comparison.hpp"

namespace touca {

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
 * @param common comparison results of all testcases shared between
 *             the two `ResultFile` objects.
 */
struct TOUCA_CLIENT_API ElementsMapComparison {
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

TOUCA_CLIENT_API TypeComparison compare(const data_point& src,
                                        const data_point& dst);

TOUCA_CLIENT_API TestcaseComparison compare(const Testcase& src,
                                            const Testcase& dst);

TOUCA_CLIENT_API ElementsMapComparison compare(const ElementsMap& src,
                                               const ElementsMap& dst);

TOUCA_CLIENT_API std::map<std::string, data_point> flatten(
    const data_point& input);

}  // namespace touca
