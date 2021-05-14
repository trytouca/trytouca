/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "code_under_test.hpp"
#include "rapidjson/document.h"
#include "touca/devkit/filesystem.hpp"
#include "touca/touca.hpp"
#include <fstream>
#include <thread>

#ifdef _WIN32
#undef GetObject
#endif

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
    wizard.username = touca::filesystem::path(path).stem().string();

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
        const auto y = static_cast<unsigned short>(rjDob["y"].GetInt());
        const auto m = static_cast<unsigned short>(rjDob["m"].GetInt());
        const auto d = static_cast<unsigned short>(rjDob["d"].GetInt());
        wizard.dob = { y, m, d };
    }

    return wizard;
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
