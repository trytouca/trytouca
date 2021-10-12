// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "touca/client/convert.hpp"
#include "touca/core/types.hpp"

namespace touca {
namespace compare {
struct TypeComparison;
}
namespace types {

/**
 *
 */
class TOUCA_CLIENT_API ObjectType : public IType {
 public:
  /**
   *
   */
  ObjectType() = default;

  /**
   *
   */
  explicit ObjectType(const std::string& name);

  /**
   *
   */
  value_t type() const override;

  /**
   *
   */
  rapidjson::Value json(RJAllocator& allocator) const override;

  /**
   *
   */
  template <typename T>
  void add(const std::string& key, T value) {
    _values.emplace(key, converter<T>().convert(value));
  }

  /**
   *
   */
  flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& builder) const override;

  /**
   *
   */
  void deserialize(const fbs::Object* fbsObj);

  /**
   *
   */
  compare::TypeComparison compare(
      const std::shared_ptr<IType>& itype) const override;

  /**
   *
   */
  KeyMap flatten() const override;

 private:
  std::string _name;
  KeyMap _values;

};  // class touca::types::ObjectType

}  // namespace types

/**
 *
 */
template <typename T>
struct converter<T, typename std::enable_if<
                        detail::is_specialization<T, std::pair>::value>::type> {
  std::shared_ptr<types::IType> convert(const T& value) {
    auto out = std::make_shared<types::ObjectType>("std::pair");
    out->add("first", value.first);
    out->add("second", value.second);
    return out;
  }
};

/**
 *
 */
template <typename T>
struct converter<T, typename std::enable_if<detail::is_specialization<
                        T, std::shared_ptr>::value>::type> {
  std::shared_ptr<types::IType> convert(const T& value) {
    auto out = std::make_shared<types::ObjectType>("std::shared_ptr");
    if (value) {
      out->add("v", *value);
    }
    return out;
  }
};

}  // namespace touca
