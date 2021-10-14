// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/devkit/utils.hpp"

#include <codecvt>
#include <fstream>
#include <iostream>
#include <locale>
#include <sstream>

#include "fmt/printf.h"
#include "touca/devkit/filesystem.hpp"
#include "touca/devkit/testcase.hpp"

namespace touca {

void print_impl(const fmt::terminal_color& style, fmt::string_view format,
                fmt::format_args args) {
  std::cerr << fmt::vformat(fmt::fg(style), format, args);
}

std::string load_string_file(const std::string& path,
                             const std::ios_base::openmode mode) {
  std::ifstream filestream(path, mode);
  if (!filestream) {
    throw std::invalid_argument("failed to read file");
  }
  std::ostringstream oss;
  oss << filestream.rdbuf();
  filestream.close();
  return oss.str();
}

void create_parent_directory(const std::string& path) {
  // create parent directory if it does not exist
  touca::filesystem::path dstFile{path};
  const auto parentPath = touca::filesystem::absolute(dstFile.parent_path());
  if (!touca::filesystem::exists(parentPath.string()) &&
      !touca::filesystem::create_directories(parentPath)) {
    throw std::invalid_argument("failed to create parent path");
  }
}

void save_string_file(const std::string& path, const std::string& content) {
  create_parent_directory(path);
  try {
    std::ofstream out(path);
    out << content;
    out.close();
  } catch (const std::exception& ex) {
    throw std::invalid_argument(
        fmt::format("failed to save content to disk: {}", ex.what()));
  }
}

void save_binary_file(const std::string& path,
                      const std::vector<uint8_t>& data) {
  create_parent_directory(path);
  try {
    std::ofstream out(path, std::ios::binary);
    out.write((const char*)data.data(), data.size());
    out.close();
  } catch (const std::exception& ex) {
    throw std::invalid_argument(
        fmt::format("failed to save content to disk: {}", ex.what()));
  }
}

}  // namespace touca
