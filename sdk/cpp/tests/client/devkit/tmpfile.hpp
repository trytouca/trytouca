/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "boost/filesystem.hpp"
#include "weasel/devkit/utils.hpp"

struct TmpFile
{
    TmpFile()
        : path((boost::filesystem::temp_directory_path() / boost::filesystem::unique_path()).string())
    {
    }

    void write(const std::string& content) const
    {
        std::ofstream ofs(path);
        ofs << content;
        ofs.close();
    }

    ~TmpFile()
    {
        if (weasel::filesystem::exists(path))
        {
            boost::filesystem::remove_all(path);
        }
    }

    const weasel::path path;
};
