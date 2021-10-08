// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "stats.hpp"

#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "touca/devkit/utils.hpp"

/**
 *
 */
void Statistics::update_collector_stats(long long duration,
                                        unsigned long jobs) {
  std::scoped_lock lock(_mutex);
  const auto count = counter_collect;
  avg_time_collect = (avg_time_collect * count + duration) / (count + 1);
  job_count_collect += jobs;
  counter_collect++;
}

/**
 *
 */
void Statistics::update_processor_stats(long long duration) {
  std::scoped_lock lock(_mutex);
  const auto count = counter_process;
  avg_time_process = (avg_time_process * count + duration) / (count + 1);
  job_count_process++;
  counter_process++;
}

/**
 *
 */
std::string Statistics::report() {
  std::scoped_lock lock(_mutex);
  rapidjson::Document doc(rapidjson::kObjectType);
  rapidjson::Document::AllocatorType& allocator = doc.GetAllocator();

  doc.AddMember("avgCollectionTime", avg_time_collect, allocator);
  doc.AddMember("avgProcessingTime", avg_time_process, allocator);
  rapidjson::Value value1(rapidjson::kNumberType);
  value1.SetUint(counter_collect);
  doc.AddMember("numCollectionJobs", value1, allocator);
  rapidjson::Value value2(rapidjson::kNumberType);
  value2.SetUint(counter_process);
  doc.AddMember("numProcessingJobs", value2, allocator);

  rapidjson::StringBuffer strbuf;
  rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
  writer.SetMaxDecimalPlaces(3);
  doc.Accept(writer);
  return strbuf.GetString();
}

/**
 *
 */
void Statistics::reset() {
  avg_time_collect = 0;
  job_count_collect = 0;
  avg_time_process = 0;
  job_count_process = 0;
}
