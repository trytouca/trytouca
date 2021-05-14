/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "touca/devkit/utils.hpp"
#include "fmt/printf.h"
#include <codecvt>
#include <fstream>
#include <iostream>
#include <locale>
#include <sstream>

namespace touca {

    /**
     *
     */
    void print_impl(const fmt::terminal_color& style, fmt::string_view format, fmt::format_args args)
    {
        std::cerr << fmt::vformat(fmt::fg(style), format, args);
    }

    /**
     *
     */
    std::string narrow(const std::wstring& value)
    {
        std::wstring_convert<std::codecvt_utf8<wchar_t>, wchar_t> conv;
        return conv.to_bytes(value);
    }

    /**
     *
     */
    std::string load_string_file(
        const std::string& path,
        const std::ios_base::openmode mode)
    {
        std::ifstream filestream(path, mode);
        if (!filestream) {
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
        const std::string& path,
        const std::string& content)
    {
        std::ofstream ofs(path);
        ofs << content;
        ofs.close();
    }

} // namespace touca
