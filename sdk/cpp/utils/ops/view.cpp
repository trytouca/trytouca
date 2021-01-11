/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "cxxopts.hpp"
#include "utils/operations.hpp"
#include "weasel/devkit/filesystem.hpp"
#include "weasel/devkit/resultfile.hpp"
#include "weasel/devkit/utils.hpp"

/**
 *
 */
bool ViewOperation::parse_impl(int argc, char* argv[])
{
    cxxopts::Options options("weasel-cmp --mode=view");
    // clang-format off
    options.add_options("main")
        ("src", "result file to view in json format", cxxopts::value<std::string>());
    // clang-format on
    options.allow_unrecognised_options();

    const auto& result = options.parse(argc, argv);
    if (!result.count("src")) {
        weasel::print_error("source file not provided\n");
        fmt::print(stdout, "{}\n", options.help());
        return false;
    }

    _src = result["src"].as<std::string>();

    if (!weasel::filesystem::is_regular_file(_src)) {
        weasel::print_error("file `{}` does not exist\n", _src);
        return false;
    }

    return true;
}

/**
 *
 */
bool ViewOperation::run_impl() const
{
    weasel::ResultFile file(_src);
    try {
        fmt::print(stdout, "{}\n", file.readFileInJson());
        return true;
    } catch (const std::exception& ex) {
        weasel::print_error("failed to read file {}: {}\n", _src, ex.what());
    }
    return false;
}
