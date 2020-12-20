/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "boost/filesystem.hpp"
#include "utils/operations.hpp"
#include "weasel/devkit/resultfile.hpp"
#include <iostream>

/**
 *
 */
CompareOperation::CompareOperation()
    : Operation()
{
}

/**
 *
 */
boost::program_options::options_description CompareOperation::description()
    const
{
    namespace po = boost::program_options;
    // clang-format off
    po::options_description desc{ "Options --mode=compare" };
    desc.add_options()
        ("src", po::value<std::string>(), "file or directory to compare")
        ("dst", po::value<std::string>(), "file or directory to compare against");
    // clang-format on
    return desc;
}

/**
 *
 */
void CompareOperation::parse_options(
    const boost::program_options::variables_map vm)
{
    Operation::parse_basic_options(vm, { "src", "dst" });
}

/**
 *
 */
bool CompareOperation::validate_options() const
{
    // check that all required keys exist

    if (!validate_required_keys({ "src", "dst" }))
    {
        return false;
    }

    // check that both src and dst files exist

    const auto src = _opts.get("src");
    const auto dst = _opts.get("dst");
    for (const auto& file : { src, dst })
    {
        if (!boost::filesystem::is_regular_file(file))
        {
            std::cerr << "file does not exist: " << file << std::endl;
            return false;
        }
    }

    return true;
}

/**
 *
 */
bool CompareOperation::run() const
{
    weasel::ResultFile src(_opts.get("src"));
    weasel::ResultFile dst(_opts.get("dst"));
    try
    {
        const auto& res = src.compare(dst);
        std::cout << res.json() << std::endl;
        return true;
    }
    catch (const std::exception& ex)
    {
        std::cerr << "unable to compare given files: " << ex.what()
                  << std::endl;
    }
    return false;
}
