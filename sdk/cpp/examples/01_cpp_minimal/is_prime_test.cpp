// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "is_prime.hpp"
#include "touca/touca.hpp"
#include "touca/touca_main.hpp"
#include <string>

void touca::main(const std::string& testcase)
{
    const auto number = std::stoul(testcase);
    touca::add_result("is_prime", is_prime(number));
}
