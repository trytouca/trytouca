// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "students.hpp"
#include "touca/touca.hpp"

template <>
struct touca::converter<Date> {
  std::shared_ptr<types::IType> convert(const Date& value) {
    auto out = std::make_shared<types::ObjectType>();
    out->add("year", value._year);
    out->add("month", value._month);
    out->add("day", value._day);
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

template <>
struct touca::converter<Student> {
  std::shared_ptr<types::IType> convert(const Student& value) {
    auto out = std::make_shared<types::ObjectType>();
    out->add("username", value.username);
    out->add("fullname", value.fullname);
    out->add("birth_date", value.dob);
    out->add("gpa", value.gpa);
    return out;
  }
};
