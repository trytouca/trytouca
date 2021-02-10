/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "weasel/devkit/filesystem.hpp"
#include "weasel/devkit/utils.hpp"
#include <fstream>

struct TmpFile {
    TmpFile()
        : path(make_temp_path())
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

    const weasel::filesystem::path path;

private:
    weasel::filesystem::path make_temp_path() const
    {
        const auto filename = weasel::format("weasel_{}", std::rand());
        return weasel::filesystem::temp_directory_path() / filename;
    }
};
