/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "weasel/devkit/types.hpp"
#include <array>
#include <codecvt>
#include <list>
#include <locale>
#include <map>
#include <string>
#include <unordered_map>
#include <utility>

/**
 * @def WEASEL_CONVERSION_LOGIC
 * @brief convenience macro for defining conversion logic for a custom type
 * @details
 *
 * This macro abstracts away template specialization declaration for
 * handling custom types by Weasel C++ Client Library. We recommend using this
 * macro together with WEASEL_CONVERSION_FUNCTION and WEASEL_CUSTOM_TYPE
 * macros.
 *
 * A sample code snippet to define how Weasel should handle an object
 * of type `some_type` is provided as follows:
 *
 * @code
 *      struct some_type
 *      {
 *          int number;
 *          std::string message;
 *      };
 *
 *      WEASEL_CONVERSION_LOGIC(some_type)
 *      {
 *          WEASEL_CONVERSION_FUNCTION(some_type, value)
 *          {
 *              auto out = WEASEL_CUSTOM_TYPE("some_type");
 *              out->add("number", value.number);
 *              out->add("message", value.message);
 *              return out;
 *          }
 *      }
 * @endcode
 *
 * @see weasel::convert::Conversion
 *      for more information about handling objects of custom types
 *      by Weasel C++ Client Library
 */
#define WEASEL_CONVERSION_LOGIC(T) \
    template <>                    \
    struct weasel::convert::Conversion<T>

/**
 * @def WEASEL_CONVERSION_FUNCTION
 * @brief convenience macro for defining conversion logic for a custom type
 *
 * @see weasel::convert::Conversion
 *      for more information about handling objects of custom types
 *      by Weasel C++ Client Library
 */
#define WEASEL_CONVERSION_FUNCTION(T, N) \
    std::shared_ptr<types::IType> operator()(const T& N)

/**
 * @def WEASEL_CUSTOM_TYPE
 * @brief convenience macro for defining conversion logic for a custom type
 *
 * @see weasel::convert::Conversion
 *      for more information about handling objects of custom types
 *      by Weasel C++ Client Library
 */
#define WEASEL_CUSTOM_TYPE(N) std::make_shared<types::Object>(N)

namespace weasel { namespace convert {

#ifndef DOXYGEN_SHOULD_SKIP_THIS

    namespace conform {
        /**
         * unlike std::integral_constant children such as is_same and
         * is_base_of there is no off-the-shelf function to check if a
         * type is specialization of a template. The following is an
         * implementation of this concept.
         */
        template <typename Test, template <typename...> class Ref>
        struct is_specialization : std::false_type
        {
        };

        template <template <typename...> class Ref, typename... Args>
        struct is_specialization<Ref<Args...>, Ref> : std::true_type
        {
        };

        template <typename T>
        using is_weasel_boolean = std::is_same<T, bool>;

        template <typename T, typename Enable = void>
        struct is_weasel_number : std::false_type
        {
        };

        template <typename T>
        struct is_weasel_number<
            T,
            typename std::enable_if<std::is_floating_point<T>::value>::type>
            : std::true_type
        {
        };

        template <typename T>
        struct is_weasel_number<
            T,
            typename std::enable_if<
                std::is_integral<T>::value
                && !is_weasel_boolean<T>::value>::type> : std::true_type
        {
        };

        template <typename T, typename Enable = void>
        struct is_weasel_string : std::false_type
        {
        };

        // template <typename C, typename T, typename A>
        // struct is_weasel_string<std::basic_string<C, T, A>> :
        // std::true_type
        // {};

        template <typename T>
        struct is_weasel_string<
            T,
            typename std::enable_if<
                std::is_convertible<T, std::string>::value>::type>
            : std::true_type
        {
        };

        template <typename T>
        struct is_weasel_string<
            T,
            typename std::enable_if<
                std::is_convertible<T, std::wstring>::value>::type>
            : std::true_type
        {
        };

        template <typename T, typename Enable = void>
        struct is_weasel_array : std::false_type
        {
        };

        template <typename T>
        struct is_weasel_array<T&> : is_weasel_array<T>
        {
        };

        template <typename... args>
        struct is_weasel_array<std::vector<args...>> : std::true_type
        {
        };

        template <typename... args>
        struct is_weasel_array<std::list<args...>> : std::true_type
        {
        };

        template <typename... args>
        struct is_weasel_array<std::set<args...>> : std::true_type
        {
        };

        template <typename T, std::size_t N>
        struct is_weasel_array<std::array<T, N>> : std::true_type
        {
        };

        template <typename T>
        struct is_weasel_array<
            T,
            typename std::enable_if<
                is_specialization<T, std::map>::value>::type> : std::true_type
        {
        };

        template <typename T>
        struct is_weasel_array<
            T,
            typename std::enable_if<
                is_specialization<T, std::unordered_map>::value>::type>
            : std::true_type
        {
        };

        template <typename T>
        typename std::enable_if<
            std::is_convertible<T, std::string>::value,
            std::string>::type
        to_string(const T& value)
        {
            return value;
        }

        template <typename T>
        typename std::enable_if<
            std::is_convertible<T, std::wstring>::value,
            std::string>::type
        to_string(const T& value)
        {
            std::wstring_convert<std::codecvt_utf8<wchar_t>> conv;
            return conv.to_bytes(value);
        }

    } // namespace conform

#endif // DOXYGEN_SHOULD_SKIP_THIS

    /**
     * @brief Non-specialized template declaration of conversion
     *        logic for handling objects of custom types by the
     *        Weasel C++ Client Library.
     * @tparam T type whose handling logic is to be implemented
     *           in `operator()()` member function.
     *
     * @details Allows users developing regression tools to provide
     *          explicit full speciailization of this class that makes
     *          it convenient to pass objects of their non-trivial type
     *          directly to Weasel API functions that accept testresults.
     *
     * The following example illustrates a spcialization of Conversion
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
     *      struct weasel::convert::Conversion<Date>
     *      {
     *          std::shared_ptr<types::IType> operator()(const Date& value)
     *          {
     *              auto out = std::make_shared<types::Object>("Date");
     *              out->add("year", value._year);
     *              out->add("month", value._month);
     *              out->add("day", value._day);
     *              return out;
     *          }
     *      };
     *
     * @endcode
     *
     * You may also opt to leverage convenience macros provided by the
     * Weasel C++ Client Library to abstract away the template specialization
     * syntax. To illustrate, the conversion logic shown above can also be
     * declared as the following:
     *
     * @code{.cpp}
     *
     *      WEASEL_CONVERSION_LOGIC(Date)
     *      {
     *          WEASEL_CONVERSION_FUNCTION(Date, value)
     *          {
     *              auto out = WEASEL_CUSTOM_TYPE("Date");
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
     * of type `Date` to Weasel API that accept testresults.
     *
     * @code{.cpp}
     *
     *      Date date { 1961, 8, 4 };
     *      weasel::add_result("Obama's Birthday", date);
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
     *      WEASEL_CONVERSION_LOGIC(Person)
     *      {
     *          WEASEL_CONVERSION_FUNCTION(Person, value)
     *          {
     *              auto out = WEASEL_CUSTOM_TYPE("Person");
     *              out->add("name", val._name);
     *              out->add("birthday", val._birthday);
     *              return out;
     *          }
     *      };
     *
     *      Person president { "obama", { 1961, 8, 4 } };
     *      weasel::add_result("44th", president);
     *
     * @endcode
     */
    template <typename T, typename Enable = void>
    struct Conversion
    {
        /**
         * @brief describes logic for handling objects of custom types.
         * @details Implements how object of given type should be decomposed
         *          into smaller objects whose types are known to the Weasel
         *          C++ Client Library.
         * @param value object to be decomposed into a set of smaller objects
         *              whose types are known to the Weasel C++ Client Library.
         * @return shared pointer to a generic type that the Weasel
         *         C++ Client Library knows how to handle.
         */
        std::shared_ptr<types::IType> operator()(const T& value)
        {
            static_assert(
                std::is_same<std::shared_ptr<types::IType>, T>::value,
                "did not find any partial specialization of Conversion "
                "function to convert your value to a weasel type");
            return static_cast<T>(value);
        }
    };

#ifndef DOXYGEN_SHOULD_SKIP_THIS

    /**
     * @brief Conversion specialization that describes how any type that
     *        conforms to weasel boolean specifications should be handled
     *        by the Weasel C++ Client Library.
     */
    template <typename T>
    struct Conversion<
        T,
        typename std::enable_if<conform::is_weasel_boolean<T>::value>::type>
    {
        std::shared_ptr<types::IType> operator()(const T& value)
        {
            return std::make_shared<types::Bool>(value);
        }
    };

    /**
     * @brief Conversion specialization that describes how any type that
     *        conforms to weasel number specifications should be handled
     *        by the Weasel C++ Client Library.
     */
    template <typename T>
    struct Conversion<
        T,
        typename std::enable_if<conform::is_weasel_number<T>::value>::type>
    {
        std::shared_ptr<types::IType> operator()(const T& value)
        {
            return std::make_shared<types::Number<T>>(value);
        }
    };

    /**
     * @brief Conversion specialization that describes how any type that
     *        conforms to weasel string specifications should be handled
     *        by the Weasel C++ Client Library.
     */
    template <typename T>
    struct Conversion<
        T,
        typename std::enable_if<conform::is_weasel_string<T>::value>::type>
    {
        std::shared_ptr<types::IType> operator()(const T& value)
        {
            return std::make_shared<types::String>(
                conform::to_string<T>(value));
        }
    };

    /**
     * @brief Conversion specialization that describes how any type that
     *        conforms to weasel array specifications should be handled
     *        by the Weasel C++ Client Library.
     */
    template <typename T>
    struct Conversion<
        T,
        typename std::enable_if<conform::is_weasel_array<T>::value>::type>
    {
        std::shared_ptr<types::IType> operator()(const T& value)
        {
            auto out = std::make_shared<types::Array>();
            for (const auto& v : value)
            {
                out->add(Conversion<typename T::value_type>()(v));
            }
            return out;
        }
    };

#endif /** DOXYGEN_SHOULD_SKIP_THIS */

}} // namespace weasel::convert
