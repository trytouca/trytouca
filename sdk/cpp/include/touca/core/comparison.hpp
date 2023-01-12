// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <set>
#include <unordered_map>

#include "rapidjson/fwd.h"
#include "touca/core/types.hpp"

namespace touca {

/**
 * @enum touca::MatchType
 * @brief describes overall result of comparing two testcases
 */
enum class MatchType : unsigned char {
  Perfect, /**< Indicates that compared objects were identical */
  None     /**< Indicates that compared objects were different */
};

struct TOUCA_CLIENT_API TypeComparison {
  std::string srcValue;
  std::string dstValue;
  touca::detail::internal_type srcType = touca::detail::internal_type::unknown;
  touca::detail::internal_type dstType = touca::detail::internal_type::unknown;
  double score = 0.0;
  std::set<std::string> desc;
  MatchType match = MatchType::None;
};

struct TOUCA_CLIENT_API Cellar {
  using ComparisonMap = std::unordered_map<std::string, TypeComparison>;
  using KeyMap = std::map<std::string, data_point>;
  enum class Category { Common, Missing, Fresh };

  ComparisonMap common;
  KeyMap missing;
  KeyMap fresh;

  rapidjson::Value json(RJAllocator& allocator) const;

 private:
  std::string stringify(const touca::detail::internal_type type) const;

  rapidjson::Value build_json_solo(const KeyMap& elements,
                                   const Category category,
                                   RJAllocator& allocator) const;

  rapidjson::Value build_json_common(const ComparisonMap& elements,
                                     RJAllocator& allocator) const;
};

}  // namespace touca
