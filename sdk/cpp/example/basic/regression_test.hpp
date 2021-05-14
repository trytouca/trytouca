/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

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
