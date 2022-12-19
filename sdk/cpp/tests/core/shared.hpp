// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "touca/core/serializer.hpp"

class Head {
  friend struct touca::serializer<Head>;

 public:
  explicit Head(const uint64_t eyes) : _eyes(eyes) {}

 private:
  uint64_t _eyes;
};

template <>
struct touca::serializer<Head> {
  data_point serialize(const Head& value) {
    return object("head").add("eyes", value._eyes);
  }
};

/**
 * Helper function to provide `Testcase`, `TestcaseComparison`
 * and `TestcaseComparison::Overview` as json string.
 */
std::string make_json(
    const std::function<rapidjson::Value(touca::RJAllocator&)> func);
