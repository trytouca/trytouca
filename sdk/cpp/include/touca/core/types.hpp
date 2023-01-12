// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <cstddef>
#include <cstdint>
#include <iterator>
#include <map>
#include <memory>
#include <string>
#include <tuple>
#include <type_traits>
#include <utility>
#include <vector>

#include "rapidjson/fwd.h"
#include "touca/core/variant.hpp"
#include "touca/lib_api.hpp"

namespace flatbuffers {
class FlatBufferBuilder;
template <typename Type>
struct Offset;
}  // namespace flatbuffers

namespace touca {
class data_point;
struct array;
class object;
template <typename, typename = void>
struct serializer;
struct TypeComparison;
namespace fbs {
struct TypeWrapper;
}  // namespace fbs

using RJAllocator = rapidjson::MemoryPoolAllocator<rapidjson::CrtAllocator>;

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

using object_t = std::map<std::string, data_point>;
using array_t = std::vector<data_point>;
using string_t = std::string;
using boolean_t = bool;
using number_signed_t = int64_t;
using number_unsigned_t = uint64_t;
using number_float_t = float;
using number_double_t = double;

}  // namespace detail

struct TOUCA_CLIENT_API array final {
  friend class data_point;

 public:
  array() : _v() {}

  template <typename T>
  array& add(T&& value) {
    using type =
        typename std::remove_cv<typename std::remove_reference<T>::type>::type;
    _v.push_back(serializer<type>().serialize(std::forward<T>(value)));
    return *this;
  }

  touca::detail::array_t::iterator begin() { return _v.begin(); }
  touca::detail::array_t::iterator end() { return _v.end(); }

  touca::detail::array_t::const_iterator begin() const { return _v.begin(); }
  touca::detail::array_t::const_iterator end() const { return _v.end(); }

  touca::detail::array_t::const_iterator cbegin() const { return _v.cbegin(); }
  touca::detail::array_t::const_iterator cend() const { return _v.cend(); }

 private:
  touca::detail::array_t _v;
};

class TOUCA_CLIENT_API object final {
  friend class data_point;

 public:
  object() : _v() {}
  explicit object(std::string arg_name) : name(std::move(arg_name)), _v() {}

  const std::string& get_name() const noexcept { return name; }

  template <typename T>
  object& add(const std::string& key, T&& value) {
    using type =
        typename std::remove_cv<typename std::remove_reference<T>::type>::type;
    _v.emplace(key, serializer<type>().serialize(std::forward<T>(value)));
    return *this;
  }

  template <typename T>
  object& add(std::string&& key, T&& value) {
    using type =
        typename std::remove_cv<typename std::remove_reference<T>::type>::type;
    _v.emplace(std::move(key),
               serializer<type>().serialize(std::forward<T>(value)));
    return *this;
  }

  touca::detail::object_t::iterator begin() { return _v.begin(); }
  touca::detail::object_t::iterator end() { return _v.end(); }

  touca::detail::object_t::const_iterator begin() const { return _v.begin(); }
  touca::detail::object_t::const_iterator end() const { return _v.end(); }

  touca::detail::object_t::const_iterator cbegin() const { return _v.cbegin(); }
  touca::detail::object_t::const_iterator cend() const { return _v.cend(); }

 private:
  std::string name;
  touca::detail::object_t _v;
};

class TOUCA_CLIENT_API data_point {
  friend TOUCA_CLIENT_API TypeComparison compare(const data_point& src,
                                                 const data_point& dst);
  friend TOUCA_CLIENT_API std::map<std::string, data_point> flatten(
      const data_point& input);
  friend rapidjson::Value to_json(const data_point& value,
                                  RJAllocator& allocator);

 public:
  data_point(const array& value)
      : _type(touca::detail::internal_type::array),
        _value(touca::detail::deep_copy_ptr<array>(value)) {}

  data_point(array&& value)
      : _type(touca::detail::internal_type::array),
        _value(touca::detail::deep_copy_ptr<array>(std::move(value))) {}

  data_point(const object& value)
      : _type(touca::detail::internal_type::object),
        _value(touca::detail::deep_copy_ptr<object>(value)) {}

  data_point(object&& value)
      : _type(touca::detail::internal_type::object),
        _value(touca::detail::deep_copy_ptr<object>(std::move(value))) {}

  static data_point null() noexcept { return data_point(nullptr); }

  static data_point boolean(const touca::detail::boolean_t value) noexcept {
    return data_point(value);
  }

  static data_point number_signed(
      const touca::detail::number_signed_t value) noexcept {
    return data_point(value);
  }

  static data_point number_unsigned(
      const touca::detail::number_unsigned_t value) noexcept {
    return data_point(value);
  }

  static data_point number_double(
      const touca::detail::number_double_t value) noexcept {
    return data_point(value);
  }

  static data_point number_float(
      const touca::detail::number_float_t value) noexcept {
    return data_point(value);
  }

  static data_point string(const touca::detail::string_t& value) {
    return data_point(value);
  }

  static data_point string(touca::detail::string_t&& value) {
    return data_point(std::move(value));
  }

  touca::detail::internal_type type() const noexcept { return _type; }

  touca::detail::array_t* as_array() const noexcept {
    return &detail::get<detail::deep_copy_ptr<array>>(_value)->_v;
  }

  touca::detail::object_t* as_object() const noexcept {
    return &detail::get<detail::deep_copy_ptr<object>>(_value)->_v;
  }

  touca::detail::string_t* as_string() const noexcept {
    return touca::detail::get<detail::deep_copy_ptr<detail::string_t>>(_value);
  }

  touca::detail::boolean_t as_boolean() const noexcept {
    return touca::detail::get<detail::boolean_t>(_value);
  }

  touca::detail::number_signed_t as_number_signed() const noexcept {
    return touca::detail::get<detail::number_signed_t>(_value);
  }

  touca::detail::number_unsigned_t as_number_unsigned() const noexcept {
    return touca::detail::get<detail::number_unsigned_t>(_value);
  }

  touca::detail::number_float_t as_number_float() const noexcept {
    return touca::detail::get<detail::number_float_t>(_value);
  }

  touca::detail::number_double_t as_number_double() const noexcept {
    return touca::detail::get<detail::number_double_t>(_value);
  }

  void increment() noexcept;

  std::string to_string() const;

  touca::detail::number_signed_t as_metric() const noexcept {
    return touca::detail::get<detail::number_signed_t>(_value);
  }

  flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& builder) const;

 private:
  // default, null
  explicit data_point(std::nullptr_t) noexcept
      : _type(touca::detail::internal_type::null), _value(nullptr) {}

  // overloads for different types
  explicit data_point(touca::detail::deep_copy_ptr<object>& obj)
      : _type(touca::detail::internal_type::object), _value(obj) {}

  explicit data_point(touca::detail::deep_copy_ptr<object>&& obj) noexcept
      : _type(touca::detail::internal_type::object), _value(std::move(obj)) {}

  explicit data_point(touca::detail::deep_copy_ptr<array>& arr)
      : _type(touca::detail::internal_type::array), _value(arr) {}

  explicit data_point(touca::detail::deep_copy_ptr<array>&& arr) noexcept
      : _type(touca::detail::internal_type::array), _value(std::move(arr)) {}

  explicit data_point(const touca::detail::string_t& str)
      : _type(touca::detail::internal_type::string),
        _value(touca::detail::deep_copy_ptr<detail::string_t>(str)) {}

  explicit data_point(touca::detail::string_t&& str)
      : _type(touca::detail::internal_type::string),
        _value(touca::detail::deep_copy_ptr<detail::string_t>(std::move(str))) {
  }

  explicit data_point(const touca::detail::deep_copy_ptr<detail::string_t>& obj)
      : _type(touca::detail::internal_type::string), _value(obj) {}

  explicit data_point(
      touca::detail::deep_copy_ptr<detail::string_t>&& obj) noexcept
      : _type(touca::detail::internal_type::string), _value(std::move(obj)) {}

  explicit data_point(touca::detail::boolean_t boolean) noexcept
      : _type(touca::detail::internal_type::boolean), _value(boolean) {}

  explicit data_point(touca::detail::number_signed_t number) noexcept
      : _type(touca::detail::internal_type::number_signed), _value(number) {}

  explicit data_point(touca::detail::number_unsigned_t number) noexcept
      : _type(touca::detail::internal_type::number_unsigned), _value(number) {}

  explicit data_point(touca::detail::number_float_t number) noexcept
      : _type(touca::detail::internal_type::number_float), _value(number) {}

  explicit data_point(touca::detail::number_double_t number) noexcept
      : _type(touca::detail::internal_type::number_double), _value(number) {}

  touca::detail::internal_type _type = touca::detail::internal_type::null;
  touca::detail::variant<
      std::nullptr_t, touca::detail::deep_copy_ptr<object>,
      touca::detail::deep_copy_ptr<array>,
      touca::detail::deep_copy_ptr<detail::string_t>, touca::detail::boolean_t,
      touca::detail::number_signed_t, touca::detail::number_unsigned_t,
      touca::detail::number_float_t, touca::detail::number_double_t>
      _value;
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
 *          directly to Touca API functions that accept test results.
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
template <typename T, typename>  // typename=void, forward-declared on top
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

}  // namespace touca
