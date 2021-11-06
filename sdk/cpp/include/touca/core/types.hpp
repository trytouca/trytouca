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
 * @brief Non-specialized template declaration of conversion
 *        logic for handling objects of custom types by the
 *        Touca SDK for C++.
 * @tparam T type whose handling logic is to be implemented
 *         in `serialize` member function.
 *
 * @details Allows users developing regression tools to provide
 *          explicit full specialization of this class that makes
 *          it convenient to pass objects of their non-trivial type
 *          directly to Touca API functions that accept testresults.
 *
 * The following example illustrates a specialization of serializer
 * for a custom type `Date`.
 *
 * @code{.cpp}
 *
 *      struct Date {
 *        const unsigned short year;
 *        const unsigned short month;
 *        const unsigned short day;
 *      };
 *
 *      template <>
 *      struct touca::serializer<Date> {
 *        std::shared_ptr<IType> serialize(const Date& value) {
 *          auto out = std::make_shared<ObjectType>("Date");
 *          out->add("year", value.year);
 *          out->add("month", value.month);
 *          out->add("day", value.day);
 *          return out;
 *        }
 *      };
 *
 * @endcode
 *
 * Once declared, this specialization allows user to directly pass objects
 * of type `Date` to Touca server API that accepts test results.
 *
 * @code{.cpp}
 *
 *      Date date { 1961, 8, 4 };
 *      touca::check("birthday", date);
 *
 * @endcode
 *
 * Noteworthy, that declaring a conversion logic for `Date`, enables
 * objects of this type to be used as smaller pieces of even more complex
 * types:
 *
 * @code{.cpp}
 *
 *      struct Person {
 *        const std::string _name;
 *        const Date _birthday;
 *      };
 *
 *      template <>
 *      struct touca::serializer<Person> {
 *        std::shared_ptr<IType> serialize(const Person& value) {
 *          auto out = std::make_shared<ObjectType>("Person");
 *          out->add("name", val._name);
 *          out->add("birthday", val._birthday);
 *          return out;
 *        }
 *      };
 *
 *      Person person { "alex", { 1961, 8, 4 } };
 *      touca::check("person", person);
 *
 * @endcode
 */
template <typename T, typename = void>
struct serializer {
  /**
   * @brief describes logic for handling objects of custom types.
   * @details Implements how object of given type should be decomposed
   *          into smaller objects whose types are known to the
   *          Touca SDK for C++.
   * @param value object to be decomposed into a set of smaller objects
   *              whose types are known to the Touca SDK for C++.
   * @return shared pointer to a generic type that the Touca SDK for C++
   *         knows how to handle.
   */
  std::shared_ptr<IType> serialize(const T& value) {
    static_assert(std::is_same<std::shared_ptr<IType>, T>::value,
                  "did not find any partial specialization of serializer "
                  "function to convert your value to a Touca type");
    return static_cast<T>(value);
  }
};

class TOUCA_CLIENT_API ObjectType : public IType {
 public:
  ObjectType();

  explicit ObjectType(const std::string& name);

  ObjectType(const std::string& name, const KeyMap& values);

  nlohmann::ordered_json json() const override;

  template <typename T>
  void add(const std::string& key, T value) {
    _values.emplace(key, serializer<T>().serialize(value));
  }

  flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& builder) const override;

  TypeComparison compare(const std::shared_ptr<IType>& itype) const override;

  KeyMap flatten() const override;

 private:
  std::string _name;
  KeyMap _values;

};  // class touca::ObjectType

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
