/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "code_under_test.hpp"
#include "rapidjson/document.h"
#include "weasel/devkit/filesystem.hpp"
#include "weasel/weasel.hpp"
#include <thread>

/**
 *
 */
Wizard parse_profile(const std::string& path)
{
    std::ifstream ifs(path, std::ios::in);
    std::string content(
        (std::istreambuf_iterator<char>(ifs)),
        std::istreambuf_iterator<char>());

    Wizard wizard;
    wizard.username = weasel::filesystem::path(path).stem().string();

    rapidjson::Document doc;
    if (doc.Parse<0>(content.c_str()).HasParseError()) {
        throw std::runtime_error("failed to parse profile");
    }

    if (doc.HasMember("name")) {
        wizard.fullname = doc["name"].GetString();
    }
    if (doc.HasMember("height")) {
        wizard.height = doc["height"].GetFloat();
    }
    if (doc.HasMember("weight")) {
        wizard.weight = doc["weight"].GetDouble();
    }
    if (doc.HasMember("wands")) {
        std::vector<std::string> wands;
        const auto& rjWands = doc["wands"].GetArray();
        for (rapidjson::SizeType i = 0; i < rjWands.Size(); i++) {
            wands.emplace_back(rjWands[i].GetString());
        }
        wizard.wands = wands;
    }
    if (doc.HasMember("dob")) {
        const auto& rjDob = doc["dob"].GetObject();
        const unsigned short y = rjDob["y"].GetInt();
        const unsigned short m = rjDob["m"].GetInt();
        const unsigned short d = rjDob["d"].GetInt();
        wizard.dob = { y, m, d };
    }

    return wizard;
}

/**
 *
 */
void custom_function_1(const Wizard& wizard)
{
    WEASEL_SCOPED_TIMER;
    weasel::add_result("is_tall", (6.0f < wizard.height));
    std::this_thread::sleep_for(std::chrono::milliseconds(10 + rand() % 50));
}

/**
 *
 */
void custom_function_2(const Wizard& wizard)
{
    for (auto i = 0ul; i < wizard.wands.size(); ++i) {
        weasel::scoped_timer timer("func2_wand_" + std::to_string(i));
        weasel::add_hit_count("number of wands");
        std::this_thread::sleep_for(std::chrono::milliseconds(10 + rand() % 50));
    }
}

/**
 *
 */
void custom_function_3(const Wizard& wizard)
{
    for (const auto& wand : wizard.wands) {
        weasel::add_array_element("wands", wand);
    }
    std::this_thread::sleep_for(std::chrono::milliseconds(10 + rand() % 50));
}
