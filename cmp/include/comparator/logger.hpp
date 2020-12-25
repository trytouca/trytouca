/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include <string>
#include "fmt/format.h"

#ifndef VA_ARGS
#define VA_ARGS(...) , ##__VA_ARGS__
#endif
#define WEASEL_LOG_DEBUG(format, ...)   log(weasel::log_level::debug, FMT_STRING(format) VA_ARGS(__VA_ARGS__))
#define WEASEL_LOG_INFO(format, ...)    log(weasel::log_level::info, FMT_STRING(format) VA_ARGS(__VA_ARGS__))
#define WEASEL_LOG_WARN(format, ...)    log(weasel::log_level::warn, FMT_STRING(format) VA_ARGS(__VA_ARGS__))
#define WEASEL_LOG_ERROR(format, ...)   log(weasel::log_level::error, FMT_STRING(format) VA_ARGS(__VA_ARGS__))

namespace weasel {

    /**
     *
     */
    void setup_console_logger(const std::string& log_level);

    /**
     *
     */
    void setup_file_logger(const std::string& log_dir);

    enum log_level { debug = 1, info, warn, error };

    template <typename Format, typename... Args>
    void log(const log_level level, const Format& format, Args&&... args)
    {
        vlog(level, format, fmt::make_args_checked<Args...>(format, args...));
    }

    void vlog(const log_level level, fmt::string_view format, fmt::format_args args);
}
