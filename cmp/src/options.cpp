/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "options.hpp"
#include "cxxopts.hpp"
#include "rapidjson/document.h"
#include "weasel/devkit/filesystem.hpp"
#include "weasel/devkit/utils.hpp"

/**
 *
 */
cxxopts::Options config_options_cmd()
{
    cxxopts::Options opts_cmd("", "");
    // clang-format off
    opts_cmd.add_options("command-line")
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
    cxxopts::Options opts_file("", "");
    // clang-format off
    opts_file.add_options("configuration-file")
        ("api-url", "url to weasel platform api", cxxopts::value<std::string>())
        ("log-dir", "relative path to log directory", cxxopts::value<std::string>())
        ("log-level", "level of detail to use for logging", cxxopts::value<std::string>()->default_value("info"))
        ("max-failures", "number of allowable consecutive failures", cxxopts::value<unsigned>()->default_value("10"))
        ("processor-threads", "number of processor threads", cxxopts::value<unsigned>()->default_value("4"))
        ("polling-interval", "minimum time (ms) before polling new jobs", cxxopts::value<unsigned>()->default_value("10000"))
        ("startup-interval", "minimum time (ms) before re-running startup stage", cxxopts::value<unsigned>()->default_value("12000"))
        ("startup-timeout", "total time (ms) before aborting startup stage", cxxopts::value<unsigned>()->default_value("120000"))
        ("status-report-interval", "total time (ms) between statistics reporting", cxxopts::value<unsigned>()->default_value("60000"))
        ("minio-host", "minio host", cxxopts::value<std::string>())
        ("minio-user", "minio user", cxxopts::value<std::string>())
        ("minio-pass", "minio pass", cxxopts::value<std::string>())
        ("minio-port", "minio port", cxxopts::value<std::string>()->default_value("9000"))
        ("minio-region", "minio region", cxxopts::value<std::string>()->default_value("us-east-2"));
    // clang-format on
    return opts_file;
}

/**
 *
 */
bool parse_arguments_impl(int argc, char* argv[], Options& options)
{
    // parse command line arguments

    auto copts_cmd = config_options_cmd();
    const auto result_cmd = copts_cmd.parse(argc, argv);

    // if user asks for help, print help message and exit

    if (result_cmd.count("help")) {
        fmt::print(stdout, "{}\n", copts_cmd.help());
        options.help = true;
        return true;
    }

    // if user does not provide a config-file, print help message and exit

    if (!result_cmd.count("config-file")) {
        weasel::print_error("please provide a valid configuration file\n");
        fmt::print(stderr, "{}\n", copts_cmd.help());
        return false;
    }

    const auto& config_file_path = result_cmd["config-file"].as<std::string>();

    // configuration file must exist if it is specified

    if (!weasel::filesystem::is_regular_file(config_file_path)) {
        weasel::print_error("configuration file not found: {}\n", config_file_path);
        return false;
    }

    // load configuration file in memory

    const auto& config_file_content = weasel::load_string_file(config_file_path);

    // attempt to parse config-file

    rapidjson::Document document;
    if (document.Parse<0>(config_file_content.c_str()).HasParseError()) {
        weasel::print_error("failed to parse configuration file\n");
        return false;
    }

    // we expect content to be a json object

    if (!document.IsObject()) {
        weasel::print_error("expected configuration file to be a json object\n");
        return false;
    }

    // extract json elements as configuration parameters

    std::vector<char*> copts_args;
    copts_args.emplace_back(argv[0]);

    for (const auto& rjMember : document.GetObject()) {
        const auto& key = rjMember.name.GetString();
        if (!rjMember.value.IsString()) {
            weasel::print_warning("ignoring option \"{}\" in configuration file.\n", key);
            weasel::print_warning("expected value type to be string.\n");
            continue;
        }
        const auto& value = rjMember.value.GetString();
        using namespace std::string_literals;
        copts_args.push_back(strdup(("--"s + key).c_str()));
        copts_args.push_back(strdup(value));
    }

    // interpret config file parameters

    auto copts_file = config_options_file();
    int copts_file_argc = copts_args.size();
    auto copts_file_argv = copts_args.data();
    const auto result_file = copts_file.parse(copts_file_argc, copts_file_argv);

    // validate and set option `api-url`

    if (!result_file.count("api-url")) {
        weasel::print_error("expected configuration parameter: `api-url`\n");
        fmt::print("{}\n", copts_file.help());
        return false;
    }

    options.api_url = result_file["api-url"].as<std::string>();

    // validate and set option `log-level`

    {
        const std::unordered_set<std::string> levels = { "debug", "info", "warning" };
        const auto level = result_file["log-level"].as<std::string>();
        if (!levels.count(level)) {
            weasel::print_error("invalid value for option `log-level`");
            fmt::print("{}\n", copts_file.help());
            return false;
        }
        options.log_level = level;
    }

    // set option `log-dir` if it is provided

    if (result_file.count("log-dir")) {
        options.log_dir = result_file["log-dir"].as<std::string>();
        if (!weasel::filesystem::is_directory(*options.log_dir)) {
            weasel::print_error("option `log-dir` points to nonexistent directory");
            return false;
        }
    }

    // validate and set minio parameters

    for (const auto& key : { "minio-host", "minio-pass", "minio-user" }) {
        if (!result_file.count("minio-host")) {
            weasel::print_error("option `log-dir` points to nonexistent directory");
            return false;
        }
    }

    options.minio_host = result_file["minio-host"].as<std::string>();
    options.minio_pass = result_file["minio-pass"].as<std::string>();
    options.minio_port = result_file["minio-port"].as<std::string>();
    options.minio_user = result_file["minio-user"].as<std::string>();
    options.minio_region = result_file["minio-region"].as<std::string>();

    // override minio username and password if they are provided
    // as environment variables

    if (const auto user = std::getenv("MINIO_USER")) {
        options.minio_user = user;
    }
    if (const auto pass = std::getenv("MINIO_PASS")) {
        options.minio_pass = pass;
    }

    // set other options with default numeric values

    options.max_failures = result_file["max-failures"].as<unsigned>();
    options.polling_interval = result_file["polling-interval"].as<unsigned>();
    options.processor_threads = result_file["processor-threads"].as<unsigned>();
    options.startup_interval = result_file["startup-interval"].as<unsigned>();
    options.startup_timeout = result_file["startup-timeout"].as<unsigned>();
    options.status_report_interval = result_file["status-report-interval"].as<unsigned>();

    return true;
}

/**
 *
 */
bool parse_arguments(int argc, char* argv[], Options& options)
{
    try {
        return parse_arguments_impl(argc, argv, options);
    } catch (const std::exception& ex) {
        weasel::print_error("failed to parse application options: {}\n", ex.what());
    }
    return false;
}
