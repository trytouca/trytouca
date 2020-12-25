/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "utils/misc/file.hpp"
#include "weasel/devkit/filesystem.hpp"
#include "weasel/devkit/resultfile.hpp"

/**
 *
 */
void findResultFiles(
    const weasel::path& inputPath,
    std::back_insert_iterator<std::vector<weasel::path>> resultFileIterator)
{
    if (weasel::filesystem::is_regular_file(inputPath))
    {
        resultFileIterator = inputPath;
        return;
    }

    if (weasel::filesystem::is_directory(inputPath))
    {
        for (const auto& it : boost::filesystem::recursive_directory_iterator(inputPath))
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
