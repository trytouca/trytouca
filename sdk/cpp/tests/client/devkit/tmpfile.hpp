/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "weasel/devkit/filesystem.hpp"

struct TmpFile {
    TmpFile() : path((weasel::filesystem::temp_directory_path() / "weasel_temp").string())
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
        if (weasel::filesystem::exists(path)) {
            weasel::filesystem::remove_all(path);
        }
    }

    const weasel::path path;
};
