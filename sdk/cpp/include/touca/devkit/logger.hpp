// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "fmt/format.h"
#include "touca/lib_api.hpp"
#include <string>

#define TOUCA_LOG_DEBUG(...) log(touca::log_level::debug, __VA_ARGS__)
#define TOUCA_LOG_INFO(...) log(touca::log_level::info, __VA_ARGS__)
#define TOUCA_LOG_WARN(...) log(touca::log_level::warn, __VA_ARGS__)
#define TOUCA_LOG_ERROR(...) log(touca::log_level::error, __VA_ARGS__)

namespace touca {

    /**
     *
     */
    TOUCA_CLIENT_API void setup_console_logger(const std::string& log_level);

    /**
     *
     */
    TOUCA_CLIENT_API void setup_file_logger(const std::string& log_dir);

    /**
     *
     */
    enum log_level {
        debug = 1,
        info,
        warn,
        error
    };

    /**
     *
     */
    template <typename Format, typename... Args>
    void log(const log_level level, const Format& format, Args&&... args)
    {
        vlog(level, format, fmt::make_args_checked<Args...>(format, args...));
    }

    /**
     *
     */
    TOUCA_CLIENT_API void vlog(const log_level level, fmt::string_view format, fmt::format_args args);
}
