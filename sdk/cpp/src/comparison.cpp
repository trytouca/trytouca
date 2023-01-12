// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/core/comparison.hpp"

#include "rapidjson/document.h"

namespace touca {

std::string Cellar::stringify(const touca::detail::internal_type type) const {
  switch (type) {
    case touca::detail::internal_type::boolean:
      return "bool";
    case touca::detail::internal_type::number_signed:
    case touca::detail::internal_type::number_unsigned:
    case touca::detail::internal_type::number_float:
    case touca::detail::internal_type::number_double:
      return "number";
    case touca::detail::internal_type::string:
      return "string";
    case touca::detail::internal_type::array:
      return "array";
    case touca::detail::internal_type::object:
      return "object";
    default:
      return "unknown";
  }
}

rapidjson::Value Cellar::json(
    rapidjson::Document::AllocatorType& allocator) const {
  auto rj_common = build_json_common(common, allocator);
  auto rj_missing = build_json_solo(missing, Category::Missing, allocator);
  auto rj_fresh = build_json_solo(fresh, Category::Fresh, allocator);
  rapidjson::Value result(rapidjson::kObjectType);
  result.AddMember("commonKeys", rj_common, allocator);
  result.AddMember("missingKeys", rj_missing, allocator);
  result.AddMember("newKeys", rj_fresh, allocator);
  return result;
}

rapidjson::Value Cellar::build_json_solo(const Cellar::KeyMap& keyMap,
                                         const Cellar::Category category,
                                         RJAllocator& allocator) const {
  rapidjson::Value elements(rapidjson::kArrayType);
  for (const auto& kv : keyMap) {
    rapidjson::Value item(rapidjson::kObjectType);
    item.AddMember("name", kv.first, allocator);
    if (category == Category::Fresh) {
      item.AddMember("srcType", stringify(kv.second.type()), allocator);
      item.AddMember("srcValue", kv.second.to_string(), allocator);
    } else {
      item.AddMember("dstType", stringify(kv.second.type()), allocator);
      item.AddMember("dstValue", kv.second.to_string(), allocator);
    }
    elements.PushBack(item, allocator);
  }
  return elements;
}

rapidjson::Value Cellar::build_json_common(
    const ComparisonMap& elements,
    rapidjson::Document::AllocatorType& allocator) const {
  rapidjson::Value items(rapidjson::kArrayType);
  for (const auto& kv : elements) {
    const auto& key = kv.first;
    const auto& second = kv.second;
    rapidjson::Value rjDstType;
    rapidjson::Value rjDstValue;
    rapidjson::Value rjDesc(rapidjson::kArrayType);

    rapidjson::Value rjName{key, allocator};
    rapidjson::Value rjScore{second.score};
    rapidjson::Value rjSrcType{stringify(second.srcType), allocator};
    rapidjson::Value rjSrcValue{second.srcValue, allocator};
    if (touca::detail::internal_type::unknown != second.dstType) {
      rjDstType.Set(stringify(second.dstType), allocator);
    }
    if (MatchType::Perfect != second.match) {
      rjDstValue.Set(second.dstValue, allocator);
    }
    if (!second.desc.empty()) {
      for (const auto& entry : second.desc) {
        rapidjson::Value rjEntry(rapidjson::kStringType);
        rjEntry.SetString(entry, allocator);
        rjDesc.PushBack(rjEntry, allocator);
      }
    }

    rapidjson::Value item(rapidjson::kObjectType);
    item.AddMember("name", rjName, allocator);
    item.AddMember("score", rjScore, allocator);
    item.AddMember("srcType", rjSrcType, allocator);
    item.AddMember("srcValue", rjSrcValue, allocator);
    if (touca::detail::internal_type::unknown != second.dstType) {
      item.AddMember("dstType", rjDstType, allocator);
    }
    if (MatchType::Perfect != second.match) {
      item.AddMember("dstValue", rjDstValue, allocator);
    }
    if (!second.desc.empty()) {
      item.AddMember("desc", rjDesc, allocator);
    }
    items.PushBack(item, allocator);
  }
  return items;
}

}  // namespace touca
