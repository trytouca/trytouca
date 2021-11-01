// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <map>
#include <set>

#include "nlohmann/json_fwd.hpp"
#include "touca/lib_api.hpp"

namespace flatbuffers {
class FlatBufferBuilder;
template <typename Type>
struct Offset;
}  // namespace flatbuffers
namespace touca {
class IType;
struct TypeComparison;
namespace fbs {
struct Array;
struct Object;
struct TypeWrapper;
}  // namespace fbs

enum class ResultCategory { Check = 1, Assert };
struct ResultEntry {
  std::shared_ptr<IType> val;
  ResultCategory typ;
};
struct MetricsMapValue {
  std::shared_ptr<IType> value;
};

using ResultsMap = std::map<std::string, ResultEntry>;
using MetricsMap = std::map<std::string, MetricsMapValue>;
using KeyMap = std::map<std::string, std::shared_ptr<IType>>;

enum class TOUCA_CLIENT_API internal_type : std::uint8_t {
  null,
  object,
  array,
  string,
  boolean,
  number_signed,
  number_unsigned,
  number_float,
  number_double,
  binary,
  unknown
};

class TOUCA_CLIENT_API IType {
 public:
  IType(const IType&) = delete;

  IType& operator=(const IType&) = delete;

  virtual ~IType() = default;

  internal_type type() const;

  std::string string() const;

  virtual nlohmann::ordered_json json() const = 0;

  virtual flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& fbb) const = 0;

  virtual TypeComparison compare(const std::shared_ptr<IType>& itype) const = 0;

  /**
   * This function flattens all of the object's nested ITypes into
   * one flat map. Only ObjectType and ArrayType can have nested
   * values, so they are the only ones to override this default
   */
  virtual KeyMap flatten() const { return {}; }

 protected:
  IType(const internal_type type_t) : _type_t(type_t){};

  const internal_type _type_t;
};

class TOUCA_CLIENT_API NoneType : public IType {
 public:
  explicit NoneType();

  nlohmann::ordered_json json() const override;

  flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& fbb) const override;

  TypeComparison compare(const std::shared_ptr<IType>& itype) const override;
};

class TOUCA_CLIENT_API BooleanType : public IType {
 public:
  explicit BooleanType(bool value);

  nlohmann::ordered_json json() const override;

  flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& fbb) const override;

  TypeComparison compare(const std::shared_ptr<IType>& itype) const override;

 private:
  bool _value;
};

template <class T>
class TOUCA_CLIENT_API NumberType : public IType {
 public:
  explicit NumberType(const T value);

  nlohmann::ordered_json json() const override;

  T value() const;

  flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& fbb) const override;

  TypeComparison compare(const std::shared_ptr<IType>& itype) const override;

 private:
  T _value;
};

class TOUCA_CLIENT_API StringType : public IType {
 public:
  explicit StringType(const std::string& value);

  nlohmann::ordered_json json() const override;

  flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& fbb) const override;

  TypeComparison compare(const std::shared_ptr<IType>& itype) const override;

 private:
  std::string _value;
};

class TOUCA_CLIENT_API ArrayType : public IType {
 public:
  ArrayType();

  void add(const std::shared_ptr<IType>& value);

  nlohmann::ordered_json json() const override;

  flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& fbb) const override;

  TypeComparison compare(const std::shared_ptr<IType>& itype) const override;

  KeyMap flatten() const override;

 private:
  std::vector<std::shared_ptr<IType>> _values;
};

/**
 * @enum MatchType
 * @brief describes overall result of comparing two testcases
 */
enum class MatchType : unsigned char {
  Perfect, /**< Indicates that compared objects were identical */
  None     /**< Indicates that compared objects were different */
};

struct TOUCA_CLIENT_API TypeComparison {
  std::string srcValue;
  std::string dstValue;
  internal_type srcType = internal_type::unknown;
  internal_type dstType = internal_type::unknown;
  double score = 0.0;
  std::set<std::string> desc;
  MatchType match = MatchType::None;
};

}  // namespace touca
