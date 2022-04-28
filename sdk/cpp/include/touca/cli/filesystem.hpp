// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include <vector>

#include "touca/core/filesystem.hpp"

/**
 * @brief Finds all valid result files within the specified path.
 * @param path path to a file or directory that may be or may have result files.
 * @return list of valid result files
 */
std::vector<touca::filesystem::path> find_binary_files(
    const touca::filesystem::path& path);
