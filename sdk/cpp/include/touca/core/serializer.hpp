// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <codecvt>
#include <locale>
#include <string>
#include <type_traits>

#include "touca/core/config.hpp"
#include "touca/core/types.hpp"

namespace touca {
#ifndef DOXYGEN_SHOULD_SKIP_THIS
namespace detail {

#ifdef TOUCA_HAS_CPP14

using std::enable_if_t;

#else

template <bool B, typename T = void>
using enable_if_t = typename std::enable_if<B, T>::type;

#endif

#ifdef TOUCA_HAS_CPP17

using std::conjunction;
using std::disjunction;
using std::negation;
using std::void_t;

#else

template <typename...>
struct conjunction : std::true_type {};

template <typename T>
struct conjunction<T> : T {};

template <typename T, typename... Ts>
struct conjunction<T, Ts...>
    : std::conditional<T::value != false, conjunction<Ts...>, T>::type {};

template <typename...>
struct disjunction : std::false_type {};

template <typename T>
struct disjunction<T> : T {};

template <typename T, typename... Ts>
struct disjunction<T, Ts...>
    : std::conditional<T::value != false, T, disjunction<Ts...>>::type {};

template <typename T>
struct negation : std::integral_constant<bool, !T::value> {};

template <typename...>
using void_t = void;

#endif

template <typename Test, template <typename...> class Ref>
struct is_specialization : std::false_type {};

template <template <typename...> class Ref, typename... Args>
struct is_specialization<Ref<Args...>, Ref> : std::true_type {};

template <typename T, typename = void>
struct is_iterable : std::false_type {};

template <typename T>
struct is_iterable<T, void_t<decltype(std::begin(std::declval<T>())),
                             decltype(std::end(std::declval<T>()))>>
    : std::true_type {};

template <typename T>
using remove_cv_ref_t =
    typename std::remove_cv<typename std::remove_reference<T>::type>::type;

template <typename T>
using is_touca_null = std::is_same<T, std::nullptr_t>;

template <typename T>
using is_touca_boolean = std::is_same<T, bool>;

template <typename T>
using is_touca_number_signed =
    conjunction<negation<std::is_same<T, bool>>, std::is_integral<T>,
                std::is_signed<T>>;

template <typename T>
using is_touca_number_unsigned =
    conjunction<negation<std::is_same<T, bool>>, std::is_integral<T>,
                negation<std::is_signed<T>>>;

template <typename T>
using is_touca_number_float =
    conjunction<std::is_floating_point<T>, std::is_same<float, T>>;

template <typename T>
using is_touca_number_double =
    conjunction<std::is_floating_point<T>, std::is_same<double, T>>;

template <typename T>
using is_touca_string =
    conjunction<negation<is_touca_null<T>>,
                disjunction<std::is_constructible<std::string, T>,
                            std::is_constructible<std::wstring, T>>>;

template <typename T>
using is_touca_array =
    conjunction<negation<is_touca_string<T>>, detail::is_iterable<T>>;

template <typename T>
enable_if_t<std::is_convertible<T, std::string>::value, std::string> to_string(
    const T& value) {
  return value;
}

template <typename T>
enable_if_t<std::is_convertible<T, std::wstring>::value, std::string> to_string(
    const T& value) {
  std::wstring_convert<std::codecvt_utf8<wchar_t>> conv;
  return conv.to_bytes(value);
}

template <typename T, typename = void>
struct is_touca_number : std::false_type {};

template <typename T>
struct is_touca_number<T, enable_if_t<std::is_floating_point<T>::value>>
    : std::true_type {};

template <typename T>
struct is_touca_number<
    T, enable_if_t<std::is_integral<T>::value && !is_touca_boolean<T>::value>>
    : std::true_type {};

}  // namespace detail

template <typename T>
struct serializer<
    T, typename std::enable_if<detail::is_touca_null<T>::value>::type> {
  std::shared_ptr<IType> serialize(const T& value) {
    std::ignore = value;
    return std::make_shared<NoneType>();
  }
};

template <typename T>
struct serializer<
    T, typename std::enable_if<detail::is_touca_boolean<T>::value>::type> {
  std::shared_ptr<IType> serialize(const T& value) {
    return std::make_shared<BooleanType>(value);
  }
};

template <typename T>
struct serializer<
    T, typename std::enable_if<detail::is_touca_number<T>::value>::type> {
  std::shared_ptr<IType> serialize(const T& value) {
    return std::make_shared<NumberType<T>>(value);
  }
};

template <typename T>
struct serializer<
    T, typename std::enable_if<detail::is_touca_string<T>::value>::type> {
  std::shared_ptr<IType> serialize(const T& value) {
    return std::make_shared<StringType>(detail::to_string<T>(value));
  }
};

template <typename T>
struct serializer<
    T, typename std::enable_if<detail::is_touca_array<T>::value>::type> {
  std::shared_ptr<IType> serialize(const T& value) {
    auto out = std::make_shared<ArrayType>();
    for (const auto& v : value) {
      out->add(serializer<typename T::value_type>().serialize(v));
    }
    return out;
  }
};

template <typename T>
struct serializer<T, typename std::enable_if<detail::is_specialization<
                         T, std::pair>::value>::type> {
  std::shared_ptr<IType> serialize(const T& value) {
    auto out = std::make_shared<ObjectType>("std::pair");
    out->add("first", value.first);
    out->add("second", value.second);
    return out;
  }
};

template <typename T>
struct serializer<T, typename std::enable_if<detail::is_specialization<
                         T, std::shared_ptr>::value>::type> {
  std::shared_ptr<IType> serialize(const T& value) {
    auto out = std::make_shared<ObjectType>("std::shared_ptr");
    if (value) {
      out->add("v", *value);
    }
    return out;
  }
};

#endif  // DOXYGEN_SHOULD_SKIP_THIS
}  // namespace touca
