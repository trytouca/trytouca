// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/core/utils.hpp"

#include <codecvt>
#include <fstream>
#include <iostream>
#include <locale>
#include <sstream>

#include "fmt/printf.h"
#include "touca/core/filesystem.hpp"
#include "touca/core/testcase.hpp"

namespace touca {

void print_impl(const fmt::terminal_color& style, fmt::string_view format,
                fmt::format_args args) {
  std::cerr << fmt::vformat(fmt::fg(style), format, args);
}

}  // namespace touca
