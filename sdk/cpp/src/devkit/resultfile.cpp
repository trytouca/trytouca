// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/devkit/resultfile.hpp"

#include <fstream>

#include "rapidjson/document.h"
#include "rapidjson/rapidjson.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#include "touca/core/testcase.hpp"
#include "touca/devkit/deserialize.hpp"
#include "touca/devkit/utils.hpp"
#include "touca/impl/schema.hpp"

namespace touca {

ResultFile::ResultFile(const touca::filesystem::path& path) : _path(path) {}

bool ResultFile::validate() const {
  // if file is already loaded, we have already validated its content
  if (!_testcases.empty()) {
    return true;
  }

  // file must exist in order to be valid
  if (!touca::filesystem::is_regular_file(_path)) {
    return false;
  }
  const auto& content =
      detail::load_string_file(_path.string(), std::ios::in | std::ios::binary);
  return validate(content);
}

bool ResultFile::validate(const std::string& content) const {
  const auto& buffer = (const uint8_t*)content.data();
  const auto& length = content.size();
  flatbuffers::Verifier verifier(buffer, length);
  return verifier.VerifyBuffer<touca::fbs::Messages>();
}

ElementsMap ResultFile::parse() const {
  // if file is already loaded, return the already parsed testcases
  if (!_testcases.empty()) {
    return _testcases;
  }

  const auto& content =
      detail::load_string_file(_path.string(), std::ios::in | std::ios::binary);

  // verify that given content represents valid flatbuffers data
  if (!validate(content)) {
    throw std::runtime_error("result file invalid: " + _path.string());
  }

  ElementsMap testcases;
  // parse content of given file
  const auto& messages = touca::fbs::GetMessages(content.c_str());
  for (const auto&& message : *messages->messages()) {
    const auto& buffer = message->buf();
    const auto& ptr = buffer->data();
    std::vector<uint8_t> data(ptr, ptr + buffer->size());
    const auto& testcase =
        std::make_shared<Testcase>(deserialize_testcase(data));
    testcases.emplace(testcase->metadata().testcase, testcase);
  }
  return testcases;
}

void ResultFile::load() { _testcases = parse(); }

bool ResultFile::isLoaded() const { return !_testcases.empty(); }

void ResultFile::save() {
  std::vector<Testcase> tcs;
  for (const auto& testcase : _testcases) {
    tcs.emplace_back(*testcase.second);
  }
  return save(tcs);
}

void ResultFile::save(const std::vector<Testcase>& testcases) {
  detail::save_binary_file(_path.string(), Testcase::serialize(testcases));
  // update map of stored testcases so that it only contains entries
  // for the new testcases we used for saving the file
  load();
}

std::string ResultFile::read_file_in_json() const {
  const auto testcases = _testcases.empty() ? parse() : _testcases;
  rapidjson::Document doc(rapidjson::kArrayType);
  rapidjson::Document::AllocatorType& allocator = doc.GetAllocator();
  for (const auto& item : testcases) {
    doc.PushBack(item.second->json(allocator), allocator);
  }
  rapidjson::StringBuffer strbuf;
  rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
  writer.SetMaxDecimalPlaces(3);
  doc.Accept(writer);
  return strbuf.GetString();
}

void ResultFile::merge(const ResultFile& other) {
  const auto tcs = other.parse();
  _testcases.insert(tcs.begin(), tcs.end());
}

ResultFile::ComparisonResult ResultFile::compare(
    const ResultFile& other) const {
  const auto srcCases = _testcases.empty() ? parse() : _testcases;
  const auto dstCases = other.parse();
  ComparisonResult cmp;
  for (const auto& tc : srcCases) {
    const auto& key = tc.first;
    if (dstCases.count(key)) {
      cmp.common.emplace(key,
                         TestcaseComparison(*tc.second, *dstCases.at(key)));
      continue;
    }
    cmp.fresh.emplace(tc);
  }
  for (const auto& tc : dstCases) {
    const auto& key = tc.first;
    if (!srcCases.count(key)) {
      cmp.missing.emplace(tc);
    }
  }
  return cmp;
}

std::string ResultFile::ComparisonResult::json() const {
  rapidjson::Document doc(rapidjson::kObjectType);
  auto& allocator = doc.GetAllocator();

  rapidjson::Value rjFresh(rapidjson::kArrayType);
  for (const auto& item : fresh) {
    auto val = item.second->metadata().json(allocator);
    rjFresh.PushBack(val, allocator);
  }

  rapidjson::Value rjMissing(rapidjson::kArrayType);
  for (const auto& item : missing) {
    auto val = item.second->metadata().json(allocator);
    rjMissing.PushBack(val, allocator);
  }

  rapidjson::Value rjCommon(rapidjson::kArrayType);
  for (const auto& item : common) {
    rjCommon.PushBack(item.second.json(allocator), allocator);
  }

  doc.AddMember("newCases", rjFresh, allocator);
  doc.AddMember("missingCases", rjMissing, allocator);
  doc.AddMember("commonCases", rjCommon, allocator);

  rapidjson::StringBuffer strbuf;
  rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
  writer.SetMaxDecimalPlaces(3);
  doc.Accept(writer);
  return strbuf.GetString();
}

}  // namespace touca
