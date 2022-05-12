// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <string>

#include "fmt/format.h"

namespace touca {

enum class log_level { debug = 1, info, warn, error };

void setup_console_logger(const std::string& log_level);

void setup_file_logger(const std::string& log_dir);

void vlog(const log_level level, fmt::string_view format,
          fmt::format_args args);

template <typename Format, typename... Args>
static void log_debug(const Format& format, Args&&... args) {
  vlog(log_level::debug, format,
       fmt::make_args_checked<Args...>(format, args...));
}

template <typename Format, typename... Args>
static void log_info(const Format& format, Args&&... args) {
  vlog(log_level::info, format,
       fmt::make_args_checked<Args...>(format, args...));
}

template <typename Format, typename... Args>
static void log_warn(const Format& format, Args&&... args) {
  vlog(log_level::warn, format,
       fmt::make_args_checked<Args...>(format, args...));
}

template <typename Format, typename... Args>
static void log_error(const Format& format, Args&&... args) {
  vlog(log_level::error, format,
       fmt::make_args_checked<Args...>(format, args...));
}

}  // namespace touca
