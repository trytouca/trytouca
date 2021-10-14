// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/devkit/deserialize.hpp"

#include "flatbuffers/flatbuffers.h"
#include "touca/core/object.hpp"
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

template <typename T, typename U>
std::shared_ptr<touca::types::IType> deserialize(
    const touca::fbs::TypeWrapper* ptr) {
  const auto& castptr = static_cast<const T*>(ptr->value());
  return std::shared_ptr<touca::types::IType>(new U(castptr->value()));
}

}  // namespace detail

namespace types {

std::shared_ptr<IType> deserialize_value(const fbs::TypeWrapper* ptr) {
  const auto& value = ptr->value();
  const auto& type = ptr->value_type();
  switch (type) {
    case fbs::Type::Bool:
      return detail::deserialize<fbs::Bool, BooleanType>(ptr);
    case fbs::Type::Int:
      return detail::deserialize<fbs::Int, NumberType<int64_t>>(ptr);
    case fbs::Type::UInt:
      return detail::deserialize<fbs::UInt, NumberType<uint64_t>>(ptr);
    case fbs::Type::Float:
      return detail::deserialize<fbs::Float, NumberType<float>>(ptr);
    case fbs::Type::Double:
      return detail::deserialize<fbs::Double, NumberType<double>>(ptr);
    case fbs::Type::String: {
      const auto& str = static_cast<const fbs::String*>(value);
      return std::make_shared<StringType>(str->value()->data());
    }
    case fbs::Type::Object: {
      auto fbsObj = static_cast<const fbs::Object*>(value);
      KeyMap keyMap;
      for (const auto&& value : *fbsObj->values()) {
        keyMap.emplace(value->name()->data(),
                       deserialize_value(value->value()));
      }
      return std::make_shared<ObjectType>(fbsObj->key()->data(), keyMap);
    }
    case fbs::Type::Array: {
      auto fbsArr = static_cast<const fbs::Array*>(value);
      auto arr = std::make_shared<ArrayType>();
      for (const auto&& value : *fbsArr->values()) {
        arr->add(deserialize_value(value));
      }
      return arr;
    }
    default:
      throw std::runtime_error("encountered unexpected type");
  }
}

}  // namespace types

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
    const auto& value = types::deserialize_value(result->value());
    if (!value) {
      throw std::runtime_error("failed to parse results map entry");
    }
    resultsMap.emplace(
        key,
        ResultEntry{value, detail::result_types_reverse.at(result->typ())});
  }

  std::unordered_map<std::string, unsigned long> metricsMap;
  const auto& metrics = message->metrics()->entries();
  for (const auto&& metric : *metrics) {
    const auto& key = metric->key()->data();
    const auto& ivalue = types::deserialize_value(metric->value());
    const auto& value =
        std::dynamic_pointer_cast<types::NumberType<int64_t>>(ivalue);
    if (!value) {
      throw std::runtime_error("failed to parse metrics map entry");
    }
    metricsMap.emplace(key, static_cast<unsigned long>(value->value()));
  }

  return Testcase(metadata, resultsMap, metricsMap);
}
}  // namespace touca
