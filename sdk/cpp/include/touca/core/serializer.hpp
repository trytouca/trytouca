// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "touca/core/detail/serializer.hpp"
#include "touca/core/types.hpp"

namespace touca {

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
 *          auto out = std::make_shared<ObjectType>();
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
 *          auto out = std::make_shared<ObjectType>();
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

#ifndef DOXYGEN_SHOULD_SKIP_THIS

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

#endif /** DOXYGEN_SHOULD_SKIP_THIS */

}  // namespace touca
