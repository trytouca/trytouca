// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <string>

#include "fmt/color.h"
#include "touca/lib_api.hpp"

namespace touca {

TOUCA_CLIENT_API void print_impl(const fmt::terminal_color& style,
                                 fmt::string_view format,
                                 fmt::format_args args);

template <typename FormatString, typename... Args>
void print_error(const FormatString& format, Args&&... args) {
  print_impl(fmt::terminal_color::red, format,
             fmt::make_args_checked<Args...>(format, args...));
}

template <typename FormatString, typename... Args>
void print_warning(const FormatString& format, Args&&... args) {
  print_impl(fmt::terminal_color::yellow, format,
             fmt::make_args_checked<Args...>(format, args...));
}

}  // namespace touca
