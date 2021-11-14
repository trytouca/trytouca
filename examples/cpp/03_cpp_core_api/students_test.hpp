// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "students.hpp"
#include "touca/touca.hpp"

template <>
struct touca::serializer<Date> {
  std::shared_ptr<IType> serialize(const Date& value) {
    auto out = std::make_shared<ObjectType>("Date");
    out->add("year", value.year);
    out->add("month", value.month);
    out->add("day", value.day);
    return out;
  }
};

template <>
struct touca::serializer<Course> {
  std::shared_ptr<IType> serialize(const Course& value) {
    auto out = std::make_shared<ObjectType>("Course");
    out->add("name", value.name);
    out->add("grade", value.grade);
    return out;
  }
};
