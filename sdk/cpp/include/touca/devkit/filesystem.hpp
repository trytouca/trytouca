// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#if ((defined(_MSVC_LANG) && _MSVC_LANG >= 201703L) || (defined(__cplusplus) && __cplusplus >= 201703L)) && defined(__has_include)
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
#include <ghc/filesystem.hpp>
#else
#include <ghc/fs_fwd.hpp>
#endif
namespace touca {
    namespace filesystem = ghc::filesystem;
}
#endif
