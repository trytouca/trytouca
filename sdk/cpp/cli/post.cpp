// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "cxxopts.hpp"
#include "touca/cli/filesystem.hpp"
#include "touca/cli/operations.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/core/platform.hpp"
#include "touca/core/utils.hpp"

/**
 * we used to validate that the given directory has at least one
 * Touca result file. However, since finding Touca result files
 * is an expensive operation, we choose to defer this check to
 * operation run-time.
 */
bool PostOperation::parse_impl(int argc, char* argv[]) {
  cxxopts::Options options("touca_cli --mode=post");
  // clang-format off
    options.add_options("main")
        ("src", "file or directory to be posted", cxxopts::value<std::string>())
        ("api-key", "API Key to authenticate to Touca server", cxxopts::value<std::string>())
        ("api-url", "URL to Touca server API", cxxopts::value<std::string>())
        ("fail-fast", "abort as soon as we encounter an error ", cxxopts::value<bool>()->default_value("true"));
  // clang-format on
  options.allow_unrecognised_options();

  const auto& result = options.parse(argc, argv);

  if (!result.count("src")) {
    touca::print_error("file or directory not provided\n");
    fmt::print(stdout, "{}\n", options.help());
    return false;
  }

  _src = result["src"].as<std::string>();

  if (!touca::filesystem::exists(_src)) {
    touca::print_error("file `{}` does not exist\n", _src);
    return false;
  }

  if (!result.count("api-url")) {
    touca::print_error("api-url not provided\n");
    fmt::print(stdout, "{}\n", options.help());
    return false;
  }

  _api_url = result["api-url"].as<std::string>();

  if (!result.count("api-key")) {
    const auto env_value = std::getenv("TOUCA_API_KEY");
    if (env_value == nullptr) {
      touca::print_error("api-key not provided as argument or env variable\n");
      fmt::print(stdout, "{}\n", options.help());
      return false;
    }
    _api_key = std::string(env_value);
  } else {
    _api_key = result["api-key"].as<std::string>();
  }

  _fail_fast = result["fail-fast"].as<bool>();

  return true;
}

bool PostOperation::run_impl() const {
  // authenticate to the Touca server

  touca::Platform platform(_api_url);

  if (!platform.handshake()) {
    touca::print_error("failed to contact the server: {}\n",
                       platform.get_error());
    return false;
  }

  if (!platform.auth(_api_key)) {
    touca::print_error("failed to authenticate to the server: {}\n",
                       platform.get_error());
    return false;
  }

  // we allow user to specify a single file or a directory as the path
  // the result file(s). If a directory is specified, we recursively
  // iterate over all the file system elements in that directory and
  // identify Touca result files.

  const auto resultFiles = find_binary_files(_src);

  // we are done if there are no Touca result files in the given directory

  if (resultFiles.empty()) {
    touca::print_error("failed to find any valid result file");
    return false;
  }

  using err_t = std::unordered_map<std::string, std::vector<std::string>>;
  const auto print = [](const err_t& errors) {
    for (const auto& src : errors) {
      std::cerr << src.first << ":" << '\n';
      for (const auto& err : src.second) {
        std::cerr << " - " << err << std::endl;
      }
    }
  };

  // post the identified result files one by one to the Touca server.
  // by default we choose to abort as soon as we fail to post one of the
  // specified result files.

  err_t errors;
  for (const auto& src : resultFiles) {
    const auto& content =
        touca::detail::load_string_file(src.string(), std::ios::binary);
    const auto& errs = platform.submit(content, 5u);
    if (errs.empty()) {
      continue;
    }

    errors.emplace(src.string(), errs);
    touca::print_warning("failed to submit {}: {}", src.string(), errs.front());

    if (_fail_fast) {
      print(errors);
      return false;
    }
  }

  if (errors.empty()) {
    return true;
  }

  touca::print_error("failed to submit {} result files", errors.size());
  print(errors);
  return false;
}
