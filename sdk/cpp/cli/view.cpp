// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "cxxopts.hpp"
#include "touca/cli/operations.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/devkit/resultfile.hpp"
#include "touca/devkit/utils.hpp"

bool ViewOperation::parse_impl(int argc, char* argv[]) {
  cxxopts::Options options("touca_cli --mode=view");
  // clang-format off
    options.add_options("main")
        ("src", "result file to view in json format", cxxopts::value<std::string>());
  // clang-format on
  options.allow_unrecognised_options();
  const auto& result = options.parse(argc, argv);
  if (!result.count("src")) {
    touca::print_error("source file not provided\n");
    fmt::print(stdout, "{}\n", options.help());
    return false;
  }
  _src = result["src"].as<std::string>();
  if (!touca::filesystem::is_regular_file(_src)) {
    touca::print_error("file `{}` does not exist\n", _src);
    return false;
  }
  return true;
}

bool ViewOperation::run_impl() const {
  touca::ResultFile file(_src);
  try {
    fmt::print(stdout, "{}\n", file.read_file_in_json());
    return true;
  } catch (const std::exception& ex) {
    touca::print_error("failed to read file {}: {}\n", _src, ex.what());
  }
  return false;
}
