// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "cxxopts.hpp"
#include "touca/cli/filesystem.hpp"
#include "touca/cli/operations.hpp"
#include "touca/cli/resultfile.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/core/utils.hpp"

static const unsigned MAX_FILE_SIZE = 10u * 1024 * 1024;  // 10 megabytes

/**
 * we can validate that the given directory has at least one result file.
 * However, since finding result files is an expensive operation, we choose
 * to defer this check to operation run-time.
 */
bool MergeOperation::parse_impl(int argc, char* argv[]) {
  cxxopts::Options options("touca_cli --mode=merge");
  // clang-format off
    options.add_options("main")
        ("src", "path to directory with one or more result files", cxxopts::value<std::string>())
        ("out", "path to directory in which merged result files will be generated", cxxopts::value<std::string>());
  // clang-format on
  options.allow_unrecognised_options();

  const auto& result = options.parse(argc, argv);

  const std::unordered_map<std::string, std::string> filetypes = {
      {"src", "source"}, {"out", "output"}};

  for (const auto& kvp : filetypes) {
    if (!result.count(kvp.first)) {
      touca::print_error("{} directory not provided\n", kvp.second);
      fmt::print(stdout, "{}\n", options.help());
      return false;
    }
    const auto filepath = result[kvp.first].as<std::string>();
    if (!touca::filesystem::is_directory(filepath)) {
      touca::print_error("{} directory `{}` does not exist\n", kvp.second,
                         filepath);
      return false;
    }
  }

  _src = result["src"].as<std::string>();
  _out = result["out"].as<std::string>();

  return true;
}

/**
 * we expect user to specify a directory as source. we recursively
 * iterate over all the file system elements in that directory and
 * identify touca result files.
 */
bool MergeOperation::run_impl() const {
  const auto resultFiles = find_binary_files(_src);

  if (resultFiles.empty()) {
    touca::print_error("specified directory has no result file");
    return false;
  }

  using chunk_t = std::vector<touca::filesystem::path>;
  std::vector<chunk_t> chunks;
  for (auto i = 0u, j = 0u; i < resultFiles.size(); j = i) {
    for (auto chunkSize = 0ull; i < resultFiles.size(); ++i) {
      const auto fileSize = touca::filesystem::file_size(resultFiles.at(i));
      if (MAX_FILE_SIZE < chunkSize + fileSize) {
        ++i;
        break;
      }
      chunkSize += fileSize;
    }
    chunk_t chunk(resultFiles.begin() + j, resultFiles.begin() + i);
    chunks.emplace_back(chunk);
  }

  const auto& root = touca::filesystem::absolute(_out);
  for (auto i = 0ul; i < chunks.size(); ++i) {
    const auto filestem = touca::filesystem::path(_src).filename().string();
    const auto& filename =
        chunks.size() == 1ul
            ? touca::detail::format("{}.bin", filestem)
            : touca::detail::format("{}.part{}.bin", filestem, i + 1);
    const auto filepath = (root / filename).string();
    touca::ResultFile rf(filepath);
    for (const auto& file : chunks.at(i)) {
      rf.merge(touca::ResultFile(file));
    }
    rf.save();
  }

  return true;
}
