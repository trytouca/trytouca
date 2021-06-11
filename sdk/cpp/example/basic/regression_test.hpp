// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "code_under_test.hpp"
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
