/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "touca/devkit/filesystem.hpp"
#include "touca/devkit/utils.hpp"
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
        if (touca::filesystem::exists(path)) {
            touca::filesystem::remove_all(path);
        }
    }

    const touca::filesystem::path path;

private:
    touca::filesystem::path make_temp_path() const
    {
        const auto filename = touca::format("touca_{}", std::rand());
        return touca::filesystem::temp_directory_path() / filename;
    }
};
