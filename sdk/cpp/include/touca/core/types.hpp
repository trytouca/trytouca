// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <cstddef>
#include <cstdint>
#include <iterator>
#include <map>
#include <memory>
#include <string>
#include <type_traits>
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
template <typename, typename = void>
struct serializer;
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

template <typename T>
static void destroy(T* ptr) {
  if (!ptr) return;

  std::allocator<T> alloc;
  using AllocatorTraits = std::allocator_traits<std::allocator<T>>;

  AllocatorTraits::destroy(alloc, ptr);
  AllocatorTraits::deallocate(alloc, ptr, 1);
}

template <typename T, typename U = T>
static T exchange(T& lhs, U&& rhs) {
  T ret = std::move(lhs);
  lhs = std::forward<U>(rhs);
  return ret;
}

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
  array() : _v(detail::create<detail::array_t>()) {}

  array(const array& other) : _v(detail::create<detail::array_t>(*other._v)) {}

  array(array&& other) noexcept : _v(detail::exchange(other._v, nullptr)) {}

  array& operator=(const array& other) {
    detail::destroy<detail::array_t>(_v);
    _v = detail::create<detail::array_t>(*other._v);
    return *this;
  }

  array& operator=(array&& other) noexcept {
    std::swap(_v, other._v);
    return *this;
  }

  ~array() { detail::destroy<detail::array_t>(_v); }

  template <typename T>
  array& add(T&& value) {
    using type =
        typename std::remove_cv<typename std::remove_reference<T>::type>::type;
    _v->push_back(serializer<type>().serialize(std::forward<T>(value)));
    return *this;
  }

  detail::array_t::iterator begin() { return _v->begin(); }
  detail::array_t::iterator end() { return _v->end(); }

  detail::array_t::const_iterator cbegin() const { return _v->cbegin(); }
  detail::array_t::const_iterator cend() const { return _v->cend(); }

 private:
  detail::array_t* _v;
};

class TOUCA_CLIENT_API object final {
  friend class data_point;
  friend void to_json(nlohmann::json& out, const data_point& value);

 public:
  object() : name(), _v(detail::create<detail::object_t>()) {}

  object(std::string name)
      : name(std::move(name)), _v(detail::create<detail::object_t>()) {}

  object(const object& other)
      : name(other.name), _v(detail::create<detail::object_t>(*other._v)) {}

  object(object&& other) noexcept
      : name(std::move(other.name)), _v(detail::exchange(other._v, nullptr)) {}

  object& operator=(const object& other) {
    name = other.name;
    detail::destroy<detail::object_t>(_v);
    _v = detail::create<detail::object_t>(*other._v);
    return *this;
  }

  object& operator=(object&& other) noexcept {
    name = std::move(other.name);
    std::swap(_v, other._v);
    return *this;
  }

  ~object() { detail::destroy<detail::object_t>(_v); }

  template <typename T>
  object& add(const std::string& key, T&& value) {
    using type =
        typename std::remove_cv<typename std::remove_reference<T>::type>::type;
    _v->emplace(key, serializer<type>().serialize(std::forward<T>(value)));
    return *this;
  }

  template <typename T>
  object& add(std::string&& key, T&& value) {
    using type =
        typename std::remove_cv<typename std::remove_reference<T>::type>::type;
    _v->emplace(std::move(key),
                serializer<type>().serialize(std::forward<T>(value)));
    return *this;
  }

  detail::object_t::iterator begin() { return _v->begin(); }
  detail::object_t::iterator end() { return _v->end(); }

  detail::object_t::const_iterator cbegin() const { return _v->cbegin(); }
  detail::object_t::const_iterator cend() const { return _v->cend(); }

 private:
  std::string name;
  detail::object_t* _v;
};

class TOUCA_CLIENT_API data_point final {
  friend TOUCA_CLIENT_API TypeComparison compare(const data_point& src,
                                                 const data_point& dst);
  friend TOUCA_CLIENT_API std::map<std::string, data_point> flatten(
      const data_point& input);
  friend void to_json(nlohmann::json& out, const data_point& value);

 public:
  data_point(const array& value)
      : _type(detail::internal_type::array),
        _array(detail::create<detail::array_t>(*value._v)) {}

  data_point(array&& value) noexcept
      : _type(detail::internal_type::array),
        _array(detail::exchange(value._v, nullptr)) {}

  data_point(const object& value)
      : _type(detail::internal_type::object),
        _object(detail::create<detail::object_t>(*value._v)),
        _name(value.name) {}

  data_point(object&& value) noexcept
      : _type(detail::internal_type::object),
        _object(detail::exchange(value._v, nullptr)),
        _name(std::move(value.name)) {}

  data_point(const data_point& other) { init_from_other(other, false); }
  data_point(data_point&& other) noexcept {
    init_from_other(std::move(other), false);
  }

  data_point& operator=(const data_point& other) {
    destroy();
    init_from_other(other, true);
    return *this;
  }

  data_point& operator=(data_point&& other) noexcept {
    init_from_other(std::move(other), true);
    return *this;
  }

  ~data_point() { destroy(); };

  static data_point null() noexcept { return data_point(nullptr); }

  static data_point boolean(const detail::boolean_t value) noexcept {
    return data_point(value);
  }

  static data_point number_signed(
      const detail::number_signed_t value) noexcept {
    return data_point(value);
  }

  static data_point number_unsigned(
      const detail::number_unsigned_t value) noexcept {
    return data_point(value);
  }

  static data_point number_double(
      const detail::number_double_t value) noexcept {
    return data_point(value);
  }

  static data_point number_float(const detail::number_float_t value) noexcept {
    return data_point(value);
  }

  static data_point string(detail::string_t value) {
    return data_point(detail::create<std::string>(std::move(value)));
  }

  detail::internal_type type() const noexcept { return _type; }

  detail::array_t* as_array() const noexcept { return _array; }

  void increment() noexcept;
  std::string to_string() const;

  detail::number_unsigned_t as_metric() const noexcept {
    return _number_unsigned;
  }

  flatbuffers::Offset<fbs::TypeWrapper> serialize(
      flatbuffers::FlatBufferBuilder& builder) const;

 private:
  // default, null
  explicit data_point(std::nullptr_t) noexcept
      : _type(detail::internal_type::null), _object(nullptr) {}

  // overloads for different types
  explicit data_point(detail::object_t* obj) noexcept
      : _type(detail::internal_type::object), _object(obj) {}

  explicit data_point(detail::array_t* arr) noexcept
      : _type(detail::internal_type::array), _array(arr) {}

  explicit data_point(detail::string_t* str) noexcept
      : _type(detail::internal_type::string), _string(str) {}

  explicit data_point(detail::boolean_t boolean) noexcept
      : _type(detail::internal_type::boolean), _boolean(boolean) {}

  explicit data_point(detail::number_signed_t number) noexcept
      : _type(detail::internal_type::number_signed), _number_signed(number) {}

  explicit data_point(detail::number_unsigned_t number) noexcept
      : _type(detail::internal_type::number_unsigned),
        _number_unsigned(number) {}

  explicit data_point(detail::number_float_t number) noexcept
      : _type(detail::internal_type::number_float), _number_float(number) {}

  explicit data_point(detail::number_double_t number) noexcept
      : _type(detail::internal_type::number_double), _number_double(number) {}

  // assign parameter won't be used for copy.
  void init_from_other(const data_point& other, bool assign);
  void init_from_other(data_point&& other, bool assign) noexcept;
  void destroy();

  detail::internal_type _type = detail::internal_type::null;
  union {
    detail::object_t* _object;
    detail::array_t* _array;
    detail::string_t* _string;
    detail::boolean_t _boolean;
    detail::number_signed_t _number_signed;
    detail::number_unsigned_t _number_unsigned;
    detail::number_float_t _number_float;
    detail::number_double_t _number_double;
  };
  std::string _name{};
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
