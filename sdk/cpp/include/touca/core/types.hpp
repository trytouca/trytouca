// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <map>

#include "flatbuffers/flatbuffers.h"
#include "nlohmann/json_fwd.hpp"
#include "touca/lib_api.hpp"

namespace touca {
namespace compare {
struct TypeComparison;
}  // namespace compare
namespace fbs {
struct Array;
struct Object;
struct TypeWrapper;
}  // namespace fbs
namespace types {
class IType;
}  // namespace types

enum class ResultCategory { Check = 1, Assert };
struct ResultEntry {
  std::shared_ptr<types::IType> val;
  ResultCategory typ;
};
struct MetricsMapValue {
  std::shared_ptr<types::IType> value;
};

using ResultsMap = std::map<std::string, ResultEntry>;
using MetricsMap = std::map<std::string, MetricsMapValue>;
using KeyMap = std::map<std::string, std::shared_ptr<types::IType>>;

namespace types {

enum class TOUCA_CLIENT_API value_t : std::uint8_t {
  object,
  array,
  string,
  boolean,
  numeric,
  unknown
};

class TOUCA_CLIENT_API IType {
 public:
  IType(const IType&) = delete;

  IType& operator=(const IType&) = delete;

  virtual ~IType() = default;

  value_t type() const;

  std::string string() const;

  virtual nlohmann::ordered_json json() const = 0;

  virtual flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& fbb) const = 0;

  virtual compare::TypeComparison compare(
      const std::shared_ptr<IType>& itype) const = 0;

  /**
   * This function flattens all of the object's nested ITypes into
   * one flat map. Only ObjectType and ArrayType can have nested
   * values, so they are the only ones to override this default
   */
  virtual KeyMap flatten() const { return {}; }

 protected:
  IType(const value_t type_t) : _type_t(type_t){};

  const value_t _type_t;

};  // class IType

class TOUCA_CLIENT_API BooleanType : public IType {
 public:
  explicit BooleanType(bool value);

  nlohmann::ordered_json json() const override;

  flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& fbb) const override;

  compare::TypeComparison compare(
      const std::shared_ptr<IType>& itype) const override;

 private:
  bool _value;

};  // class touca::types::BooleanType

template <class T>
class TOUCA_CLIENT_API Number : public IType {
 public:
  explicit Number(const T value);

  nlohmann::ordered_json json() const override;

  T value() const;

  flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& fbb) const override;

  compare::TypeComparison compare(
      const std::shared_ptr<IType>& itype) const override;

 private:
  T _value;

};  // class touca::types::Number

class TOUCA_CLIENT_API StringType : public IType {
 public:
  explicit StringType(const std::string& value);

  nlohmann::ordered_json json() const override;

  flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& fbb) const override;

  compare::TypeComparison compare(
      const std::shared_ptr<IType>& itype) const override;

 private:
  std::string _value;

};  // class touca::types::StringType

class TOUCA_CLIENT_API ArrayType : public IType {
 public:
  ArrayType();

  void add(const std::shared_ptr<IType>& value);

  nlohmann::ordered_json json() const override;

  flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& fbb) const override;

  compare::TypeComparison compare(
      const std::shared_ptr<IType>& itype) const override;

  KeyMap flatten() const override;

 private:
  std::vector<std::shared_ptr<IType>> _values;

};  // class touca::types::ArrayType

}  // namespace types
}  // namespace touca
