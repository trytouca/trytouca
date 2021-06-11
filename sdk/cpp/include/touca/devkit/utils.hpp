// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "fmt/color.h"
#include "touca/lib_api.hpp"
#include <ios>
#include <string>

namespace touca {

    /**
     * @brief performs printf-like formatting using `libfmt` library.
     *
     * @param msg format string with `libfmt` style placeholders
     * @param args variable list of arguments referenced in `msg` format string
     * @return formatted string
     */
    template <typename FormatString, typename... Args>
    std::string format(const FormatString& msg, Args&&... args)
    {
        return fmt::format(msg, std::forward<Args>(args)...);
    }

    /**
     *
     */
    TOUCA_CLIENT_API void print_impl(const fmt::terminal_color& style, fmt::string_view format, fmt::format_args args);

    /**
     *
     */
    template <typename FormatString, typename... Args>
    void print_error(const FormatString& format, Args&&... args)
    {
        print_impl(fmt::terminal_color::red, format, fmt::make_args_checked<Args...>(format, args...));
    }

    /**
     *
     */
    template <typename FormatString, typename... Args>
    void print_warning(const FormatString& format, Args&&... args)
    {
        print_impl(fmt::terminal_color::yellow, format, fmt::make_args_checked<Args...>(format, args...));
    }

    /**
     *
     */
    TOUCA_CLIENT_API std::string narrow(const std::wstring& value);

    /**
     * Utility function to load content of a file with given path.
     * For consumption by Comparator and Utils applications.
     *
     * @param path path to the file whose content should be loaded
     *
     * @param mode bitmask representing mode in which the file should be opened.
     *             visit https://en.cppreference.com/w/cpp/io/ios_base/openmode
     *             for more information.
     *
     * @throw std::invalid_argument if the file with given path is missing
     *
     * @return content of the file with given path
     */
    TOUCA_CLIENT_API std::string load_string_file(
        const std::string& path,
        const std::ios_base::openmode mode = std::ios::in);

    /**
     *
     */
    TOUCA_CLIENT_API void save_string_file(
        const std::string& path,
        const std::string& content);

} // namespace touca
