// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <array>
#include <codecvt>
#include <list>
#include <locale>
#include <map>
#include <string>
#include <unordered_map>
#include <utility>

#include "touca/core/types.hpp"

namespace touca {

#ifndef DOXYGEN_SHOULD_SKIP_THIS

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
using is_touca_boolean = std::is_same<T, bool>;

template <typename T, typename Enable = void>
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

template <typename T, typename Enable = void>
struct is_touca_string : std::false_type {};

// template <typename C, typename T, typename A>
// struct is_touca_string<std::basic_string<C, T, A>> :
// std::true_type
// {};

template <typename T>
struct is_touca_string<T, typename std::enable_if<
                              std::is_convertible<T, std::string>::value>::type>
    : std::true_type {};

template <typename T>
struct is_touca_string<
    T,
    typename std::enable_if<std::is_convertible<T, std::wstring>::value>::type>
    : std::true_type {};

template <typename T, typename Enable = void>
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

#endif  // DOXYGEN_SHOULD_SKIP_THIS

/**
 * @brief Non-specialized template declaration of conversion
 *        logic for handling objects of custom types by the
 *        Touca SDK for C++.
 * @tparam T type whose handling logic is to be implemented
 *           in `convert` member function.
 *
 * @details Allows users developing regression tools to provide
 *          explicit full specialization of this class that makes
 *          it convenient to pass objects of their non-trivial type
 *          directly to Touca API functions that accept testresults.
 *
 * The following example illustrates a specialization of converter
 * for a custom type `Date`.
 *
 * @code{.cpp}
 *
 *      struct Date
 *      {
 *          const unsigned short _year;
 *          const unsigned short _month;
 *          const unsigned short _day;
 *      };
 *
 *      template <>
 *      struct touca::converter<Date>
 *      {
 *          std::shared_ptr<types::IType> convert(const Date& value)
 *          {
 *              auto out = std::make_shared<types::ObjectType>();
 *              out->add("year", value._year);
 *              out->add("month", value._month);
 *              out->add("day", value._day);
 *              return out;
 *          }
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
 *      struct Person
 *      {
 *          const std::string _name;
 *          const Date _birthday;
 *      };
 *
 *      template <>
 *      struct touca::converter<Person>
 *      {
 *          std::shared_ptr<types::IType> convert(const Person& value)
 *          {
 *              auto out = std::make_shared<types::ObjectType>();
 *              out->add("name", val._name);
 *              out->add("birthday", val._birthday);
 *              return out;
 *          }
 *      };
 *
 *      Person person { "alex", { 1961, 8, 4 } };
 *      touca::check("person", person);
 *
 * @endcode
 */
template <typename T, typename Enable = void>
struct converter {
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
  std::shared_ptr<types::IType> convert(const T& value) {
    static_assert(std::is_same<std::shared_ptr<types::IType>, T>::value,
                  "did not find any partial specialization of converter "
                  "function to convert your value to a Touca type");
    return static_cast<T>(value);
  }
};

#ifndef DOXYGEN_SHOULD_SKIP_THIS

/**
 * @brief converter specialization that describes how any type that
 *        details to touca boolean specifications should be handled
 *        by the Touca SDK for C++.
 */
template <typename T>
struct converter<
    T, typename std::enable_if<detail::is_touca_boolean<T>::value>::type> {
  std::shared_ptr<types::IType> convert(const T& value) {
    return std::make_shared<types::BooleanType>(value);
  }
};

/**
 * @brief converter specialization that describes how any type that
 *        details to touca number specifications should be handled
 *        by the Touca SDK for C++.
 */
template <typename T>
struct converter<
    T, typename std::enable_if<detail::is_touca_number<T>::value>::type> {
  std::shared_ptr<types::IType> convert(const T& value) {
    return std::make_shared<types::Number<T>>(value);
  }
};

/**
 * @brief converter specialization that describes how any type that
 *        details to touca string specifications should be handled
 *        by the Touca SDK for C++.
 */
template <typename T>
struct converter<
    T, typename std::enable_if<detail::is_touca_string<T>::value>::type> {
  std::shared_ptr<types::IType> convert(const T& value) {
    return std::make_shared<types::StringType>(detail::to_string<T>(value));
  }
};

/**
 * @brief converter specialization that describes how any type that
 *        details to touca array specifications should be handled
 *        by the Touca SDK for C++.
 */
template <typename T>
struct converter<
    T, typename std::enable_if<detail::is_touca_array<T>::value>::type> {
  std::shared_ptr<types::IType> convert(const T& value) {
    auto out = std::make_shared<types::ArrayType>();
    for (const auto& v : value) {
      out->add(converter<typename T::value_type>().convert(v));
    }
    return out;
  }
};

#endif /** DOXYGEN_SHOULD_SKIP_THIS */

}  // namespace touca
