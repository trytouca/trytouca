/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include <string>
#include "fmt/format.h"
#include "weasel/lib_api.hpp"

#define WEASEL_LOG_DEBUG(...) log(weasel::log_level::debug, __VA_ARGS__)
#define WEASEL_LOG_INFO(...)  log(weasel::log_level::info, __VA_ARGS__)
#define WEASEL_LOG_WARN(...)  log(weasel::log_level::warn, __VA_ARGS__)
#define WEASEL_LOG_ERROR(...) log(weasel::log_level::error, __VA_ARGS__)

namespace weasel {

    /**
     *
     */
    WEASEL_CLIENT_API void setup_console_logger(const std::string& log_level);

    /**
     *
     */
    WEASEL_CLIENT_API void setup_file_logger(const std::string& log_dir);

    /**
     *
     */
    enum log_level { debug = 1, info, warn, error };

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
    WEASEL_CLIENT_API void vlog(const log_level level, fmt::string_view format, fmt::format_args args);
}
