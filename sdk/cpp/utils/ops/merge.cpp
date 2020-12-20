/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "boost/filesystem.hpp"
#include "utils/misc/file.hpp"
#include "utils/operations.hpp"
#include "weasel/devkit/extra/logger.hpp"
#include "weasel/devkit/resultfile.hpp"
#include <iostream>

static const unsigned MAX_FILE_SIZE = 10u * 1024 * 1024; // 10 megabytes

/**
 *
 */
MergeOperation::MergeOperation()
    : Operation()
{
}

/**
 *
 */
boost::program_options::options_description MergeOperation::description() const
{
    namespace po = boost::program_options;
    // clang-format off
    po::options_description desc{ "Options --mode=merge" };
    desc.add_options()
    ("src", po::value<std::string>(),
        "path to a directory with one or more weasel result files")
    ("out", po::value<std::string>(),
        "path to a directory in which merged weasel result file(s) will "
        "be stored");
    // clang-format on
    return desc;
}

/**
 *
 */
void MergeOperation::parse_options(
    const boost::program_options::variables_map vm)
{
    Operation::parse_basic_options(vm, { "src", "out" });
}

/**
 *
 */
bool MergeOperation::validate_options() const
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
bool MergeOperation::run() const
{
    WEASEL_LOG_INFO("starting execution of operation: merge");

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

    using chunk_t = std::vector<fs::path>;
    std::vector<chunk_t> chunks;
    for (auto i = 0u, j = 0u; i < resultFiles.size(); j = i)
    {
        for (auto chunkSize = 0ull; i < resultFiles.size(); ++i)
        {
            const auto fileSize = fs::file_size(resultFiles.at(i));
            if (MAX_FILE_SIZE < chunkSize + fileSize)
            {
                ++i;
                break;
            }
            chunkSize += fileSize;
        }
        chunk_t chunk(resultFiles.begin() + j, resultFiles.begin() + i);
        chunks.emplace_back(chunk);
    }
    WEASEL_LOG_INFO("results will be merged into {} files", chunks.size());

    const auto& root = fs::absolute(_opts.get("out"));
    for (auto i = 0ul; i < chunks.size(); ++i)
    {
        const auto filestem = fs::path(srcDir).filename().string();
        const auto& filename = chunks.size() == 1ul
            ? weasel::format("{}.bin", filestem)
            : weasel::format("{}.part{}.bin", filestem, i + 1);
        auto filepath = (root / filename).string();
        WEASEL_LOG_INFO(
            "merging {:<3} result files into {}",
            chunks.at(i).size(),
            filepath);
        weasel::ResultFile rf(filepath);
        for (const auto& file : chunks.at(i))
        {
            rf.merge(weasel::ResultFile(file.string()));
        }
        rf.save();
    }
    WEASEL_LOG_INFO("merged results into {} files", chunks.size());

    return true;
}
