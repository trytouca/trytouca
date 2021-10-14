// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/devkit/comparison.hpp"

#include <chrono>

#include "nlohmann/json.hpp"

namespace touca {
namespace compare {

std::string Cellar::stringify(const types::value_t type) const {
  using vt = types::value_t;
  const std::unordered_map<types::value_t, std::string> store = {
      {vt::boolean, "bool"},
      {vt::numeric, "number"},
      {vt::string, "string"},
      {vt::array, "array"},
      {vt::object, "object"}};
  if (store.count(type)) {
    return store.at(type);
  }
  return "unknown";
}

nlohmann::ordered_json Cellar::json() const {
  auto rjCommon = buildJsonCommon(common);
  auto rjMissing = buildJsonSolo(missing, Category::Missing);
  auto rjFresh = buildJsonSolo(fresh, Category::Fresh);
  return nlohmann::ordered_json({
      {"commonKeys", rjCommon},
      {"missingKeys", rjMissing},
      {"newKeys", rjFresh},
  });
}

nlohmann::ordered_json Cellar::buildJsonSolo(const KeyMap& keyMap,
                                             const Category category) const {
  nlohmann::ordered_json elements = nlohmann::json::array();
  for (const auto& kv : keyMap) {
    const auto& type = stringify(kv.second->type());
    elements.push_back(nlohmann::ordered_json(
        {{"name", kv.first},
         {category == Category::Fresh ? "srcType" : "dstType", type},
         {category == Category::Fresh ? "srcValue" : "dstValue",
          kv.second->string()}}));
  }
  return elements;
}

nlohmann::ordered_json Cellar::buildJsonCommon(
    const ComparisonMap& elements) const {
  nlohmann::ordered_json output = nlohmann::json::array();
  for (const auto& kv : elements) {
    nlohmann::ordered_json item({
        {"name", kv.first},
        {"score", kv.second.score},
        {"srcType", stringify(kv.second.srcType)},
        {"srcValue", kv.second.srcValue},
    });
    if (types::value_t::unknown != kv.second.dstType) {
      item["dstType"] = stringify(kv.second.dstType);
    }
    if (compare::MatchType::Perfect != kv.second.match) {
      item["dstValue"] = kv.second.dstValue;
    }
    if (!kv.second.desc.empty()) {
      item["desc"] = kv.second.desc;
    }
    output.push_back(item);
  }
  return output;
}

TestcaseComparison::TestcaseComparison(const Testcase& src, const Testcase& dst)
    : _src(src), _dst(dst) {
  compare();
}

nlohmann::ordered_json TestcaseComparison::Overview::json() const {
  return nlohmann::ordered_json({
      {"keysCountCommon", keysCountCommon},
      {"keysCountFresh", keysCountFresh},
      {"keysCountMissing", keysCountMissing},
      {"keysScore", keysScore},
      {"metricsCountCommon", metricsCountCommon},
      {"metricsCountFresh", metricsCountFresh},
      {"metricsCountMissing", metricsCountMissing},
      {"metricsDurationCommonDst", metricsDurationCommonDst},
      {"metricsDurationCommonSrc", metricsDurationCommonSrc},
  });
}

nlohmann::ordered_json TestcaseComparison::json() const {
  return nlohmann::ordered_json({{"src", _srcMeta.json()},
                                 {"dst", _dstMeta.json()},
                                 {"assertions", _assumptions.json()},
                                 {"results", _results.json()},
                                 {"metrics", _metrics.json()}});
}

double TestcaseComparison::scoreResults() const {
  using pair_t = std::pair<std::string, TypeComparison>;
  const auto& op = [](const double t, const pair_t& item) {
    return t + item.second.score;
  };
  const auto sum =
      std::accumulate(_results.common.begin(), _results.common.end(), 0.0, op);

  // if the two cases have no keys in common, report a score of one
  // if dst has no keys at all and a score of zero if src is missing
  // some keys.
  if (_results.common.empty()) {
    return _results.missing.empty() ? 1.0 : 0.0;
  }

  const auto count = _results.common.size() + _results.missing.size();
  return sum / count;
}

TestcaseComparison::Overview TestcaseComparison::overview() const {
  Overview output;

  const auto count = [](const size_t size) {
    return static_cast<std::int32_t>(size);
  };

  output.keysCountCommon = count(_results.common.size());
  output.keysCountFresh = count(_results.fresh.size());
  output.keysCountMissing = count(_results.missing.size());
  output.keysScore = scoreResults();

  output.metricsCountCommon = count(_metrics.common.size());
  output.metricsCountFresh = count(_metrics.fresh.size());
  output.metricsCountMissing = count(_metrics.missing.size());

  const auto getTotalCommonDuration = [this](const Testcase& tc) {
    namespace chr = std::chrono;
    std::int32_t duration = 0u;
    for (const auto& kvp : _metrics.common) {
      const auto& diff = tc._tocs.at(kvp.first) - tc._tics.at(kvp.first);
      duration += static_cast<std::int32_t>(
          chr::duration_cast<chr::milliseconds>(diff).count());
    }
    return duration;
  };

  output.metricsDurationCommonSrc = getTotalCommonDuration(_src);
  output.metricsDurationCommonDst = getTotalCommonDuration(_dst);

  return output;
}

void TestcaseComparison::compare() {
  // initialize metadata
  _srcMeta = _src.metadata();
  _dstMeta = _dst.metadata();
  // perform comparisons on assumptions
  initCellar(_src._resultsMap, _dst._resultsMap, ResultCategory::Assert,
             _assumptions);
  initCellar(_src._resultsMap, _dst._resultsMap, ResultCategory::Check,
             _results);
  initCellar(_src.metrics(), _dst.metrics(), _metrics);
}

void TestcaseComparison::initCellar(const ResultsMap& src,
                                    const ResultsMap& dst,
                                    const ResultCategory& type,
                                    Cellar& result) {
  for (const auto& kv : dst) {
    if (kv.second.typ != type) {
      continue;
    }
    const auto& key = kv.first;
    if (src.count(key)) {
      const auto value = src.at(key).val->compare(kv.second.val);
      result.common.emplace(key, value);
      continue;
    }
    result.missing.emplace(key, kv.second.val);
  }
  for (const auto& kv : src) {
    if (kv.second.typ != type) {
      continue;
    }
    const auto& key = kv.first;
    if (!dst.count(key)) {
      result.fresh.emplace(key, kv.second.val);
    }
  }
}

void TestcaseComparison::initCellar(const MetricsMap& src,
                                    const MetricsMap& dst, Cellar& result) {
  for (const auto& kv : dst) {
    const auto& key = kv.first;
    if (src.count(key)) {
      const auto value = src.at(key).value->compare(kv.second.value);
      result.common.emplace(key, value);
      continue;
    }
    result.missing.emplace(key, kv.second.value);
  }
  for (const auto& kv : src) {
    const auto& key = kv.first;
    if (!dst.count(key)) {
      result.fresh.emplace(key, kv.second.value);
    }
  }
}

}  // namespace compare
}  // namespace touca
