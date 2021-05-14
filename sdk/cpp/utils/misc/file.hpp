/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "touca/devkit/filesystem.hpp"
#include <vector>

/**
 * @brief Finds all valid result files within the specified path.
 * @param path path to a file or directory that may be or may have result files.
 * @return list of valid result files
 */
std::vector<touca::filesystem::path> findResultFiles(const touca::filesystem::path& path);
