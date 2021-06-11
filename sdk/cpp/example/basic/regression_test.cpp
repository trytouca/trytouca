// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "regression_test.hpp"
#include <iostream>
#include <thread>

int main()
{
    touca::configure(
        { { "api-key", "<YOUR API KEY>" },
            { "api-url", "<YOUR API URL>" },
            { "version", "1.0" } });

    if (!touca::is_configured()) {
        std::cerr << touca::configuration_error() << std::endl;
        return EXIT_FAILURE;
    }

    for (const auto& username : { "rweasley", "hpotter", "hgranger" }) {
        touca::declare_testcase(username);

        const auto& wizard = parse_profile(username);

        touca::add_assertion("username", wizard.username);
        touca::add_result("fullname", wizard.fullname);
        touca::add_result("height", wizard.height);
        touca::add_result(L"weight", wizard.weight);
        touca::add_result("birth_date", wizard.dob);

        custom_function_1(wizard);

        std::thread t(custom_function_2, wizard);
        t.join();

        touca::start_timer("func3");
        custom_function_3(wizard);
        touca::stop_timer("func3");
    }

    touca::save_binary("touca_tutorial.bin");
    touca::save_json("touca_tutorial.json");

    if (!touca::post()) {
        std::cerr << "failed to post results to the server" << std::endl;
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}
