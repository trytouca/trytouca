// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "students.hpp"
#include "touca/touca.hpp"

template <>
struct touca::serializer<Date> {
  std::shared_ptr<IType> serialize(const Date& value) {
    auto out = std::make_shared<ObjectType>();
    out->add("year", value._year);
    out->add("month", value._month);
    out->add("day", value._day);
    return out;
  }
};

template <>
struct touca::serializer<Course> {
  std::shared_ptr<IType> serialize(const Course& value) {
    auto out = std::make_shared<ObjectType>();
    out->add("name", value.name);
    out->add("grade", value.grade);
    return out;
  }
};

template <>
struct touca::serializer<Student> {
  std::shared_ptr<IType> serialize(const Student& value) {
    auto out = std::make_shared<ObjectType>();
    out->add("username", value.username);
    out->add("fullname", value.fullname);
    out->add("birth_date", value.dob);
    out->add("gpa", value.gpa);
    return out;
  }
};
