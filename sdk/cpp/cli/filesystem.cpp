// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/cli/filesystem.hpp"

#include "touca/devkit/resultfile.hpp"
#include "touca/devkit/utils.hpp"

std::vector<touca::filesystem::path> discover(
    const touca::filesystem::path& path) {
  if (touca::filesystem::is_regular_file(path)) {
    touca::ResultFile srcFile(path);
    if (!srcFile.validate()) {
      return {};
    }
    return {path};
  }
  if (!touca::filesystem::is_directory(path)) {
    return {};
  }
  std::vector<touca::filesystem::path> output;
  for (const auto& it : touca::filesystem::recursive_directory_iterator(path)) {
    touca::ResultFile srcFile(it.path());
    if (!srcFile.validate()) {
      continue;
    }
    output.push_back(it.path());
  }
  return output;
}

std::vector<touca::filesystem::path> find_binary_files(
    const touca::filesystem::path& path) {
  auto output = discover(path);
  const auto& func = [](const touca::filesystem::path& a,
                        const touca::filesystem::path& b) {
    return touca::filesystem::file_size(a) < touca::filesystem::file_size(b);
  };
  std::sort(output.begin(), output.end(), func);
  return output;
}
