// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <chrono>
#include <map>
#include <unordered_map>

#include "nlohmann/json_fwd.hpp"
#include "touca/core/types.hpp"
#include "touca/lib_api.hpp"

namespace touca {
class ClientImpl;
class TestcaseComparison;

enum class ResultCategory { Check = 1, Assert };

struct MetricsMapValue {
  std::shared_ptr<IType> value;
};

struct ResultEntry {
  std::shared_ptr<IType> val;
  ResultCategory typ;
};

using MetricsMap = std::map<std::string, MetricsMapValue>;
using ResultsMap = std::map<std::string, ResultEntry>;

/**
 * Assumptions map has the same characteristics as the results map,
 * however, the information stored in an assumptions map is handled
 * slightly differently by the Touca server.
 */
class TOUCA_CLIENT_API Testcase {
  friend class ClientImpl;
  friend class TestcaseComparison;

 public:
  struct TOUCA_CLIENT_API Overview {
    std::int32_t keysCount = 0;
    std::int32_t metricsCount = 0;
    std::int32_t metricsDuration = 0;

    /**
     *
     */
    nlohmann::ordered_json json() const;
  };

  struct TOUCA_CLIENT_API Metadata {
    std::string teamslug;
    std::string testsuite;
    std::string version;
    std::string testcase;
    std::string builtAt;

    /**
     *
     */
    std::string describe() const;

    /**
     *
     */
    nlohmann::ordered_json json() const;
  };

  Testcase(const Metadata& meta, const ResultsMap& results,
           const std::unordered_map<std::string, unsigned long>& metrics);

  Testcase(const std::string& teamslug, const std::string& testsuite,
           const std::string& version, const std::string& name);

  void tic(const std::string& key);

  void toc(const std::string& key);

  void check(const std::string& key, const std::shared_ptr<IType>& value);

  void assume(const std::string& key, const std::shared_ptr<IType>& value);

  void add_array_element(const std::string& key,
                         const std::shared_ptr<IType>& value);

  void add_hit_count(const std::string& key);

  void add_metric(const std::string& key, const unsigned duration);

  /**
   * Removes all assumptions, checks and metrics that have been
   * associated with this testcase.
   */
  void clear();

  MetricsMap metrics() const;

  nlohmann::ordered_json json() const;

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

}  // namespace touca
