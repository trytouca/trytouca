// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/cmp/platform.hpp"

#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "touca/cmp/logger.hpp"
#include "touca/cmp/object_store.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/devkit/comparison.hpp"
#include "touca/devkit/platform.hpp"

MessageJob::MessageJob(const std::string& batchId, const std::string& messageId)
    : Job(), _batchId(batchId), _messageId(messageId) {}

std::string MessageJob::desc() const {
  return touca::detail::format("m:{}", _messageId);
}

bool MessageJob::process(const Options& options) const {
  const auto& store = ObjectStore::get_instance(options);
  const auto result = store.get_message(_messageId);
  if (!result) {
    touca::log_warn("{}: failed to process message", desc());
    return false;
  }

  const auto& name = result->metadata().describe();

  // create json output to be posted to backend

  rapidjson::Document doc(rapidjson::kObjectType);
  rapidjson::Document::AllocatorType& allocator = doc.GetAllocator();

  doc.AddMember("overview", result->overview().json(allocator), allocator);
  doc.AddMember("body", result->json(allocator), allocator);

  rapidjson::StringBuffer strbuf;
  rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
  writer.SetMaxDecimalPlaces(3);
  doc.Accept(writer);
  const auto output = strbuf.GetString();

  // submit output to the server

  touca::ApiUrl api(options.api_url);
  touca::Platform platform(api);

  const auto url = touca::detail::format("/cmp/message/{}", _messageId);
  if (!platform.cmp_submit(url, output)) {
    touca::log_warn("{}: failed to submit message: {}", name,
                    platform.get_error());
    return false;
  }

  return true;
}

std::string ComparisonJob::desc() const {
  return touca::detail::format("c:{}", _jobId);
}

bool ComparisonJob::process(const Options& options) const {
  const auto& store = ObjectStore::get_instance(options);
  const auto dst = store.get_message(_dstMessageId);
  const auto src = store.get_message(_srcMessageId);

  if (!src || !dst) {
    touca::log_warn("{}: comparison job is orphaned", desc());
    return false;
  }

  const auto& srcName = src->metadata().describe();
  const auto& dstName = dst->metadata().describe();
  const auto& tuple = touca::detail::format("{}_{}", srcName, dstName);
  touca::log_debug("{}: processing comparison job", tuple);

  // perform comparison

  touca::TestcaseComparison result(*src, *dst);

  // create json output to be posted to backend

  rapidjson::Document doc(rapidjson::kObjectType);
  rapidjson::Document::AllocatorType& allocator = doc.GetAllocator();

  doc.AddMember("overview", result.overview().json(allocator), allocator);
  doc.AddMember("body", result.json(allocator), allocator);

  rapidjson::StringBuffer strbuf;
  rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
  writer.SetMaxDecimalPlaces(3);
  doc.Accept(writer);
  const auto output = strbuf.GetString();

  // submit output to the server

  touca::ApiUrl api(options.api_url);
  touca::Platform platform(api);

  const auto url = touca::detail::format("/cmp/job/{}", _jobId);
  if (!platform.cmp_submit(url, output)) {
    touca::log_warn("{}: failed to submit comparison result: {}", tuple,
                    platform.get_error());
    return false;
  }

  return true;
}

std::vector<std::unique_ptr<Job>> retrieveJobs(const std::string& api_url) {
  touca::ApiUrl api(api_url);
  touca::Platform platform(api);

  std::string body;
  if (!platform.cmp_jobs(body)) {
    touca::log_error("failed to obtain list of jobs: {}", platform.get_error());
    return {};
  }

  rapidjson::Document parsed;
  if (parsed.Parse<0>(body.c_str()).HasParseError()) {
    touca::log_error("backend response for list of jobs is ill-formed");
    return {};
  }

  if (!parsed.HasMember("messages") || !parsed["messages"].IsArray()) {
    touca::log_error("backend response has no field `messages`");
    return {};
  }

  if (!parsed.HasMember("comparisons") || !parsed["comparisons"].IsArray()) {
    touca::log_error("backend response has no field `comparisons`");
    return {};
  }

  std::vector<std::unique_ptr<Job>> jobs;

  for (const auto& item : parsed["messages"].GetArray()) {
    jobs.push_back(std::make_unique<MessageJob>(item["batchId"].GetString(),
                                                item["messageId"].GetString()));
  }

  for (const auto& item : parsed["comparisons"].GetArray()) {
    jobs.push_back(std::make_unique<ComparisonJob>(
        item["jobId"].GetString(), item["dstBatchId"].GetString(),
        item["dstMessageId"].GetString(), item["srcBatchId"].GetString(),
        item["srcMessageId"].GetString()));
  }

  return jobs;
}
