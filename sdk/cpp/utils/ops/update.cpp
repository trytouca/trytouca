/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "boost/filesystem.hpp"
#include "utils/misc/file.hpp"
#include "utils/operations.hpp"
#include "weasel/devkit/extra/logger.hpp"
#include "weasel/devkit/resultfile.hpp"
#include <iostream>

/**
 *
 */
UpdateOperation::UpdateOperation()
    : Operation()
{
}

/**
 *
 */
boost::program_options::options_description UpdateOperation::description() const
{
    namespace po = boost::program_options;
    po::options_description desc{ "Options --mode=update" };
    // clang-format off
    desc.add_options()
        ("src", po::value<std::string>(), "path to a directory with one or more weasel result files")
        ("out", po::value<std::string>(), "path to a directory in which updated weasel result file(s) will be stored")
        ("teamslug", po::value<std::string>(), "new team slug")
        ("testsuite", po::value<std::string>(), "new suite slug");
    // clang-format on
    return desc;
}

/**
 *
 */
void UpdateOperation::parse_options(
    const boost::program_options::variables_map vm)
{
    Operation::parse_basic_options(vm, { "src", "out", "teamslug", "testsuite" });
}

/**
 *
 */
bool UpdateOperation::validate_options() const
{
    // check that all required keys exist

    if (!validate_required_keys({ "src", "out" }))
    {
        return false;
    }

    if (!boost::filesystem::exists(_opts.get("src")))
    {
        std::cerr << "result directory does not exist" << std::endl;
        return false;
    }

    if (boost::filesystem::exists(_opts.get("out")))
    {
        std::cerr << "specified output directory already exists" << std::endl;
        return false;
    }

    // we can validate that the given directory has at least one weasel
    // result file. However, since finding weasel result files is an
    // expensive operation, we choose to defer this check to operation
    // run-time.

    return true;
}

/**
 *
 */
bool UpdateOperation::run() const
{
    WEASEL_LOG_INFO("starting execution of operation: update");

    // we expect user to specify a directory as source. we recursively
    // iterate over all the file system elements in that directory and
    // identify weasel result files.

    namespace fs = boost::filesystem;
    std::vector<weasel::path> resultFiles;
    const weasel::path srcDir = _opts.get("src");
    WEASEL_LOG_DEBUG("finding weasel result files in {}", srcDir);
    findResultFiles(srcDir, std::back_inserter(resultFiles));
    WEASEL_LOG_INFO("found {} weasel result files", resultFiles.size());
    const auto& sortFunction = [](const fs::path& a, const fs::path& b) {
        return fs::file_size(a) < fs::file_size(b);
    };
    std::sort(resultFiles.begin(), resultFiles.end(), sortFunction);

    if (resultFiles.empty())
    {
        WEASEL_LOG_ERROR("specified directory has no weasel result file");
        return false;
    }

    const auto& root = fs::absolute(_opts.get("out"));
    for (const auto& srcFilePath : resultFiles)
    {
        const auto filename = fs::path(srcFilePath).filename();
        const auto dstFilePath = (root / filename).string();

        weasel::ResultFile srcFile(srcFilePath);
        std::vector<weasel::Testcase> content;
        const auto& elementsMap = srcFile.parse();
        for (const auto& kvp : elementsMap)
        {
            auto meta = kvp.second->metadata();
            if (_opts.has("teamslug"))
            {
                meta.teamslug = _opts.get("teamslug");
            }
            if (_opts.has("testsuite"))
            {
                meta.testsuite = _opts.get("testsuite");
            }
            kvp.second->setMetadata(meta);
            content.push_back(*kvp.second);
        }
        weasel::ResultFile dstFile(dstFilePath);
        dstFile.save(content);
    }

    return true;
}
