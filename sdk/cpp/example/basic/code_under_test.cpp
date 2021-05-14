/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "code_under_test.hpp"
#include "touca/touca.hpp"
#include <thread>
#include <unordered_map>

/**
 *
 */
Wizard parse_profile(const std::string& path)
{
    static std::unordered_map<std::string, Wizard> wizards = {
        { "rweasley",
            { "rweasley",
                L"Ronald Weasley",
                Date { 1980, 3, 1 },
                6.3f,
                152.0,
                { "unicorn tail hair" } } },
        { "hpotter",
            { "hpotter",
                L"Harry James Potter",
                Date { 1980, 6, 31 },
                6.0f,
                145.0,
                { "phoenix feather" } } },
        { "hgranger",
            { "hgranger",
                L"Hermione Jean Granger",
                Date { 1979, 9, 19 },
                5.5f,
                120.0,
                { "dragon heartstring" } } }
    };

    return wizards.at(path);
}

/**
 *
 */
void custom_function_1(const Wizard& wizard)
{
    TOUCA_SCOPED_TIMER;
    touca::add_result("is_tall", (6.0f < wizard.height));
    std::this_thread::sleep_for(std::chrono::milliseconds(10 + rand() % 50));
}

/**
 *
 */
void custom_function_2(const Wizard& wizard)
{
    for (auto i = 0ul; i < wizard.wands.size(); ++i) {
        touca::scoped_timer timer("func2_wand_" + std::to_string(i));
        touca::add_hit_count("number of wands");
        std::this_thread::sleep_for(std::chrono::milliseconds(10 + rand() % 50));
    }
}

/**
 *
 */
void custom_function_3(const Wizard& wizard)
{
    for (const auto& wand : wizard.wands) {
        touca::add_array_element("wands", wand);
    }
    std::this_thread::sleep_for(std::chrono::milliseconds(10 + rand() % 50));
}
