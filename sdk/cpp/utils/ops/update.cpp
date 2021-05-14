/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "cxxopts.hpp"
#include "touca/devkit/filesystem.hpp"
#include "touca/devkit/logger.hpp"
#include "touca/devkit/resultfile.hpp"
#include "touca/devkit/utils.hpp"
#include "utils/misc/file.hpp"
#include "utils/operations.hpp"

/**
 *
 */
bool UpdateOperation::parse_impl(int argc, char* argv[])
{
    cxxopts::Options options("touca_cli --mode=update");
    // clang-format off
    options.add_options("main")
        ("src", "path to directory with one or more result files", cxxopts::value<std::string>())
        ("out", "path to directory to write updated result files", cxxopts::value<std::string>())
        ("team", "value of metadata field `team`", cxxopts::value<std::string>())
        ("suite", "value of metadata field `suite`", cxxopts::value<std::string>())
        ("revision", "value of metadata field `revision`", cxxopts::value<std::string>());
    // clang-format on
    options.allow_unrecognised_options();

    const auto& result = options.parse(argc, argv);

    const std::unordered_map<std::string, std::string> filetypes = {
        { "src", "source" },
        { "out", "output" }
    };

    for (const auto& kvp : filetypes) {
        if (!result.count(kvp.first)) {
            touca::print_error("{} directory not provided\n", kvp.second);
            fmt::print(stdout, "{}\n", options.help());
            return false;
        }
        const auto filepath = result[kvp.first].as<std::string>();
        if (!touca::filesystem::is_directory(filepath)) {
            touca::print_error("{} directory `{}` does not exist\n", kvp.second, filepath);
            return false;
        }
    }

    _src = result["src"].as<std::string>();
    _out = result["out"].as<std::string>();

    for (const auto& key : { "team", "suite", "revision" }) {
        if (result.count(key)) {
            const auto& value = result[key].as<std::string>();
            _fields.emplace(key, value);
        }
    }

    return true;
}

/**
 * we expect user to specify a directory as source. we recursively
 * iterate over all the file system elements in that directory and
 * identify result files.
 */
bool UpdateOperation::run_impl() const
{
    TOUCA_LOG_INFO("starting execution of operation: update");
    const auto resultFiles = findResultFiles(_src);
    if (resultFiles.empty()) {
        TOUCA_LOG_ERROR("specified directory has no result file");
        return false;
    }

    const auto& root = touca::filesystem::absolute(_out);
    for (const auto& srcFilePath : resultFiles) {
        const auto filename = touca::filesystem::path(srcFilePath).filename();
        const auto dstFilePath = (root / filename).string();

        touca::ResultFile srcFile(srcFilePath);
        std::vector<touca::Testcase> content;
        const auto& elementsMap = srcFile.parse();
        for (const auto& kvp : elementsMap) {
            auto meta = kvp.second->metadata();
            if (_fields.count("team")) {
                meta.teamslug = _fields.at("team");
            }
            if (_fields.count("suite")) {
                meta.testsuite = _fields.at("suite");
            }
            if (_fields.count("revision")) {
                meta.testsuite = _fields.at("revision");
            }
            kvp.second->setMetadata(meta);
            content.push_back(*kvp.second);
        }
        touca::ResultFile dstFile(dstFilePath);
        dstFile.save(content);
    }

    return true;
}
