/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/devkit/filesystem.hpp"
#include <vector>

/**
 * @brief Finds all valid weasel result files within the specified path.
 * @param path path to a file or directory that may be or may have result files.
 * @return list of valid weasel result files
 */
std::vector<weasel::filesystem::path> findResultFiles(const weasel::filesystem::path& path);
