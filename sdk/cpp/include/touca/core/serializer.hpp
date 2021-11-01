// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "touca/core/detail/serializer.hpp"
#include "touca/core/types.hpp"

namespace touca {

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

#endif /** DOXYGEN_SHOULD_SKIP_THIS */

}  // namespace touca
