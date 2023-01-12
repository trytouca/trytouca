// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/cli/deserialize.hpp"

#include <stdexcept>

#include "flatbuffers/flatbuffers.h"
#include "touca/core/filesystem.hpp"
#include "touca/core/testcase.hpp"
#include "touca/core/types.hpp"
#include "touca/impl/schema.hpp"

namespace touca {

data_point deserialize_value(const fbs::TypeWrapper* ptr) {
  const auto& value = ptr->value();
  const auto& type = ptr->value_type();
  switch (type) {
    case fbs::Type::Bool: {
      const auto& castptr = static_cast<const fbs::Bool*>(ptr->value());
      return data_point::boolean(castptr->value());
    }
    case fbs::Type::Double: {
      const auto& castptr = static_cast<const fbs::Double*>(ptr->value());
      return data_point::number_double(castptr->value());
    }
    case fbs::Type::Float: {
      const auto& castptr = static_cast<const fbs::Float*>(ptr->value());
      return data_point::number_float(castptr->value());
    }
    case fbs::Type::Int: {
      const auto& castptr = static_cast<const fbs::Int*>(ptr->value());
      return data_point::number_signed(castptr->value());
    }
    case fbs::Type::UInt: {
      const auto& castptr = static_cast<const fbs::UInt*>(ptr->value());
      return data_point::number_unsigned(castptr->value());
    }
    case fbs::Type::String: {
      const auto& str = static_cast<const fbs::String*>(value);
      return data_point::string(str->value()->data());
    }
    case fbs::Type::Array: {
      const auto& fbsArr = static_cast<const fbs::Array*>(value);
      array out;
      for (const auto&& element : *fbsArr->values()) {
        out.add(deserialize_value(element));
      }
      return out;
    }
    case fbs::Type::Object: {
      const auto& fbsObj = static_cast<const fbs::Object*>(value);
      touca::object out(fbsObj->key()->data());
      for (const auto&& member : *fbsObj->values()) {
        out.add(member->name()->data(), deserialize_value(member->value()));
      }
      return out;
    }
    default:
      throw touca::detail::runtime_error("encountered unexpected type");
  }
}

Testcase deserialize_testcase(const std::vector<uint8_t>& buffer) {
  const auto message = flatbuffers::GetRoot<touca::fbs::Message>(buffer.data());
  Testcase::Metadata metadata = {message->metadata()->teamslug()
                                     ? message->metadata()->teamslug()->data()
                                     : "unknown",
                                 message->metadata()->testsuite()->data(),
                                 message->metadata()->version()->data(),
                                 message->metadata()->testcase()->data(),
                                 message->metadata()->builtAt()->data()};

  ResultsMap resultsMap;
  const auto& results = message->results()->entries();
  for (const auto&& result : *results) {
    const auto& key = result->key()->data();
    const auto& value = deserialize_value(result->value());
    if (value.type() == touca::detail::internal_type::unknown) {
      throw touca::detail::runtime_error("failed to parse results map entry");
    }
    resultsMap.emplace(
        key, ResultEntry{value, result->typ() == fbs::ResultType::Assert
                                    ? ResultCategory::Assert
                                    : ResultCategory::Check});
  }

  std::unordered_map<std::string, touca::detail::number_unsigned_t> metricsMap;
  const auto& metrics = message->metrics()->entries();
  for (const auto&& metric : *metrics) {
    const auto& key = metric->key()->data();
    const auto& value = deserialize_value(metric->value());
    if (value.type() != touca::detail::internal_type::number_signed) {
      throw touca::detail::runtime_error("failed to parse metrics map entry");
    }
    metricsMap.emplace(key, value.as_metric());
  }

  return Testcase(metadata, resultsMap, metricsMap);
}

ElementsMap deserialize_file(const touca::filesystem::path& path) {
  const auto& content = touca::detail::load_text_file(
      path.string(), std::ios::in | std::ios::binary);

  // verify that given content represents valid flatbuffers data
  if (!flatbuffers::Verifier((const uint8_t*)content.data(), content.size())
           .VerifyBuffer<touca::fbs::Messages>()) {
    throw touca::detail::runtime_error(
        touca::detail::format("result file invalid: {}", path.string()));
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

}  // namespace touca
