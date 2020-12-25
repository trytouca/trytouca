/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "cxxopts.hpp"
#include "utils/operations.hpp"
#include "weasel/devkit/filesystem.hpp"
#include "weasel/devkit/resultfile.hpp"
#include "weasel/devkit/utils.hpp"
#include <unordered_map>

/**
 *
 */
bool CompareOperation::parse_impl(int argc, char* argv[])
{
    cxxopts::Options options("weasel-cmp --mode=compare");
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

    for (const auto& kvp : filetypes)
    {
        if (!result.count(kvp.first))
        {
            weasel::print_error("{} file not provided\n", kvp.second);
            fmt::print(stdout, "{}\n", options.help());
            return false;
        }
        const auto filepath = result[kvp.first].as<std::string>();
        if (!weasel::filesystem::is_regular_file(filepath))
        {
            weasel::print_error("{} file `{}` does not exist\n", kvp.second, filepath);
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
    weasel::ResultFile src(_src);
    weasel::ResultFile dst(_dst);
    try
    {
        const auto& res = src.compare(dst);
        fmt::print(stdout, "{}\n", res.json());
        return true;
    }
    catch (const std::exception& ex)
    {
        weasel::print_error("failed to compare given files: {}", ex.what());
    }
    return false;
}
