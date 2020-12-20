/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/devkit/utils.hpp"
#include <codecvt>
#include <fstream>
#include <locale>
#include <sstream>

namespace weasel {

    /**
     *
     */
    std::string toUtf8(const std::wstring& value)
    {
        std::wstring_convert<std::codecvt_utf8<wchar_t>, wchar_t> conv;
        return conv.to_bytes(value);
    }

    /**
     *
     */
    std::string load_string_file(
        const weasel::path& path,
        const std::ios_base::openmode mode)
    {
        std::ifstream filestream(path, mode);
        if (!filestream)
        {
            throw std::invalid_argument("failed to read file");
        }
        std::ostringstream oss;
        oss << filestream.rdbuf();
        filestream.close();
        return oss.str();
    }

    /**
     *
     */
    void save_string_file(
        const weasel::path& path,
        const std::string& content)
    {
        std::ofstream ofs(path);
        ofs << content;
        ofs.close();
    }

} // namespace weasel
