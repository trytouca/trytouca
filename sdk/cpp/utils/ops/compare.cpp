/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "cxxopts.hpp"
#include "touca/devkit/filesystem.hpp"
#include "touca/devkit/resultfile.hpp"
#include "touca/devkit/utils.hpp"
#include "utils/operations.hpp"
#include <unordered_map>

/**
 *
 */
bool CompareOperation::parse_impl(int argc, char* argv[])
{
    cxxopts::Options options("touca_cli --mode=compare");
    // clang-format off
    options.add_options("main")
        ("src", "file or directory to compare", cxxopts::value<std::string>())
        ("dst", "file or directory to compare against", cxxopts::value<std::string>());
    // clang-format on
    options.allow_unrecognised_options();

    const auto& result = options.parse(argc, argv);

    const std::unordered_map<std::string, std::string> filetypes = {
        { "src", "source" },
        { "dst", "destination" }
    };

    for (const auto& kvp : filetypes) {
        if (!result.count(kvp.first)) {
            touca::print_error("{} file not provided\n", kvp.second);
            fmt::print(stdout, "{}\n", options.help());
            return false;
        }
        const auto filepath = result[kvp.first].as<std::string>();
        if (!touca::filesystem::is_regular_file(filepath)) {
            touca::print_error("{} file `{}` does not exist\n", kvp.second, filepath);
            return false;
        }
    }

    _src = result["src"].as<std::string>();
    _dst = result["dst"].as<std::string>();

    return true;
}

/**
 *
 */
bool CompareOperation::run_impl() const
{
    touca::ResultFile src(_src);
    touca::ResultFile dst(_dst);
    try {
        const auto& res = src.compare(dst);
        fmt::print(stdout, "{}\n", res.json());
        return true;
    } catch (const std::exception& ex) {
        touca::print_error("failed to compare given files: {}", ex.what());
    }
    return false;
}
