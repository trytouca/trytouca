// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "students.hpp"
#include <touca/touca.hpp>

template <>
struct touca::convert::Conversion<Date> {
    std::shared_ptr<types::IType> operator()(const Date& value)
    {
        auto out = std::make_shared<types::Object>("Date");
        out->add("year", value.year);
        out->add("month", value.month);
        out->add("day", value.day);
        return out;
    }
};

template <>
struct touca::convert::Conversion<Course> {
    std::shared_ptr<types::IType> operator()(const Course& value)
    {
        auto out = std::make_shared<types::Object>("Course");
        out->add("name", value.name);
        out->add("grade", value.grade);
        return out;
    }
};
