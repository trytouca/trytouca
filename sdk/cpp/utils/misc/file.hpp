/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/devkit/utils.hpp"
#include <vector>

/**
 * @brief Finds all valid weasel result files within the specified path.
 * @param inputPath path provided by user that may be pointing to a file
 *                  or a directory.
 * @param resultFileIterator iterator to the list of filepaths to be
 *                           populated.
 */
void findResultFiles(
    const weasel::path& inputPath,
    std::back_insert_iterator<std::vector<weasel::path>> resultFileIterator);
