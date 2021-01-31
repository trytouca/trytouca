/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "utils/misc/file.hpp"
#include "weasel/devkit/logger.hpp"
#include "weasel/devkit/resultfile.hpp"

/**
 *
 */
std::vector<weasel::filesystem::path> discover(const weasel::filesystem::path& path)
{
    if (weasel::filesystem::is_regular_file(path)) {
        weasel::ResultFile srcFile(path);
        if (!srcFile.validate()) {
            return {};
        }
        return { path };
    }
    if (!weasel::filesystem::is_directory(path)) {
        return {};
    }
    std::vector<weasel::filesystem::path> output;
    for (const auto& it : weasel::filesystem::recursive_directory_iterator(path)) {
        weasel::ResultFile srcFile(it.path());
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
std::vector<weasel::filesystem::path> findResultFiles(const weasel::filesystem::path& path)
{
    WEASEL_LOG_DEBUG("finding weasel result files in {}", path.string());
    auto output = discover(path);
    WEASEL_LOG_INFO("found {} weasel result files", output.size());

    const auto& func = [](const weasel::filesystem::path& a, const weasel::filesystem::path& b) {
        return weasel::filesystem::file_size(a) < weasel::filesystem::file_size(b);
    };
    std::sort(output.begin(), output.end(), func);
    return output;
}
