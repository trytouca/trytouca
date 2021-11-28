// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/devkit/comparison.hpp"

#include <chrono>

#include "nlohmann/json.hpp"
#include "touca/core/filesystem.hpp"

namespace touca {

std::map<std::string, data_point> flatten(const data_point& input) {
  std::map<std::string, data_point> entries;
  if (input._type == detail::internal_type::array) {
    for (unsigned i = 0; i < (*input._value.array).size(); ++i) {
      const auto& value = (*input._value.array).at(i);
      const auto& name = '[' + std::to_string(i) + ']';
      const auto& nestedMembers = flatten(value);
      if (nestedMembers.empty()) {
        entries.emplace(name, value);
        continue;
      }
      for (const auto& nestedMember : nestedMembers) {
        const auto& key = name + nestedMember.first;
        entries.emplace(key, nestedMember.second);
      }
    }
  } else if (input._type == detail::internal_type::object) {
    for (const auto& value : *input._value.object) {
      const auto& name = value.first;
      const auto& nestedMembers = flatten(value.second);
      if (nestedMembers.empty()) {
        entries.emplace(name, value.second);
        continue;
      }
      for (const auto& nestedMember : nestedMembers) {
        const auto& key = name + '.' + nestedMember.first;
        entries.emplace(key, nestedMember.second);
      }
    }
  }
  return entries;
}

std::vector<data_point> flatten_array(
    const std::map<std::string, data_point>& elements) {
  std::vector<data_point> data_points;
  data_points.reserve(elements.size());
  for (const auto& element : elements) {
    data_points.emplace_back(element.second);
  }
  return data_points;
}

template <typename T>
void compare_number(const T& src_number, const T& dst_number,
                    TypeComparison& cmp) {
  if (src_number == dst_number) {
    cmp.match = MatchType::Perfect;
    cmp.score = 1.0;
    return;
  }
  const auto threshold = 0.2;
  const auto src_value = static_cast<double>(src_number);
  const auto dst_value = static_cast<double>(dst_number);
  const auto diff = src_value - dst_value;
  const auto percent = 0.0 == dst_value ? 0.0 : std::fabs(diff / dst_value);
  const auto& difference = 0.0 == percent || threshold < percent
                               ? std::to_string(std::fabs(diff))
                               : std::to_string(percent * 100.0) + " percent";
  if (0.0 < percent && percent < threshold) {
    cmp.score = 1.0 - percent;
  }
  const std::string direction = 0 < diff ? "larger" : "smaller";
  cmp.desc.insert("value is " + direction + " by " + difference);
}

void compare_arrays(const data_point& src, const data_point& dst,
                    TypeComparison& cmp) {
  const auto& src_members = flatten_array(flatten(src));
  const auto& dst_members = flatten_array(flatten(dst));
  const std::pair<size_t, size_t> minmax =
      std::minmax(src_members.size(), dst_members.size());

  // if the two result keys are both empty arrays, we consider them
  // identical. we choose to handle this special case to prevent
  // divide by zero.

  if (0u == minmax.second) {
    cmp.match = MatchType::Perfect;
    cmp.score = 1.0;
    return;
  }

  // skip element-wise comparison if array has changed in size and
  // the change of size is more than the threshold that determines
  // if element-wise comparison information is helpful to user.

  const auto sizeThreshold = 0.2;
  const auto diffRange = minmax.second - minmax.first;
  const auto sizeRatio = diffRange / static_cast<double>(minmax.second);
  // describe the change of array size
  if (0 != diffRange) {
    const auto& change =
        src_members.size() < dst_members.size() ? "shrunk" : "grown";
    cmp.desc.insert(touca::detail::format("array size {} by {} elements",
                                          change, diffRange));
  }
  // skip if array size has changed noticeably or if array in head
  // version is empty.
  if (sizeThreshold < sizeRatio || src_members.empty()) {
    // keep match as None and score as 0.0
    // and return the comparison result
    cmp.dstValue = dst.to_string();
    return;
  }

  // perform element-wise comparison
  auto scoreEarned = 0.0;
  std::unordered_map<unsigned, std::set<std::string>> differences;

  for (auto i = 0u; i < minmax.first; i++) {
    const auto tmp = compare(src_members.at(i), dst_members.at(i));
    scoreEarned += tmp.score;
    if (MatchType::None == tmp.match) {
      differences.emplace(i, tmp.desc);
    }
  }

  // we will only report element-wise differences if the number of
  // different elements does not exceed our threshold that determines
  // if this information is helpful to user.
  const auto diffRatioThreshold = 0.2;
  const auto diffSizeThreshold = 10u;
  const auto diffRatio =
      differences.size() / static_cast<double>(src_members.size());
  if (diffRatio < diffRatioThreshold ||
      differences.size() < diffSizeThreshold) {
    for (const auto& diff : differences) {
      for (const auto& msg : diff.second) {
        cmp.desc.insert(fmt::format("[{}]:{}", diff.first, msg));
      }
    }
    cmp.score = scoreEarned / minmax.second;
  }

  if (1.0 == cmp.score) {
    cmp.match = MatchType::Perfect;
    return;
  }

  cmp.dstValue = dst.to_string();
}

void compare_objects(const data_point& src, const data_point& dst,
                     TypeComparison& cmp) {
  const auto& src_members = flatten(src);
  const auto& dst_members = flatten(dst);

  auto scoreEarned = 0.0;
  auto scoreTotal = 0u;
  for (const auto& src_member : src_members) {
    ++scoreTotal;
    // compare common members
    if (dst_members.count(src_member.first)) {
      const auto& dstKey = dst_members.at(src_member.first);
      const auto& tmp = compare(src_member.second, dstKey);
      scoreEarned += tmp.score;
      if (MatchType::Perfect == tmp.match) {
        continue;
      }
      for (const auto& desc : tmp.desc) {
        const auto& msg = src_member.first + ": " + desc;
        cmp.desc.insert(msg);
      }
      continue;
    }
    // report src members that are missing from dst
    const auto& msg = src_member.first + ": missing";
    cmp.desc.insert(msg);
  }

  // report dst members that are missing from src
  for (const auto& dstMember : dst_members) {
    if (!src_members.count(dstMember.first)) {
      const auto& msg = dstMember.first + ": new";
      cmp.desc.insert(msg);
      ++scoreTotal;
    }
  }

  // report comparison as perfect match if all children match
  if (scoreEarned == scoreTotal) {
    cmp.match = MatchType::Perfect;
    cmp.score = 1.0;
    return;
  }
  // set score as match rate of children
  cmp.score = scoreEarned / scoreTotal;
}

TypeComparison compare(const data_point& src, const data_point& dst) {
  TypeComparison cmp;
  cmp.srcType = src._type;
  cmp.srcValue = src.to_string();

  // the two result keys are considered completely different
  // if they are different in types.

  if (src._type != dst._type) {
    cmp.dstType = dst._type;
    cmp.dstValue = dst.to_string();
    cmp.desc.insert("result types are different");
    return cmp;
  }

  if (src._type == detail::internal_type::boolean) {
    // two Bool objects are equal if they have identical values.
    if (src._value.boolean == dst._value.boolean) {
      cmp.match = MatchType::Perfect;
      cmp.score = 1.0;
      return cmp;
    }
    cmp.dstValue = dst.to_string();
  } else if (src._type == detail::internal_type::number_double) {
    compare_number<detail::number_double_t>(src._value.number_double,
                                            dst._value.number_double, cmp);
    if (cmp.match != MatchType::Perfect) {
      cmp.dstValue = dst.to_string();
    }
  } else if (src._type == detail::internal_type::number_float) {
    compare_number<detail::number_float_t>(src._value.number_float,
                                           dst._value.number_float, cmp);
    if (cmp.match != MatchType::Perfect) {
      cmp.dstValue = dst.to_string();
    }
  } else if (src._type == detail::internal_type::number_signed) {
    compare_number<detail::number_signed_t>(src._value.number_signed,
                                            dst._value.number_signed, cmp);
    if (cmp.match != MatchType::Perfect) {
      cmp.dstValue = dst.to_string();
    }
  } else if (src._type == detail::internal_type::number_unsigned) {
    compare_number<detail::number_unsigned_t>(src._value.number_unsigned,
                                              dst._value.number_unsigned, cmp);
    if (cmp.match != MatchType::Perfect) {
      cmp.dstValue = dst.to_string();
    }
  } else if (src._type == detail::internal_type::string) {
    if (0 == src._value.string->compare(*dst._value.string)) {
      cmp.match = MatchType::Perfect;
      cmp.score = 1.0;
    } else {
      cmp.dstValue = dst.to_string();
    }
  } else if (src._type == detail::internal_type::array) {
    compare_arrays(src, dst, cmp);
  } else if (src._type == detail::internal_type::object) {
    compare_objects(src, dst, cmp);
    if (cmp.match != MatchType::Perfect) {
      cmp.dstValue = dst.to_string();
    }
  }
  return cmp;
}

std::string Cellar::stringify(const detail::internal_type type) const {
  const std::unordered_map<detail::internal_type, std::string> store = {
      {detail::internal_type::boolean, "bool"},
      {detail::internal_type::number_signed, "number"},
      {detail::internal_type::number_unsigned, "number"},
      {detail::internal_type::number_float, "number"},
      {detail::internal_type::number_double, "number"},
      {detail::internal_type::string, "string"},
      {detail::internal_type::array, "array"},
      {detail::internal_type::object, "object"}};
  if (store.count(type)) {
    return store.at(type);
  }
  return "unknown";
}

nlohmann::ordered_json Cellar::json() const {
  nlohmann::ordered_json rjCommon = nlohmann::json::array();
  for (const auto& kv : common) {
    rjCommon.push_back(build_json_common(kv.first, kv.second));
  }
  auto rjMissing = build_json_solo(missing, Cellar::Category::Missing);
  auto rjFresh = build_json_solo(fresh, Cellar::Category::Fresh);
  return nlohmann::ordered_json({
      {"commonKeys", rjCommon},
      {"missingKeys", rjMissing},
      {"newKeys", rjFresh},
  });
}

nlohmann::ordered_json Cellar::build_json_solo(
    const Cellar::KeyMap& keyMap, const Cellar::Category category) const {
  nlohmann::ordered_json elements = nlohmann::json::array();
  for (const auto& kv : keyMap) {
    const auto& type = stringify(kv.second.type());
    elements.push_back(nlohmann::ordered_json(
        {{"name", kv.first},
         {category == Cellar::Category::Fresh ? "srcType" : "dstType", type},
         {category == Cellar::Category::Fresh ? "srcValue" : "dstValue",
          kv.second.to_string()}}));
  }
  return elements;
}

nlohmann::ordered_json Cellar::build_json_common(
    const std::string& key, const TypeComparison& second) const {
  nlohmann::ordered_json item({
      {"name", key},
      {"score", second.score},
      {"srcType", stringify(second.srcType)},
      {"srcValue", second.srcValue},
  });
  if (detail::internal_type::unknown != second.dstType) {
    item["dstType"] = stringify(second.dstType);
  }
  if (MatchType::Perfect != second.match) {
    item["dstValue"] = second.dstValue;
  }
  if (!second.desc.empty()) {
    item["desc"] = second.desc;
  }
  return item;
}

TestcaseComparison::TestcaseComparison(const Testcase& src, const Testcase& dst)
    : _src(src), _dst(dst) {
  _srcMeta = _src.metadata();
  _dstMeta = _dst.metadata();
  // perform comparisons on assumptions
  init_cellar(_src._resultsMap, _dst._resultsMap, ResultCategory::Assert,
              _assumptions);
  init_cellar(_src._resultsMap, _dst._resultsMap, ResultCategory::Check,
              _results);
  init_cellar(_src.metrics(), _dst.metrics(), _metrics);
}

TestcaseComparison compare(const Testcase& src, const Testcase& dst) {
  return TestcaseComparison(src, dst);
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

double TestcaseComparison::score_results() const {
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
  output.keysScore = score_results();

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

void TestcaseComparison::init_cellar(const ResultsMap& src,
                                     const ResultsMap& dst,
                                     const ResultCategory& type,
                                     Cellar& result) {
  for (const auto& kv : dst) {
    if (kv.second.typ != type) {
      continue;
    }
    const auto& key = kv.first;
    if (src.count(key)) {
      result.common.emplace(key, compare(src.at(key).val, kv.second.val));
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

void TestcaseComparison::init_cellar(const MetricsMap& src,
                                     const MetricsMap& dst, Cellar& result) {
  for (const auto& kv : dst) {
    const auto& key = kv.first;
    if (src.count(key)) {
      result.common.emplace(key, compare(src.at(key).value, kv.second.value));
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

}  // namespace touca
