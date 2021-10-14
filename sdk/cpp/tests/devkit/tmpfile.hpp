// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <fstream>

#include "touca/core/utils.hpp"
#include "touca/devkit/utils.hpp"

struct TmpFile {
  TmpFile() : path(make_temp_path()) {}

  void write(const std::string& content) const {
    std::ofstream ofs(path);
    ofs << content;
    ofs.close();
  }

  ~TmpFile() {
    if (touca::filesystem::exists(path)) {
      touca::filesystem::remove_all(path);
    }
  }

  const touca::filesystem::path path;

 private:
  touca::filesystem::path make_temp_path() const {
    const auto filename = touca::format("touca_{}", std::rand());
    return touca::filesystem::temp_directory_path() / filename;
  }
};
