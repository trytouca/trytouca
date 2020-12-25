/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "fmt/color.h"
#include "weasel/lib_api.hpp"
#include <fstream>
#include <ios>
#include <string>

#if 201703L <= __cplusplus
#include <filesystem>
#elif defined(_WIN32)
#include "boost/filesystem.hpp"
#else
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
#endif

namespace weasel {

    using path = std::string;

    namespace filesystem {

        /**
         *
         */
        inline bool is_regular_file(const path& path)
        {
#if 201703L <= __cplusplus
            return std::filesystem::is_regular_file(path);
#elif defined(_WIN32)
            return boost::filesystem::is_regular_file(path);
#else
            struct stat sb;
            return stat(path.c_str(), &sb) == 0 && S_ISREG(sb.st_mode);
#endif
        }

        /**
         * @brief checks if a given path corresponds to an existing file or
         *        directory.
         *
         * @param path filesystem path to file or directory to be checked.
         * @return true if the given path or file status corresponds to an
         *         existing file or directory.
         */
        inline bool exists(const path& path)
        {
#if 201703L <= __cplusplus
            return std::filesystem::exists(path);
#elif defined(_WIN32)
            return boost::filesystem::exists(path);
#else
            std::ifstream file(path);
            return file.good();
#endif
        }

        /**
         * @brief deletes the file or empty directory identified by given path.
         *
         * @param path filesystem path to file or directory to be removed.
         * @return true if the file was deleted, false if it did not exist
         *         or it could not be removed.
         */
        inline bool remove(const path& path)
        {
#if 201703L <= __cplusplus
            std::error_code ec;
            return std::filesystem::remove(path, ec) || ec.value() == 0;
#else
            return std::remove(path.c_str()) == 0;
#endif
        }
    }

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
    void WEASEL_CLIENT_API print_impl(const fmt::terminal_color& style, fmt::string_view format, fmt::format_args args);

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
    std::string WEASEL_CLIENT_API narrow(const std::wstring& value);

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
    std::string WEASEL_CLIENT_API load_string_file(
        const weasel::path& path,
        const std::ios_base::openmode mode = std::ios::in);

    /**
     *
     */
    void WEASEL_CLIENT_API save_string_file(
        const weasel::path& path,
        const std::string& content);

} // namespace weasel
