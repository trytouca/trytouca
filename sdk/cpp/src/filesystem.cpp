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
#include "touca/core/filesystem.hpp"

namespace touca {
namespace detail {

std::string load_text_file(const std::string& path,
                           const std::ios_base::openmode mode) {
  std::ifstream file_stream(path, mode);
  if (!file_stream) {
    throw touca::detail::runtime_error("failed to read file");
  }
  std::ostringstream oss;
  oss << file_stream.rdbuf();
  file_stream.close();
  return oss.str();
}

void create_parent_directory(const std::string& path) {
  touca::filesystem::path dstFile{path};
  const auto parentPath = touca::filesystem::absolute(dstFile.parent_path());
  if (!touca::filesystem::exists(parentPath.string()) &&
      !touca::filesystem::create_directories(parentPath)) {
    throw touca::detail::runtime_error("failed to create parent path");
  }
}

void save_text_file(const std::string& path, const std::string& content) {
  create_parent_directory(path);
  try {
    std::ofstream out(path);
    out << content;
    out.close();
  } catch (const std::exception& ex) {
    throw touca::detail::runtime_error(
        touca::detail::format("failed to save content to disk: {}", ex.what()));
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
    throw touca::detail::runtime_error(
        touca::detail::format("failed to save content to disk: {}", ex.what()));
  }
}

}  // namespace detail
}  // namespace touca
