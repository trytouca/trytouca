// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include <unordered_map>

#include "cxxopts.hpp"
#include "touca/cli/comparison.hpp"
#include "touca/cli/deserialize.hpp"
#include "touca/cli/operations.hpp"
#include "touca/core/filesystem.hpp"

bool CompareOperation::parse_impl(int argc, char* argv[]) {
  cxxopts::Options options("touca_cli --mode=compare");
  // clang-format off
    options.add_options("main")
        ("src", "file or directory to compare", cxxopts::value<std::string>())
        ("dst", "file or directory to compare against", cxxopts::value<std::string>());
  // clang-format on
  options.allow_unrecognised_options();

  const auto& result = options.parse(argc, argv);

  const std::unordered_map<std::string, std::string> filetypes = {
      {"src", "source"}, {"dst", "destination"}};

  for (const auto& kvp : filetypes) {
    if (!result.count(kvp.first)) {
      print_error(touca::detail::format("{} file not provided\n", kvp.second));
      fmt::print(stdout, "{}\n", options.help());
      return false;
    }
    const auto filepath = result[kvp.first].as<std::string>();
    if (!touca::filesystem::is_regular_file(filepath)) {
      print_error(touca::detail::format("{} file `{}` does not exist\n",
                                        kvp.second, filepath));
      return false;
    }
  }

  _src = result["src"].as<std::string>();
  _dst = result["dst"].as<std::string>();

  return true;
}

bool CompareOperation::run_impl() const {
  try {
    const auto& res = touca::compare(touca::deserialize_file(_src),
                                     touca::deserialize_file(_dst));
    fmt::print(stdout, "{}\n", res.json());
    return true;
  } catch (const std::exception& ex) {
    print_error(
        touca::detail::format("failed to compare given files: {}", ex.what()));
  }
  return false;
}
