// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "students.hpp"
#include "touca/touca.hpp"

template <>
struct touca::convert::Conversion<Date> {
    std::shared_ptr<types::IType> operator()(const Date& value)
    {
        auto out = std::make_shared<types::Object>("Date");
        out->add("year", value._year);
        out->add("month", value._month);
        out->add("day", value._day);
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

template <>
struct touca::convert::Conversion<Student> {
    std::shared_ptr<types::IType> operator()(const Student& value)
    {
        auto out = std::make_shared<types::Object>("Student");
        out->add("username", value.username);
        out->add("fullname", value.fullname);
        out->add("birth_date", value.dob);
        out->add("gpa", value.gpa);
        return out;
    }
};
