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
ViewOperation::ViewOperation()
    : Operation()
{
}

/**
 *
 */
boost::program_options::options_description ViewOperation::description() const
{
    namespace po = boost::program_options;
    // clang-format off
    po::options_description desc{ "Options --mode=view" };
    desc.add_options()
        ("src", po::value<std::string>(), "weasel result file to view in json format");
    // clang-format on
    return desc;
}

/**
 *
 */
void ViewOperation::parse_options(
    const boost::program_options::variables_map vm)
{
    Operation::parse_basic_options(vm, { "src" });
}

/**
 *
 */
bool ViewOperation::validate_options() const
{
    // check that all required keys exist

    if (!validate_required_keys({ "src" }))
    {
        return false;
    }

    const auto file = _opts.get("src");
    if (!boost::filesystem::is_regular_file(file))
    {
        std::cerr << "file does not exist: " << file << std::endl;
        return false;
    }
    return true;
}

/**
 *
 */
bool ViewOperation::run() const
{
    weasel::ResultFile file(_opts.get("src"));
    try
    {
        std::cout << file.readFileInJson() << std::endl;
        return true;
    }
    catch (const std::exception& ex)
    {
        std::cerr << "unable to view file: " << ex.what() << std::endl;
    }
    return false;
}
