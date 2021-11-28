// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <cstdint>
#include <map>
#include <memory>
#include <string>
#include <utility>
#include <vector>

#include "nlohmann/json_fwd.hpp"
#include "touca/lib_api.hpp"

namespace flatbuffers {
class FlatBufferBuilder;
template <typename Type>
struct Offset;
}  // namespace flatbuffers

namespace touca {
class data_point;
class object;
struct array;
struct TypeComparison;
namespace fbs {
struct TypeWrapper;
}  // namespace fbs
namespace detail {

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
  unknown
};

template <typename T, typename... Args>
static T* create(Args&&... args) {
  std::allocator<T> alloc;
  using AllocatorTraits = std::allocator_traits<std::allocator<T>>;

  auto deleter = [&](T* obj) { AllocatorTraits::deallocate(alloc, obj, 1); };
  std::unique_ptr<T, decltype(deleter)> obj(AllocatorTraits::allocate(alloc, 1),
                                            deleter);
  AllocatorTraits::construct(alloc, obj.get(), std::forward<Args>(args)...);
  return obj.release();
}

using object_t = std::map<std::string, data_point>;
using array_t = std::vector<data_point>;
using string_t = std::string;
using boolean_t = bool;
using number_signed_t = int64_t;
using number_unsigned_t = uint64_t;
using number_float_t = float;
using number_double_t = double;

union internal_value {
  object_t* object;
  array_t* array;
  string_t* string;
  boolean_t boolean;
  number_signed_t number_signed;
  number_unsigned_t number_unsigned;
  number_float_t number_float;
  number_double_t number_double;

  internal_value();
  internal_value(const boolean_t v) noexcept;
  internal_value(const number_signed_t v) noexcept;
  internal_value(const number_unsigned_t v) noexcept;
  internal_value(const number_float_t v) noexcept;
  internal_value(const number_double_t v) noexcept;
  internal_value(const string_t& v) noexcept;
  static internal_value as_array();
  static internal_value as_object();
};

}  // namespace detail

class TOUCA_CLIENT_API data_point {
  friend TOUCA_CLIENT_API TypeComparison compare(const data_point& src,
                                                 const data_point& dst);
  friend TOUCA_CLIENT_API std::map<std::string, data_point> flatten(
      const data_point& input);
  friend void to_json(nlohmann::json& out, const data_point& value);

 public:
  data_point(const array& value);
  data_point(const object& value);

  static data_point null();
  static data_point boolean(const detail::boolean_t value);
  static data_point number_signed(const detail::number_signed_t value);
  static data_point number_unsigned(const detail::number_unsigned_t value);
  static data_point number_double(const detail::number_double_t value);
  static data_point number_float(const detail::number_float_t value);
  static data_point string(const detail::string_t& value);

  void increment();
  detail::array_t* as_array() const;
  detail::number_unsigned_t as_metric() const;
  detail::internal_type type() const;
  std::string to_string() const;

  flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& builder) const;

 private:
  explicit data_point(detail::internal_type type);
  explicit data_point(detail::internal_type type,
                      const detail::internal_value& value);

  detail::internal_type _type = detail::internal_type::null;
  detail::internal_value _value;
  std::string _name;
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
 *        data_point serialize(const Date& value) {
 *          return object("Date")
 *            .add("year", value.year)
 *            .add("month", value.month)
 *            .add("day", value.day);
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
 *        const std::string name;
 *        const Date birthday;
 *      };
 *
 *      template <>
 *      struct touca::serializer<Person> {
 *        data_point serialize(const Person& value) {
 *          return object("Person")
 *            .add("name", val.name)
 *            .add("birthday", val.birthday);
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
  data_point serialize(const T& value) {
    static_assert(std::is_same<data_point, T>::value,
                  "did not find any specialization of serializer "
                  "to serialize your value to a Touca type");
    return static_cast<T>(value);
  }
};

struct TOUCA_CLIENT_API array {
  friend class data_point;

 public:
  array() : _v(detail::create<detail::array_t>()) {}

  template <typename T>
  array& add(const T& value) {
    _v->push_back(serializer<T>().serialize(value));
    return *this;
  }

 private:
  detail::array_t* _v;
};

class TOUCA_CLIENT_API object {
  friend class data_point;
  friend void to_json(nlohmann::json& out, const data_point& value);

 public:
  object(const std::string& name = "")
      : name(name), _v(detail::create<detail::object_t>()) {}

  template <typename T>
  object& add(const std::string& key, const T& value) {
    _v->emplace(key, serializer<T>().serialize(value));
    return *this;
  }

 private:
  std::string name;
  detail::object_t* _v;
};

}  // namespace touca
