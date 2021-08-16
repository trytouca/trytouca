// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "students_test.hpp"
#include "touca/touca.hpp"
#include "touca/touca_main.hpp"
#include <string>
#include <thread>

void touca::main(const std::string& username)
{
    const auto& student = parse_profile(username);

    touca::add_assertion("username", student.username);
    touca::add_result("fullname", student.fullname);
    touca::add_result("height", student.height);
    touca::add_result("weight", student.weight);
    touca::add_result("birth_date", student.dob);

    custom_function_1(student);

    std::thread t(custom_function_2, student);
    t.join();

    touca::start_timer("func3");
    custom_function_3(student);
    touca::stop_timer("func3");
}
