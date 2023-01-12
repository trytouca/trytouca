// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/core/testcase.hpp"

#include "flatbuffers/flatbuffers.h"
#include "rapidjson/document.h"
#include "rapidjson/rapidjson.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#include "touca/core/filesystem.hpp"
#include "touca/core/types.hpp"
#include "touca/impl/schema.hpp"

namespace touca {

Testcase::Testcase(const std::string& team, const std::string& suite,
                   const std::string& version, const std::string& name)
    : _posted(false) {
  // Add an ISO 8601 timestamp that shows the time of creation of this
  // testcase.
  // We use UTC time instead of local time to ensure that the times
  // are correctly interpreted on the server that uses UTC timezone.
  // We are using `system_clock` to obtain the time with milliseconds
  // precision.
  // We are using `strftime` instead of `fmt::localtime(tm)` provided
  // by `fmt::chrono.h` to reduce our dependency on recent features of
  // `fmt`.

  const auto now = std::chrono::system_clock::now();
  const auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
                      now.time_since_epoch()) %
                  1000;
  const auto tm = std::chrono::system_clock::to_time_t(now);
  char timestamp[32];
  std::strftime(timestamp, sizeof(timestamp), "%FT%T", std::gmtime(&tm));
  const auto& builtAt = fmt::format("{0}.{1:03}Z", timestamp, ms.count());

  _metadata = {team, suite, version, name, builtAt};
}

Testcase::Testcase(
    const Metadata& meta, const ResultsMap& results,
    const std::unordered_map<std::string, touca::detail::number_unsigned_t>&
        metrics)
    : _posted(true), _metadata(meta), _resultsMap(results) {
  for (const auto& metric : metrics) {
    namespace chr = std::chrono;
    const auto& tic = chr::system_clock::time_point(chr::milliseconds(0));
    const auto& toc =
        chr::system_clock::time_point(chr::milliseconds(metric.second));
    _tics.emplace(metric.first, tic);
    _tocs.emplace(metric.first, toc);
  }
}

rapidjson::Value Testcase::Overview::json(
    rapidjson::Document::AllocatorType& allocator) const {
  rapidjson::Value out(rapidjson::kObjectType);
  out.AddMember("keysCount", keysCount, allocator);
  out.AddMember("metricsCount", metricsCount, allocator);
  out.AddMember("metricsDuration", metricsDuration, allocator);
  return out;
}

Testcase::Metadata Testcase::metadata() const { return _metadata; }

void Testcase::setMetadata(const Metadata& metadata) { _metadata = metadata; }

std::string Testcase::Metadata::describe() const {
  return touca::detail::format("{}/{}/{}/{}", teamslug, testsuite, version,
                               testcase);
}

rapidjson::Value Testcase::Metadata::json(
    rapidjson::Document::AllocatorType& allocator) const {
  rapidjson::Value out(rapidjson::kObjectType);
  out.AddMember("teamslug", teamslug, allocator);
  out.AddMember("testsuite", testsuite, allocator);
  out.AddMember("version", version, allocator);
  out.AddMember("testcase", testcase, allocator);
  out.AddMember("builtAt", builtAt, allocator);
  return out;
}

void Testcase::tic(const std::string& key) {
  _tics.emplace(key, std::chrono::system_clock::now());
  _posted = false;
}

void Testcase::toc(const std::string& key) {
  if (!_tics.count(key)) {
    throw touca::detail::runtime_error(
        "timer was never started for the given key");
  }
  _tocs[key] = std::chrono::system_clock::now();
  _posted = false;
}

void Testcase::check(const std::string& key, const data_point& value) {
  _resultsMap.emplace(key, ResultEntry{value, ResultCategory::Check});
  _posted = false;
}

void Testcase::assume(const std::string& key, const data_point& value) {
  _resultsMap.emplace(key, ResultEntry{value, ResultCategory::Assert});
  _posted = false;
}

void Testcase::add_array_element(const std::string& key,
                                 const data_point& value) {
  if (!_resultsMap.count(key)) {
    _resultsMap.emplace(key,
                        ResultEntry{array().add(value), ResultCategory::Check});
    return;
  }
  auto& ivalue = _resultsMap.at(key);
  if (ivalue.val.type() != touca::detail::internal_type::array) {
    throw touca::detail::runtime_error("specified key has a different type");
  }
  ivalue.val.as_array()->push_back(value);
  _posted = false;
}

void Testcase::add_hit_count(const std::string& key) {
  if (!_resultsMap.count(key)) {
    _resultsMap.emplace(key, ResultEntry{data_point::number_unsigned(1U),
                                         ResultCategory::Check});
    return;
  }
  auto& ivalue = _resultsMap.at(key);
  if (ivalue.val.type() != touca::detail::internal_type::number_unsigned) {
    throw touca::detail::runtime_error("specified key has a different type");
  }
  ivalue.val.increment();
  _posted = false;
}

void Testcase::add_metric(const std::string& key, const unsigned duration) {
  namespace chr = std::chrono;
  const auto& tic = chr::system_clock::time_point(chr::milliseconds(0));
  const auto& toc = chr::system_clock::time_point(chr::milliseconds(duration));
  _tics.emplace(key, tic);
  _tocs.emplace(key, toc);
  _posted = false;
}

MetricsMap Testcase::metrics() const {
  MetricsMap metrics;
  for (const auto& tic : _tics) {
    if (!_tocs.count(tic.first)) {
      continue;
    }
    const auto& key = tic.first;
    const auto& diff = _tocs.at(key) - _tics.at(key);
    const auto& duration =
        std::chrono::duration_cast<std::chrono::milliseconds>(diff);
    metrics.emplace(
        key, MetricsMapValue{data_point::number_signed(duration.count())});
  }
  return metrics;
}

rapidjson::Value Testcase::json(
    rapidjson::Document::AllocatorType& allocator) const {
  rapidjson::Value out(rapidjson::kObjectType);
  out.AddMember("metadata", _metadata.json(allocator), allocator);

  rapidjson::Value rjResults(rapidjson::kArrayType);
  for (const auto& entry : _resultsMap) {
    if (entry.second.typ != ResultCategory::Check) {
      continue;
    }
    rapidjson::Value rjEntry(rapidjson::kObjectType);
    rjEntry.AddMember("key", entry.first, allocator);
    rjEntry.AddMember("value", entry.second.val.to_string(), allocator);
    rjResults.PushBack(rjEntry, allocator);
  }
  out.AddMember("results", rjResults, allocator);

  rapidjson::Value rjAssertions(rapidjson::kArrayType);
  for (const auto& entry : _resultsMap) {
    if (entry.second.typ != ResultCategory::Assert) {
      continue;
    }
    rapidjson::Value rjEntry(rapidjson::kObjectType);
    rjEntry.AddMember("key", entry.first, allocator);
    rjEntry.AddMember("value", entry.second.val.to_string(), allocator);
    rjAssertions.PushBack(rjEntry, allocator);
  }
  out.AddMember("assertion", rjAssertions, allocator);

  rapidjson::Value rjMetrics(rapidjson::kArrayType);
  for (const auto& entry : metrics()) {
    rapidjson::Value rjEntry(rapidjson::kObjectType);
    rjEntry.AddMember("key", entry.first, allocator);
    rjEntry.AddMember("value", entry.second.value.to_string(), allocator);
    rjMetrics.PushBack(rjEntry, allocator);
  }
  out.AddMember("metrics", rjMetrics, allocator);

  return out;
}

std::vector<uint8_t> Testcase::flatbuffers() const {
  flatbuffers::FlatBufferBuilder builder;
  const auto& fbsMetadata = fbs::CreateMetadataDirect(
      builder, _metadata.testsuite.c_str(), _metadata.version.c_str(),
      _metadata.testcase.c_str(), _metadata.builtAt.c_str(),
      _metadata.teamslug.c_str());

  // serialize results map

  std::vector<flatbuffers::Offset<fbs::Result>> fbsResultEntries;
  for (const auto& result : _resultsMap) {
    const auto& key = result.first.c_str();
    const auto& value = result.second.val.serialize(builder);
    const auto& type = result.second.typ == ResultCategory::Assert
                           ? fbs::ResultType::Assert
                           : fbs::ResultType::Check;
    const auto& entry = fbs::CreateResultDirect(builder, key, value, type);
    fbsResultEntries.push_back(entry);
  }
  const auto& fbsResults = fbs::CreateResultsDirect(builder, &fbsResultEntries);

  // serialize metrics

  std::vector<flatbuffers::Offset<fbs::Metric>> fbsMetricEntries;
  for (const auto& metric : metrics()) {
    const auto& key = metric.first.c_str();
    const auto& value = metric.second.value.serialize(builder);
    const auto& entry = fbs::CreateMetricDirect(builder, key, value);
    fbsMetricEntries.push_back(entry);
  }
  const auto& fbsMetrics = fbs::CreateMetricsDirect(builder, &fbsMetricEntries);

  // serialize message object representing this testcase

  fbs::MessageBuilder fbsMessage_builder(builder);
  fbsMessage_builder.add_metadata(fbsMetadata);
  fbsMessage_builder.add_results(fbsResults);
  fbsMessage_builder.add_metrics(fbsMetrics);
  const auto& message = fbsMessage_builder.Finish();

  builder.Finish(message);

  const auto& ptr = builder.GetBufferPointer();
  return {ptr, ptr + builder.GetSize()};
}

Testcase::Overview Testcase::overview() const {
  Testcase::Overview overview;
  overview.keysCount = static_cast<std::int32_t>(_resultsMap.size());
  for (const auto& tic : _tics) {
    if (!_tocs.count(tic.first)) {
      continue;
    }
    const auto& key = tic.first;
    const auto& diff = _tocs.at(key) - _tics.at(key);
    const auto& duration =
        std::chrono::duration_cast<std::chrono::milliseconds>(diff);
    overview.metricsDuration += static_cast<std::int32_t>(duration.count());
    overview.metricsCount++;
  }
  return overview;
}

void Testcase::clear() {
  _posted = false;
  _resultsMap.clear();
  _tics.clear();
  _tocs.clear();
}

std::vector<uint8_t> Testcase::serialize(
    const std::vector<Testcase>& testcases) {
  flatbuffers::FlatBufferBuilder builder;
  std::vector<flatbuffers::Offset<fbs::MessageBuffer>> messageBuffers;
  for (const auto& tc : testcases) {
    const auto& out = tc.flatbuffers();
    messageBuffers.push_back(fbs::CreateMessageBufferDirect(builder, &out));
  }
  const auto& messages = fbs::CreateMessagesDirect(builder, &messageBuffers);
  builder.Finish(messages);
  const auto& ptr = builder.GetBufferPointer();
  return {ptr, ptr + builder.GetSize()};
}

std::string elements_map_to_json(const ElementsMap& elements_map) {
  rapidjson::Document doc(rapidjson::kArrayType);
  rapidjson::Document::AllocatorType& allocator = doc.GetAllocator();
  for (const auto& item : elements_map) {
    doc.PushBack(item.second->json(allocator), allocator);
  }
  rapidjson::StringBuffer strbuf;
  rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
  writer.SetMaxDecimalPlaces(3);
  doc.Accept(writer);
  return strbuf.GetString();
}

}  // namespace touca
