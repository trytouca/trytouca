// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "students_test.hpp"
#include <iostream>
#include <thread>

int main()
{
    touca::configure();

    if (!touca::is_configured()) {
        std::cerr << touca::configuration_error() << std::endl;
        return EXIT_FAILURE;
    }

    for (const auto& username : { "alice", "bob", "charlie" }) {
        touca::declare_testcase(username);

        const auto& student = parse_profile(username);

        touca::add_assertion("username", student.username);
        touca::add_result("fullname", student.fullname);
        touca::add_result("birth_date", student.dob);
        touca::add_result("gpa", calculate_gpa(student.courses));

        custom_function_1(student);

        std::thread t(custom_function_2, student);
        t.join();

        touca::start_timer("func3");
        custom_function_3(student);
        touca::stop_timer("func3");

        touca::add_metric("external", 10);
        touca::post();
    }

    touca::seal();
    touca::save_binary("touca_tutorial.bin");
    touca::save_json("touca_tutorial.json");

    return EXIT_SUCCESS;
}
