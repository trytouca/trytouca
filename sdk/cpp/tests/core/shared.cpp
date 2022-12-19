// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "tests/core/shared.hpp"

#include "rapidjson/document.h"
#include "rapidjson/writer.h"

std::string make_json(
    const std::function<rapidjson::Value(touca::RJAllocator&)> func) {
  rapidjson::Document doc(rapidjson::kObjectType);
  rapidjson::Document::AllocatorType& allocator = doc.GetAllocator();
  const auto& value = func(allocator);

  rapidjson::StringBuffer strbuf;
  rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
  writer.SetMaxDecimalPlaces(3);
  value.Accept(writer);
  return strbuf.GetString();
}
