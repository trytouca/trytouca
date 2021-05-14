/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "utils/misc/file.hpp"
#include "touca/devkit/logger.hpp"
#include "touca/devkit/resultfile.hpp"

/**
 *
 */
std::vector<touca::filesystem::path> discover(const touca::filesystem::path& path)
{
    if (touca::filesystem::is_regular_file(path)) {
        touca::ResultFile srcFile(path);
        if (!srcFile.validate()) {
            return {};
        }
        return { path };
    }
    if (!touca::filesystem::is_directory(path)) {
        return {};
    }
    std::vector<touca::filesystem::path> output;
    for (const auto& it : touca::filesystem::recursive_directory_iterator(path)) {
        touca::ResultFile srcFile(it.path());
        if (!srcFile.validate()) {
            continue;
        }
        output.push_back(it.path());
    }
    return output;
}

/**
 *
 */
std::vector<touca::filesystem::path> findResultFiles(const touca::filesystem::path& path)
{
    TOUCA_LOG_DEBUG("finding result files in {}", path.string());
    auto output = discover(path);
    TOUCA_LOG_INFO("found {} result files", output.size());

    const auto& func = [](const touca::filesystem::path& a, const touca::filesystem::path& b) {
        return touca::filesystem::file_size(a) < touca::filesystem::file_size(b);
    };
    std::sort(output.begin(), output.end(), func);
    return output;
}
