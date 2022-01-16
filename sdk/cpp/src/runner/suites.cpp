// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include <algorithm>
#include <fstream>
#include <vector>

#include "touca/devkit/platform.hpp"
#include "touca/runner/runner.hpp"

namespace touca {

std::vector<std::string> get_testsuite_remote(const FrameworkOptions& options) {
  std::vector<std::string> out;
  if (options.api_key.empty() || options.api_url.empty() ||
      options.team.empty() || options.suite.empty() ||
      options.revision.empty()) {
    return {};
  }
  ApiUrl api_url(options.api_url);
  if (!api_url.confirm(options.team, options.suite, options.revision)) {
    throw std::runtime_error(api_url._error);
  }
  Platform platform(api_url);
  if (!platform.auth(options.api_key)) {
    throw std::runtime_error(platform.get_error());
  }
  for (const auto& element : platform.elements()) {
    out.push_back(element);
  }
  return out;
}

std::vector<std::string> get_testsuite_local(
    const touca::filesystem::path& path) {
  std::vector<std::string> out;
  std::string line;
  std::ifstream ifs(path);
  while (std::getline(ifs, line)) {
    // skip empty lines
    if (line.empty()) {
      continue;
    }
    // skip comment lines
    if (line.compare(0, 2, "##") == 0) {
      continue;
    }
    out.push_back(line);
  }
  return out;
}

}  // namespace touca
