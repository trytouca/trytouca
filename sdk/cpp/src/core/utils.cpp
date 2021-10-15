// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#ifndef _WIN32
#if ((defined(_MSVC_LANG) && _MSVC_LANG >= 201703L) ||    \
     (defined(__cplusplus) && __cplusplus >= 201703L)) && \
    defined(__has_include)
#if __has_include(<filesystem>) && (!defined(__MAC_OS_X_VERSION_MIN_REQUIRED) || __MAC_OS_X_VERSION_MIN_REQUIRED >= 101500)
#define GHC_USE_STD_FS
#endif
#endif
#ifndef GHC_USE_STD_FS
#define GHC_FILESYSTEM_IMPLEMENTATION
#include <ghc/fs_fwd.hpp>
#endif
#endif

#include <codecvt>
#include <fstream>
#include <iostream>
#include <locale>
#include <sstream>

#include "fmt/core.h"
#include "touca/core/utils.hpp"

namespace touca {
namespace detail {

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

}  // namespace detail
}  // namespace touca
