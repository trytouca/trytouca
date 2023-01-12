// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <chrono>
#include <map>
#include <unordered_map>

#include "rapidjson/fwd.h"
#include "touca/core/types.hpp"
#include "touca/lib_api.hpp"

namespace touca {
class ClientImpl;
class TestcaseComparison;

enum class ResultCategory { Check = 1, Assert };

struct MetricsMapValue {
  data_point value;
};

struct ResultEntry {
  data_point val;
  ResultCategory typ;
};

using MetricsMap = std::map<std::string, MetricsMapValue>;
using ResultsMap = std::map<std::string, ResultEntry>;

class TOUCA_CLIENT_API Testcase {
  friend class ClientImpl;
  friend class TestcaseComparison;

 public:
  struct TOUCA_CLIENT_API Overview {
    std::int32_t keysCount = 0;
    std::int32_t metricsCount = 0;
    std::int32_t metricsDuration = 0;

    rapidjson::Value json(RJAllocator& allocator) const;
  };

  struct TOUCA_CLIENT_API Metadata {
    std::string teamslug;
    std::string testsuite;
    std::string version;
    std::string testcase;
    std::string builtAt;

    std::string describe() const;

    rapidjson::Value json(RJAllocator& allocator) const;
  };

  Testcase(const Metadata& meta, const ResultsMap& results,
           const std::unordered_map<std::string,
                                    touca::detail::number_unsigned_t>& metrics);

  Testcase(const std::string& teamslug, const std::string& testsuite,
           const std::string& version, const std::string& name);

  void tic(const std::string& key);

  void toc(const std::string& key);

  void check(const std::string& key, const data_point& value);

  void assume(const std::string& key, const data_point& value);

  void add_array_element(const std::string& key, const data_point& value);

  void add_hit_count(const std::string& key);

  void add_metric(const std::string& key, const unsigned duration);

  /**
   * Removes all assumptions, checks and metrics that have been
   * associated with this testcase.
   */
  void clear();

  MetricsMap metrics() const;

  rapidjson::Value json(RJAllocator& allocator) const;

  std::vector<uint8_t> flatbuffers() const;

  Metadata metadata() const;

  void setMetadata(const Metadata& metadata);

  Overview overview() const;

  /**
   * Converts a given list of `Testcase` objects to serialized binary
   * data compliant with Touca flatbuffers schema.
   *
   * @param testcases list of `Testcase` objects to be serialized
   * @return serialized binary data in flatbuffers format
   */
  static std::vector<uint8_t> serialize(const std::vector<Testcase>& testcases);

 private:
  bool _posted;
  Metadata _metadata;
  ResultsMap _resultsMap;

  std::unordered_map<std::string, std::chrono::system_clock::time_point> _tics;
  std::unordered_map<std::string, std::chrono::system_clock::time_point> _tocs;
};

using ElementsMap = std::unordered_map<std::string, std::shared_ptr<Testcase>>;

TOUCA_CLIENT_API std::string elements_map_to_json(
    const ElementsMap& elements_map);

}  // namespace touca
