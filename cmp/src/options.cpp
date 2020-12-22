/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "comparator/options.hpp"
#include "cxxopts.hpp"
#include "fmt/color.h"
#include "rapidjson/document.h"
#include "weasel/devkit/utils.hpp"

/**
 *
 */
cxxopts::Options config_options_cmd()
{
    cxxopts::Options opts_cmd("command-line arguments");
    // clang-format off
    opts_cmd.add_options()
        ("h,help", "displays this help message")
        ("c,config-file", "path to the configuration file", cxxopts::value<std::string>());
    // clang-format on
    return opts_cmd;
}

/**
 *
 */
cxxopts::Options config_options_file()
{
    cxxopts::Options opts_file("configuration file parameters");
    // clang-format off
    opts_file.add_options()
        ("api-url", "url to weasel platform api", cxxopts::value<std::string>())
        ("log-dir", "relative path to log directory", cxxopts::value<std::string>())
        ("log-level", "level of detail to use for logging", cxxopts::value<std::string>()->default_value("info"))
        ("max-failures", "number of allowable consecutive failures", cxxopts::value<std::string>()->default_value("10"))
        ("project-dir", "full path to project root directory", cxxopts::value<std::string>())
        ("sleep-interval", "minimum time (s) before polling new jobs", cxxopts::value<std::string>()->default_value("10"))
        ("startup-attempt-interval", "minimum time (ms) before re-running startup stage", cxxopts::value<std::string>()->default_value("12000"))
        ("startup-max-attempts", "maximum number of attempts to run startup stage", cxxopts::value<std::string>()->default_value("10"))
        ("storage-dir", "relative path to weasel data store", cxxopts::value<std::string>());
    // clang-format on
    return opts_file;
}

/**
 *
 */
bool Options::parse(int argc, char* argv[])
{
    auto copts_cmd = config_options_cmd();
    const auto result_cmd = copts_cmd.parse(argc, argv);

    // if user asks for help, print help message and exit

    if (result_cmd.count("help"))
    {
        fmt::print(stdout, "{}\n", copts_cmd.help());
        return true;
    }

    // if user does not provide a config-file, print help message and exit

    if (!result_cmd.count("config-file"))
    {
        fmt::print(stderr, fmt::fg(fmt::terminal_color::red), "please provide a valid configuration file\n");
        fmt::print(stderr, "{}\n", copts_cmd.help());
        return false;
    }

    const auto& config_file_path = result_cmd["config-file"].as<std::string>();

    // configuration file must exist if it is specified

    if (!weasel::filesystem::is_regular_file(config_file_path))
    {
        fmt::print(stderr, fmt::fg(fmt::terminal_color::red), "configuration file not found: {}\n", config_file_path);
        return false;
    }

    // load configuration file in memory

    const auto& config_file_content = weasel::load_string_file(config_file_path);

    // attempt to parse config-file

    rapidjson::Document document;
    if (document.Parse<0>(config_file_content.c_str()).HasParseError())
    {
        fmt::print(stderr, fmt::fg(fmt::terminal_color::red), "failed to parse configuration file\n");
        return false;
    }

    // we expect content to be a json object

    if (!document.IsObject())
    {
        fmt::print(stderr, fmt::fg(fmt::terminal_color::yellow), "expected configuration file to be a json object\n");
        return false;
    }

    // parse all json elements as configuration parameters

    for (const auto& rjMember : document.GetObject())
    {
        const auto& key = rjMember.name.GetString();
        if (!rjMember.value.IsString())
        {
            fmt::print(stderr, fmt::fg(fmt::terminal_color::yellow), "ignoring option \"{}\" in configuration file.\n"
                                                                     "expected value type to be string.\n",
                       key);
            continue;
        }
        const auto& value = rjMember.value.GetString();
        data[key] = value;
    }

    return true;
}
