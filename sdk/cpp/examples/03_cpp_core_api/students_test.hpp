// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <touca/touca.hpp>

#include "students.hpp"

template <>
struct touca::converter<Date> {
  std::shared_ptr<types::IType> convert(const Date& value) {
    auto out = std::make_shared<types::ObjectType>();
    out->add("year", value.year);
    out->add("month", value.month);
    out->add("day", value.day);
    return out;
  }
};

template <>
struct touca::converter<Course> {
  std::shared_ptr<types::IType> convert(const Course& value) {
    auto out = std::make_shared<types::ObjectType>();
    out->add("name", value.name);
    out->add("grade", value.grade);
    return out;
  }
};
