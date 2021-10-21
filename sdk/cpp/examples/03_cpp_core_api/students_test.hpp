// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "students.hpp"
#include "touca/touca.hpp"

template <>
struct touca::converter<Date> {
  std::shared_ptr<IType> convert(const Date& value) {
    auto out = std::make_shared<ObjectType>();
    out->add("year", value.year);
    out->add("month", value.month);
    out->add("day", value.day);
    return out;
  }
};

template <>
struct touca::converter<Course> {
  std::shared_ptr<IType> convert(const Course& value) {
    auto out = std::make_shared<ObjectType>();
    out->add("name", value.name);
    out->add("grade", value.grade);
    return out;
  }
};
