// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/runner/detail/options.hpp"

#include "cxxopts.hpp"
#include "nlohmann/json.hpp"
#include "touca/client/detail/options.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/devkit/platform.hpp"
#include "touca/devkit/utils.hpp"

namespace touca {
namespace detail {

cxxopts::Options cli_options() {
  cxxopts::Options options("./app", "Command Line Options");

  // clang-format off
  options.add_options("main")
      ("h,help", "displays this help message")
      ("v,version", "prints version of this executable")
      ("c,config-file",
          "path to configuration file",
          cxxopts::value<std::string>())
      ("api-key",
          "Touca server api key",
          cxxopts::value<std::string>())
      ("api-url",
          "Touca server api url",
          cxxopts::value<std::string>())
      ("team",
          "slug of team to which testresults belong",
          cxxopts::value<std::string>())
      ("suite",
          "slug of suite to which testresults belong",
          cxxopts::value<std::string>())
      ("r,revision",
          "version to associate with testresults",
          cxxopts::value<std::string>())
      ("testcase",
          "one or more testcases to feed to the workflow",
          cxxopts::value<std::vector<std::string>>())
      ("testcase-file",
          "single file listing testcases to feed to the workflow",
          cxxopts::value<std::string>())
      ("o,output-dir",
          "path to output directory",
          cxxopts::value<std::string>()->default_value("./results"))
      ("log-level",
          "level of detail with which events are logged",
          cxxopts::value<std::string>()->default_value("info"))
      ("save-as-binary",
          "save a copy of test results on local disk in binary format",
          cxxopts::value<bool>()->implicit_value("true")->default_value("true"))
      ("save-as-json",
          "save a copy of test results on local disk in json format",
          cxxopts::value<bool>()->implicit_value("true")->default_value("false"))
      ("skip-logs",
          "do not generate log files",
          cxxopts::value<bool>()->implicit_value("true"))
      ("redirect-output",
          "redirect content printed to standard streams to files",
          cxxopts::value<bool>()->default_value("true"))
      ("offline",
          "do not submit results to Touca server",
          cxxopts::value<bool>()->implicit_value("true"))
      ("overwrite",
          "overwrite result directory for testcase if it already exists",
          cxxopts::value<bool>()->implicit_value("true"))
      ("colored-output",
          "use color in standard output",
          cxxopts::value<bool>()->default_value("true"));
  // clang-format on

  return options;
}

template <typename T>
void parse_cli_option(const cxxopts::ParseResult& result,
                      const std::string& key, T& field) {
  if (result[key].count()) {
    field = result[key].as<T>();
  }
}

template <typename T>
void parse_file_option(const nlohmann::json& result, const std::string& key,
                       T& field) {
  if (result.contains(key)) {
    field = result[key];
  }
}

/**
 * @param argc number of arguments provided to the application
 * @param argv list of arguments provided to the application
 * @param options application configuration parameters
 */
bool parse_cli_options(int argc, char* argv[], FrameworkOptions& options) {
  auto opts = cli_options();
  opts.allow_unrecognised_options();
  try {
    const auto& result = opts.parse(argc, argv);
    if (result.count("help")) {
      options.has_help = true;
    }
    if (result.count("version")) {
      options.has_version = true;
    }
    if (result.count("testcase")) {
      options.testcases = result["testcase"].as<std::vector<std::string>>();
    }
    options.output_dir = result["output-dir"].as<std::string>();
    options.log_level = result["log-level"].as<std::string>();
    options.save_binary = result["save-as-binary"].as<bool>();
    options.save_json = result["save-as-json"].as<bool>();
    options.redirect = result["redirect-output"].as<bool>();
    options.colored_output = result["colored-output"].as<bool>();
    parse_cli_option(result, "api-key", options.api_key);
    parse_cli_option(result, "api-url", options.api_url);
    parse_cli_option(result, "config-file", options.config_file);
    parse_cli_option(result, "testcase-file", options.testcase_file);
    parse_cli_option(result, "team", options.team);
    parse_cli_option(result, "suite", options.suite);
    parse_cli_option(result, "revision", options.revision);
    parse_cli_option(result, "skip-logs", options.skip_logs);
    parse_cli_option(result, "offline", options.offline);
    parse_cli_option(result, "overwrite", options.overwrite);
  } catch (const cxxopts::OptionParseException& ex) {
    touca::print_error("failed to parse command line arguments: {}\n",
                       ex.what());
    return false;
  }

  return true;
}

bool parse_file_options(FrameworkOptions& options) {
  // if user is asking for help description or framework version,
  // do not parse the configuration file even if it is specified.

  if (options.has_help || options.has_version) {
    return true;
  }

  // if configuration file is not specified yet a file config.json
  // exists in current directory, attempt to use that file.

  if (options.config_file.empty()) {
    if (!touca::filesystem::is_regular_file("./config.json")) {
      return true;
    }
    options.config_file = "./config.json";
  }

  // configuration file must exist if it is specified

  if (!touca::filesystem::is_regular_file(options.config_file)) {
    touca::print_error("configuration file not found: {}\n",
                       options.config_file);
    return false;
  }

  // load configuration file in memory
  const auto& content = touca::detail::load_string_file(options.config_file);

  // parse configuration file

  const auto& parsed = nlohmann::json::parse(content, nullptr, false);
  if (parsed.is_discarded()) {
    touca::print_error("failed to parse configuration file\n");
    return false;
  }

  // we expect content to be a json object

  if (!parsed.is_object()) {
    touca::print_error("expected configuration file to be a json object\n");
    return false;
  }

  for (const auto& kvp : parsed.items()) {
    const auto& result = kvp.value();
    if (kvp.key() == "touca") {
      if (!result.is_object()) {
        touca::print_error(
            "field \"touca\" in configuration file has unexpected type\n");
        return false;
      }
      parse_file_option(result, "team", options.team);
      parse_file_option(result, "suite", options.suite);
      parse_file_option(result, "revision", options.revision);
      parse_file_option(result, "api-key", options.api_key);
      parse_file_option(result, "api-url", options.api_url);
      parse_file_option(result, "offline", options.offline);
      parse_file_option(result, "single-thread", options.single_thread);

      parse_file_option(result, "config-file", options.config_file);
      parse_file_option(result, "output-dir", options.output_dir);
      parse_file_option(result, "log-level", options.log_level);
      parse_file_option(result, "save-as-binary", options.save_binary);
      parse_file_option(result, "save-as-json", options.save_json);
      parse_file_option(result, "skip-logs", options.skip_logs);
      parse_file_option(result, "redirect-output", options.redirect);
      parse_file_option(result, "overwrite", options.overwrite);
      parse_file_option(result, "testcase-file", options.testcase_file);
    } else {
      if (result.is_string()) {
        options.extra.emplace(kvp.key(), result.get<std::string>());
      } else if (result.is_boolean()) {
        options.extra.emplace(kvp.key(), result.get<bool>() ? "true" : "false");
      }
    }
  }

  return true;
}

bool parse_api_url(FrameworkOptions& options) {
  // it is okay if configuration option `--api-url` is not specified
  if (options.api_url.empty()) {
    return true;
  }
  touca::ApiUrl api(options.api_url);
  if (options.team.empty() && !api._team.empty()) {
    options.team = api._team;
  }
  if (options.suite.empty() && !api._suite.empty()) {
    options.suite = api._suite;
  }
  if (options.revision.empty() && !api._revision.empty()) {
    options.revision = api._revision;
  }
  return true;
}

}  // namespace detail

std::string cli_help_description() { return detail::cli_options().help(); }

bool parse_options(int argc, char* argv[], FrameworkOptions& options) {
  auto ret = true;
  ret &= detail::parse_cli_options(argc, argv, options);
  ret &= detail::parse_file_options(options);
  parse_env_variables(options);
  ret &= detail::parse_api_url(options);
  return ret;
}

}  // namespace touca
