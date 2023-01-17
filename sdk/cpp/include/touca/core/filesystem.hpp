// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "touca/core/config.hpp"

#if ((defined(_MSVC_LANG) && _MSVC_LANG >= 201703L) ||    \
     (defined(__cplusplus) && __cplusplus >= 201703L)) && \
    defined(__has_include)
#if __has_include(<filesystem>) && (!defined(__MAC_OS_X_VERSION_MIN_REQUIRED) || __MAC_OS_X_VERSION_MIN_REQUIRED >= 101500)
#define GHC_USE_STD_FS
#include <filesystem>
namespace touca {
namespace filesystem = std::filesystem;
}
#endif
#endif
#ifndef GHC_USE_STD_FS
#if _WIN32
#pragma warning(push)
#pragma warning(disable : 4127)
#include <ghc/filesystem.hpp>
#pragma warning(pop)
#else
#include <ghc/fs_fwd.hpp>
#endif
namespace touca {
namespace filesystem = ghc::filesystem;
}
#endif

#include <ios>
#include <memory>
#include <string>
#include <vector>

#include "fmt/core.h"
#include "touca/lib_api.hpp"

namespace touca {
namespace detail {

using fmt::format;

#ifdef TOUCA_HAS_CPP14
using std::make_unique;
#else
template <typename T, typename... Args>
std::unique_ptr<T> make_unique(Args&&... args) {
  return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}
#endif

struct graceful_exit_error : public std::runtime_error {
  graceful_exit_error(const std::string& msg) : std::runtime_error(msg) {}
};

struct runtime_error : public std::runtime_error {
  runtime_error(const std::string& msg) : std::runtime_error(msg) {}
};

/**
 * Helper function to load content of a file with given path.
 *
 * @param path path to the file whose content should be loaded
 *
 * @param mode bitmask representing mode in which the file should be opened.
 *             visit https://en.cppreference.com/w/cpp/io/ios_base/openmode
 *             for more information.
 *
 * @throw touca::detail::runtime_error if the file with given path is missing
 *
 * @return content of the file with given path
 */
TOUCA_CLIENT_API std::string load_text_file(
    const std::string& path, const std::ios_base::openmode mode = std::ios::in);

TOUCA_CLIENT_API void save_text_file(const std::string& path,
                                     const std::string& content);

TOUCA_CLIENT_API void save_binary_file(const std::string& path,
                                       const std::vector<uint8_t>& content);

}  // namespace detail
}  // namespace touca
