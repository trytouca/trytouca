/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "utils/misc/file.hpp"
#include "boost/filesystem.hpp"
#include "weasel/devkit/resultfile.hpp"

namespace fs = boost::filesystem;

/**
 *
 */
void findResultFiles(
    const weasel::path& inputPath,
    std::back_insert_iterator<std::vector<weasel::path>> resultFileIterator)
{
    if (fs::is_regular_file(inputPath))
    {
        resultFileIterator = inputPath;
        return;
    }

    if (fs::is_directory(inputPath))
    {
        for (const auto& it : fs::recursive_directory_iterator(inputPath))
        {
            weasel::ResultFile srcFile(it.path().string());
            if (!srcFile.validate())
            {
                continue;
            }
            resultFileIterator = it.path().string();
        }
    }
}
