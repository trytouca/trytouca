// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "students.hpp"
#include "touca/touca.hpp"

template <>
struct touca::serializer<Date> {
  data_point serialize(const Date& value) {
    return object("Date")
        .add("year", value.year)
        .add("month", value.month)
        .add("day", value.day);
  }
};

template <>
struct touca::serializer<Course> {
  data_point serialize(const Course& value) {
    return object("Course").add("name", value.name).add("grade", value.grade);
  }
};
