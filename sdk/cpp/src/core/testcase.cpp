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

Testcase::Testcase(const std::string& teamslug, const std::string& testsuite,
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

  _metadata = {teamslug, testsuite, version, name, builtAt};
}

Testcase::Testcase(
    const Metadata& meta, const ResultsMap& results,
    const std::unordered_map<std::string, detail::number_unsigned_t>& metrics)
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
    throw std::invalid_argument("timer was never started for given key");
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
  if (ivalue.val.type() != detail::internal_type::array) {
    throw std::invalid_argument("specified key has a different type");
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
  if (ivalue.val.type() != detail::internal_type::number_unsigned) {
    throw std::invalid_argument("specified key has a different type");
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

  const auto& fbsTeamslug = builder.CreateString(_metadata.teamslug);
  const auto& fbsTestsuite = builder.CreateString(_metadata.testsuite);
  const auto& fbsVersion = builder.CreateString(_metadata.version);
  const auto& fbsTestcase = builder.CreateString(_metadata.testcase);
  const auto& fbsBuiltAt = builder.CreateString(_metadata.builtAt);

  fbs::MetadataBuilder fbsMetadata_builder(builder);
  fbsMetadata_builder.add_teamslug(fbsTeamslug);
  fbsMetadata_builder.add_testsuite(fbsTestsuite);
  fbsMetadata_builder.add_version(fbsVersion);
  fbsMetadata_builder.add_testcase(fbsTestcase);
  fbsMetadata_builder.add_builtAt(fbsBuiltAt);
  const auto& fbsMetadata = fbsMetadata_builder.Finish();

  // serialize results map

  std::vector<flatbuffers::Offset<fbs::Result>> fbsResultEntries_vector;
  for (const auto& result : _resultsMap) {
    const auto& fbsKey = builder.CreateString(result.first);
    const auto& fbsValue = result.second.val.serialize(builder);
    fbs::ResultBuilder fbsResult_builder(builder);
    fbsResult_builder.add_key(fbsKey);
    fbsResult_builder.add_value(fbsValue);
    fbsResult_builder.add_typ(result.second.typ == ResultCategory::Assert
                                  ? fbs::ResultType::Assert
                                  : fbs::ResultType::Check);
    const auto& fbsEntry = fbsResult_builder.Finish();
    fbsResultEntries_vector.push_back(fbsEntry);
  }
  const auto& fbsResultEntries = builder.CreateVector(fbsResultEntries_vector);

  fbs::ResultsBuilder fbsResults_builder(builder);
  fbsResults_builder.add_entries(fbsResultEntries);
  const auto& fbsResults = fbsResults_builder.Finish();

  // serialize metrics

  std::vector<flatbuffers::Offset<fbs::Metric>> fbsMetricEntries_vector;
  for (const auto& metric : metrics()) {
    const auto& fbsKey = builder.CreateString(metric.first);
    const auto& fbsValue = metric.second.value.serialize(builder);
    fbs::MetricBuilder fbsMetric_builder(builder);
    fbsMetric_builder.add_key(fbsKey);
    fbsMetric_builder.add_value(fbsValue);
    const auto& fbsEntry = fbsMetric_builder.Finish();
    fbsMetricEntries_vector.push_back(fbsEntry);
  }
  const auto& fbsMetricEntries = builder.CreateVector(fbsMetricEntries_vector);

  fbs::MetricsBuilder fbsMetrics_builder(builder);
  fbsMetrics_builder.add_entries(fbsMetricEntries);
  const auto& fbsMetrics = fbsMetrics_builder.Finish();

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
  flatbuffers::FlatBufferBuilder fbb;

  std::vector<flatbuffers::Offset<fbs::MessageBuffer>> fbsMessageBuffer_vector;
  for (const auto& tc : testcases) {
    const auto& buffer = tc.flatbuffers();
    const auto& bufferVec = fbb.CreateVector(buffer);
    const auto& fbsMessageBuffer = fbs::CreateMessageBuffer(fbb, bufferVec);
    fbsMessageBuffer_vector.push_back(fbsMessageBuffer);
  }
  const auto& fbsMessageBuffers = fbb.CreateVector(fbsMessageBuffer_vector);

  fbs::MessagesBuilder fbsMessages_builder(fbb);
  fbsMessages_builder.add_messages(fbsMessageBuffers);
  const auto& messages = fbsMessages_builder.Finish();
  fbb.Finish(messages);

  const auto& ptr = fbb.GetBufferPointer();
  return {ptr, ptr + fbb.GetSize()};
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
