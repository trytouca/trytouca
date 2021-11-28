// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/devkit/deserialize.hpp"

#include <stdexcept>

#include "flatbuffers/flatbuffers.h"
#include "touca/core/testcase.hpp"
#include "touca/core/types.hpp"
#include "touca/impl/schema.hpp"

namespace touca {
namespace detail {

static const std::unordered_map<fbs::ResultType, ResultCategory>
    result_types_reverse = {
        {fbs::ResultType::Check, ResultCategory::Check},
        {fbs::ResultType::Assert, ResultCategory::Assert},
};

}  // namespace detail

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
      throw std::runtime_error("encountered unexpected type");
  }
}

Testcase deserialize_testcase(const std::vector<uint8_t>& buffer) {
  const auto& message =
      flatbuffers::GetRoot<touca::fbs::Message>(buffer.data());

  const auto& teamSlug = message->metadata()->teamslug()
                             ? message->metadata()->teamslug()->data()
                             : "vital";

  Testcase::Metadata metadata = {teamSlug,
                                 message->metadata()->testsuite()->data(),
                                 message->metadata()->version()->data(),
                                 message->metadata()->testcase()->data(),
                                 message->metadata()->builtAt()->data()};

  ResultsMap resultsMap;
  const auto& results = message->results()->entries();
  for (const auto&& result : *results) {
    const auto& key = result->key()->data();
    const auto& value = deserialize_value(result->value());
    if (value.type() == detail::internal_type::unknown) {
      throw std::runtime_error("failed to parse results map entry");
    }
    resultsMap.emplace(
        key,
        ResultEntry{value, detail::result_types_reverse.at(result->typ())});
  }

  std::unordered_map<std::string, detail::number_unsigned_t> metricsMap;
  const auto& metrics = message->metrics()->entries();
  for (const auto&& metric : *metrics) {
    const auto& key = metric->key()->data();
    const auto& value = deserialize_value(metric->value());
    if (value.type() != detail::internal_type::number_signed) {
      throw std::runtime_error("failed to parse metrics map entry");
    }
    metricsMap.emplace(key, value.as_metric());
  }

  return Testcase(metadata, resultsMap, metricsMap);
}
}  // namespace touca
