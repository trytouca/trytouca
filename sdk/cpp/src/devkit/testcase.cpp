// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/devkit/testcase.hpp"

#include "flatbuffers/flatbuffers.h"
#include "nlohmann/json.hpp"
#include "touca/core/types.hpp"
#include "touca/devkit/comparison.hpp"
#include "touca/devkit/utils.hpp"
#include "touca/impl/schema.hpp"

namespace touca {

static const std::unordered_map<ResultCategory, fbs::ResultType> result_types =
    {
        {ResultCategory::Check, fbs::ResultType::Check},
        {ResultCategory::Assert, fbs::ResultType::Assert},
};

static const std::unordered_map<fbs::ResultType, ResultCategory>
    result_types_reverse = {
        {fbs::ResultType::Check, ResultCategory::Check},
        {fbs::ResultType::Assert, ResultCategory::Assert},
};

/**
 *
 */
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

/**
 *
 */
Testcase::Testcase(const std::vector<uint8_t>& buffer) : _posted(true) {
  const auto& message =
      flatbuffers::GetRoot<touca::fbs::Message>(buffer.data());

  // parse remaining metadata

  const auto& teamSlug = message->metadata()->teamslug()
                             ? message->metadata()->teamslug()->data()
                             : "vital";

  _metadata = {teamSlug, message->metadata()->testsuite()->data(),
               message->metadata()->version()->data(),
               message->metadata()->testcase()->data(),
               message->metadata()->builtAt()->data()};

  // parse results

  const auto& results = message->results()->entries();
  for (const auto&& result : *results) {
    const auto& key = result->key()->data();
    const auto& value = types::deserializeValue(result->value());
    if (!value) {
      throw std::runtime_error("failed to parse results map entry");
    }
    _resultsMap.emplace(
        key, ResultEntry{value, result_types_reverse.at(result->typ())});
  }

  // parse metrics

  const auto& metrics = message->metrics()->entries();
  for (const auto&& metric : *metrics) {
    const auto& key = metric->key()->data();
    const auto& ivalue = types::deserializeValue(metric->value());
    const auto& value =
        std::dynamic_pointer_cast<types::Number<int64_t>>(ivalue);
    if (!value) {
      throw std::runtime_error("failed to parse metrics map entry");
    }
    add_metric(key, static_cast<unsigned>(value->value()));
  }
}

/**
 *
 */
nlohmann::ordered_json Testcase::Overview::json() const {
  return nlohmann::ordered_json({{"keysCount", keysCount},
                                 {"metricsCount", metricsCount},
                                 {"metricsDuration", metricsDuration}});
}

/**
 *
 */
Testcase::Metadata Testcase::metadata() const { return _metadata; }

/**
 *
 */
void Testcase::setMetadata(const Metadata& metadata) { _metadata = metadata; }

/**
 *
 */
std::string Testcase::Metadata::describe() const {
  return touca::format("{}/{}/{}/{}", teamslug, testsuite, version, testcase);
}

/**
 *
 */
nlohmann::ordered_json Testcase::Metadata::json() const {
  return nlohmann::ordered_json({
      {"teamslug", teamslug},
      {"testsuite", testsuite},
      {"version", version},
      {"testcase", testcase},
      {"builtAt", builtAt},
  });
}

/**
 *
 */
void Testcase::tic(const std::string& key) {
  _tics.emplace(key, std::chrono::system_clock::now());
  _posted = false;
}

/**
 *
 */
void Testcase::toc(const std::string& key) {
  if (!_tics.count(key)) {
    throw std::invalid_argument("timer was never started for given key");
  }
  _tocs[key] = std::chrono::system_clock::now();
  _posted = false;
}

/**
 *
 */
void Testcase::check(const std::string& key,
                     const std::shared_ptr<types::IType>& value) {
  _resultsMap.emplace(key, ResultEntry{value, ResultCategory::Check});
  _posted = false;
}

/**
 *
 */
void Testcase::assume(const std::string& key,
                      const std::shared_ptr<types::IType>& value) {
  _resultsMap.emplace(key, ResultEntry{value, ResultCategory::Assert});
  _posted = false;
}

/**
 *
 */
void Testcase::add_array_element(const std::string& key,
                                 const std::shared_ptr<types::IType>& element) {
  using touca::types::ArrayType;
  if (!_resultsMap.count(key)) {
    const auto value = std::make_shared<ArrayType>();
    value->add(element);
    _resultsMap.emplace(key, ResultEntry{value, ResultCategory::Check});
    return;
  }
  const auto ivalue = _resultsMap.at(key);
  if (ivalue.val->type() != touca::types::value_t::array) {
    throw std::invalid_argument(
        "specified key is associated with a "
        "result of a different type");
  }
  const auto value = std::dynamic_pointer_cast<ArrayType>(ivalue.val);
  value->add(element);
  _resultsMap[key].val = value;
  _posted = false;
}

/**
 *
 */
void Testcase::add_hit_count(const std::string& key) {
  using number_t = touca::types::Number<uint64_t>;
  if (!_resultsMap.count(key)) {
    const auto value = std::make_shared<number_t>(1u);
    _resultsMap.emplace(key, ResultEntry{value, ResultCategory::Check});
    return;
  }
  const auto ivalue = _resultsMap.at(key).val;
  if (ivalue->type() != touca::types::value_t::numeric) {
    throw std::invalid_argument(
        "specified key is associated with a "
        "result of a different type");
  }
  const auto value = std::dynamic_pointer_cast<number_t>(ivalue);
  if (!value) {
    throw std::invalid_argument(
        "specified key is associated with a "
        "result of a different type");
  }
  _resultsMap[key].val = std::make_shared<number_t>(value->value() + 1);
  _posted = false;
}

/**
 *
 */
void Testcase::add_metric(const std::string& key, const unsigned duration) {
  namespace chr = std::chrono;
  const auto& tic = chr::system_clock::time_point(chr::milliseconds(0));
  const auto& toc = chr::system_clock::time_point(chr::milliseconds(duration));
  _tics.emplace(key, tic);
  _tocs.emplace(key, toc);
  _posted = false;
}

/**
 *
 */
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
    const auto& value =
        std::make_shared<types::Number<int64_t>>(duration.count());
    metrics.emplace(key, MetricsMapValue{value});
  }
  return metrics;
}

/**
 *
 */
nlohmann::ordered_json Testcase::json() const {
  auto results = nlohmann::json::array();
  for (const auto& entry : _resultsMap) {
    if (entry.second.typ != ResultCategory::Check) {
      continue;
    }
    results.push_back(
        {{"key", entry.first}, {"value", entry.second.val->string()}});
  }

  auto assumptions = nlohmann::json::array();
  for (const auto& entry : _resultsMap) {
    if (entry.second.typ != ResultCategory::Assert) {
      continue;
    }
    assumptions.push_back(
        {{"key", entry.first}, {"value", entry.second.val->string()}});
  }

  auto json_metrics = nlohmann::json::array();
  for (const auto& entry : metrics()) {
    json_metrics.push_back(
        {{"key", entry.first}, {"value", entry.second.value->string()}});
  }

  return nlohmann::ordered_json({{"metadata", {_metadata.json()}},
                                 {"results", results},
                                 {"assertion", assumptions},
                                 {"metrics", json_metrics}});
}

/**
 *
 */
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
    const auto& fbsValue = result.second.val->serialize(builder);
    fbs::ResultBuilder fbsResult_builder(builder);
    fbsResult_builder.add_key(fbsKey);
    fbsResult_builder.add_value(fbsValue);
    fbsResult_builder.add_typ(result_types.at(result.second.typ));
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
    const auto& fbsValue = metric.second.value->serialize(builder);
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
  fbsMessage_builder.checks(fbsResults);
  fbsMessage_builder.add_metrics(fbsMetrics);
  const auto& message = fbsMessage_builder.Finish();

  builder.Finish(message);

  const auto& ptr = builder.GetBufferPointer();
  return {ptr, ptr + builder.GetSize()};
}

/**
 *
 */
compare::TestcaseComparison Testcase::compare(
    const std::shared_ptr<Testcase>& tc) const {
  return {*this, *tc};
}

/**
 *
 */
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

/**
 *
 */
void Testcase::clear() {
  _posted = false;
  _resultsMap.clear();
  _tics.clear();
  _tocs.clear();
}

/**
 *
 */
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

}  // namespace touca
