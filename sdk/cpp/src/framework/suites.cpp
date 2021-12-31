// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/runner/suites.hpp"

#include <algorithm>
#include <fstream>

#include "touca/devkit/platform.hpp"

namespace touca {
namespace framework {

RemoteSuite::RemoteSuite(const FrameworkOptions& options)
    : Suite(), _options(options) {}

void RemoteSuite::initialize() {
  // To obtain list of testcases from the server, we expect
  // the following configuration options are set.
  if (_options.api_key.empty() || _options.api_url.empty() ||
      _options.team.empty() || _options.suite.empty() ||
      _options.revision.empty()) {
    return;
  }

  // authenticate to the server.

  ApiUrl api_url(_options.api_url);
  if (!api_url.confirm(_options.team, _options.suite, _options.revision)) {
    throw std::runtime_error(api_url._error);
  }

  Platform platform(api_url);
  if (!platform.auth(_options.api_key)) {
    throw std::runtime_error(platform.get_error());
  }

  // ask the server for the list of elements
  for (const auto& element : platform.elements()) {
    push(element);
  }
}

FileSuite::FileSuite(const std::string& path) : Suite(), _path(path) {}

void FileSuite::initialize() {
  std::string line;
  std::ifstream ifs(_path);
  while (std::getline(ifs, line)) {
    // skip empty lines
    if (line.empty()) {
      continue;
    }
    // skip comment lines: by default, we define comment lines as
    // lines that start with two pound characters
    if (line.compare(0, 2, "##") == 0) {
      continue;
    }
    push(line);
  }
}

}  // namespace framework
}  // namespace touca
