// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <codecvt>
#include <list>
#include <locale>
#include <map>
#include <set>
#include <string>
#include <unordered_map>
#include <vector>

#ifndef DOXYGEN_SHOULD_SKIP_THIS

namespace touca {
namespace detail {
/**
 * unlike std::integral_constant children such as is_same and
 * is_base_of there is no off-the-shelf function to check if a
 * type is specialization of a template. The following is an
 * implementation of this concept.
 */
template <typename Test, template <typename...> class Ref>
struct is_specialization : std::false_type {};

template <template <typename...> class Ref, typename... Args>
struct is_specialization<Ref<Args...>, Ref> : std::true_type {};

template <typename T>
using is_touca_null = std::is_same<T, std::nullptr_t>;

template <typename T>
using is_touca_boolean = std::is_same<T, bool>;

template <typename T, typename = void>
struct is_touca_number : std::false_type {};

template <typename T>
struct is_touca_number<
    T, typename std::enable_if<std::is_floating_point<T>::value>::type>
    : std::true_type {};

template <typename T>
struct is_touca_number<
    T, typename std::enable_if<std::is_integral<T>::value &&
                               !is_touca_boolean<T>::value>::type>
    : std::true_type {};

template <typename T, typename = void>
struct is_touca_string : std::false_type {};

template <typename T>
struct is_touca_string<T, typename std::enable_if<
                              std::is_convertible<T, std::string>::value>::type>
    : std::true_type {};

template <typename T>
struct is_touca_string<
    T,
    typename std::enable_if<std::is_convertible<T, std::wstring>::value>::type>
    : std::true_type {};

template <typename T, typename = void>
struct is_touca_array : std::false_type {};

template <typename T>
struct is_touca_array<T&> : is_touca_array<T> {};

template <typename... args>
struct is_touca_array<std::vector<args...>> : std::true_type {};

template <typename... args>
struct is_touca_array<std::list<args...>> : std::true_type {};

template <typename... args>
struct is_touca_array<std::set<args...>> : std::true_type {};

template <typename T, std::size_t N>
struct is_touca_array<std::array<T, N>> : std::true_type {};

template <typename T>
struct is_touca_array<
    T, typename std::enable_if<is_specialization<T, std::map>::value>::type>
    : std::true_type {};

template <typename T>
struct is_touca_array<T, typename std::enable_if<is_specialization<
                             T, std::unordered_map>::value>::type>
    : std::true_type {};

template <typename T>
typename std::enable_if<std::is_convertible<T, std::string>::value,
                        std::string>::type
to_string(const T& value) {
  return value;
}

template <typename T>
typename std::enable_if<std::is_convertible<T, std::wstring>::value,
                        std::string>::type
to_string(const T& value) {
  std::wstring_convert<std::codecvt_utf8<wchar_t>> conv;
  return conv.to_bytes(value);
}

}  // namespace detail

}  // namespace touca

#endif  // DOXYGEN_SHOULD_SKIP_THIS
