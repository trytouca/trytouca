// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/client/detail/options.hpp"

#include <algorithm>
#include <cstdlib>
#include <functional>

#include "rapidjson/document.h"
#include "touca/client/detail/options.hpp"
#include "touca/core/filesystem.hpp"

#ifdef TOUCA_INCLUDE_RUNNER
#include "cxxopts.hpp"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#endif

namespace touca {
namespace detail {

void assign_option(const std::unordered_map<std::string, std::string> source,
                   std::string& field, const std::string& key) {
  if (source.count(key)) {
    field.assign(source.at(key));
  }
}

void assign_option(const std::unordered_map<std::string, std::string> source,
                   bool& field, const std::string& key) {
  if (source.count(key)) {
    field = source.at(key) == "true";
  }
}

void assign_core_options(
    ClientOptions& target,
    const std::unordered_map<std::string, std::string>& source) {
  assign_option(source, target.api_key, "api_key");
  assign_option(source, target.api_url, "api_url");
  assign_option(source, target.team, "team");
  assign_option(source, target.suite, "suite");
  assign_option(source, target.version, "version");
  assign_option(source, target.offline, "offline");
  assign_option(source, target.concurrency, "concurrency");
  assign_option(source, target.api_key, "api-key");
  assign_option(source, target.api_url, "api-url");
  assign_option(source, target.version, "revision");
}

void apply_environment_variables(ClientOptions& options) {
  if (const auto value = std::getenv("TOUCA_API_KEY")) {
    options.api_key = value;
  }
  if (const auto value = std::getenv("TOUCA_API_URL")) {
    options.api_url = value;
  }
  if (const auto value = std::getenv("TOUCA_TEST_VERSION")) {
    options.version = value;
  }
}

void apply_api_url(ClientOptions& options) {
  if (options.api_url.empty()) {
    return;
  }
  const ApiUrl url(options.api_url);
  std::unordered_map<std::string, std::string> source{
      {"api_url", url.prefix.empty()
                      ? url.root
                      : touca::detail::format("{}/{}", url.root, url.prefix)}};
  if (!url.extra.empty()) {
    const std::vector<std::string> slugs{"team", "suite", "version"};
    std::istringstream iss(url.extra);
    std::string item;
    uint8_t i = 0;
    while (std::getline(iss, item, '/') && i < slugs.size()) {
      if (!item.empty()) {
        source.emplace(slugs.at(i++), item);
      }
    }
  }
  assign_core_options(options, source);
}

void apply_core_options(ClientOptions& options) {
  if (!options.offline) {
    options.offline = options.api_key.empty() && options.api_url.empty();
  }
  if (!options.api_key.empty() && options.api_url.empty()) {
    options.api_url = "https://api.touca.io";
  }
}

/**
 * Authenticates with the server at the specified API URL using the specified
 * API Key if both of them are given and SDK is not operating in offline mode.
 * If the server accepts this request, parse the response to extract the API
 * Token issued by the server.
 *
 * @param options SDK configuration options
 * @param transport SDK HTTP transport
 */
void authenticate(const ClientOptions& options,
                  const std::unique_ptr<Transport>& transport) {
  if (options.offline || options.api_key.empty() || options.api_url.empty() ||
      (options.team.empty() && options.suite.empty() &&
       options.version.empty())) {
    return;
  }
  transport->configure(options.api_key, options.api_url);
}

void validate_core_options(const ClientOptions& options) {
  std::vector<std::string> missing_keys;
  const auto& check_missing_key = [&missing_keys](const std::string& value,
                                                  const std::string& name) {
    if (value.empty()) {
      missing_keys.push_back(touca::detail::format("\"{}\"", name));
    }
  };
  if (!options.offline) {
    check_missing_key(options.api_key, "api-key");
    check_missing_key(options.api_url, "api-url");
  }
  if (!(options.team.empty() && options.suite.empty() &&
        options.version.empty()) ||
      !options.offline) {
    check_missing_key(options.team, "team");
    check_missing_key(options.suite, "suite");
    check_missing_key(options.version, "revision");
  }
  if (!missing_keys.empty()) {
    throw touca::detail::runtime_error(
        touca::detail::format("required configuration options {} are missing",
                              fmt::join(missing_keys, ", ")));
  }
}

void update_core_options(ClientOptions& options,
                         const std::unique_ptr<Transport>& transport) {
  apply_environment_variables(options);
  apply_api_url(options);
  apply_core_options(options);
  authenticate(options, transport);
  validate_core_options(options);
}

#ifdef TOUCA_INCLUDE_RUNNER

touca::filesystem::path find_home_directory() {
#if defined(_WIN32)
  const auto& home_env = "HOMEPATH";
#else
  const auto& home_env = "HOME";
#endif
  const auto tmp_dir = std::getenv("TOUCA_HOME_DIR");
  const auto& cwd = touca::filesystem::current_path() / ".touca";
  const auto& home = touca::filesystem::path(std::getenv(home_env)) / ".touca";
  return tmp_dir && touca::filesystem::exists(tmp_dir) ? tmp_dir
         : touca::filesystem::exists(cwd)              ? cwd
                                                       : home;
}

void assign_runner_options(
    RunnerOptions& target,
    const std::unordered_map<std::string, std::string>& source) {
  assign_core_options(target, source);
  assign_option(source, target.config_file, "config_file");
  assign_option(source, target.output_directory, "output_directory");
  assign_option(source, target.overwrite_results, "overwrite_results");
  assign_option(source, target.workflow_filter, "workflow_filter");
  assign_option(source, target.save_binary, "save_binary");
  assign_option(source, target.save_json, "save_json");
  assign_option(source, target.log_level, "log_level");
  assign_option(source, target.redirect_output, "redirect_output");
  assign_option(source, target.skip_logs, "skip_logs");
  assign_option(source, target.save_binary, "save-as-binary");
  assign_option(source, target.save_json, "save-as-json");
  assign_option(source, target.output_directory, "output-directory");
  assign_option(source, target.overwrite_results, "overwrite");
  assign_option(source, target.workflow_filter, "filter");
}

std::unordered_map<std::string, std::string> load_ini_file(
    const touca::filesystem::path& path,
    const std::string& section = "settings") {
  std::unordered_map<std::string, std::string> out;
  std::stringstream content(touca::detail::load_text_file(path.string()));
  std::string line;
  bool capture = false;
  while (std::getline(content, line, '\n')) {
    if (line.rfind("[", 0) == 0) {
      capture = line.compare(touca::detail::format("[{}]", section)) == 0;
      continue;
    }
    if (capture && line.find('=') != std::string::npos) {
      const auto index = line.find('=');
      out.emplace(line.substr(0, index - 1), line.substr(index + 2));
    }
  }
  return out;
}

std::string make_remote_options_payload(RunnerOptions& options) {
  rapidjson::Document doc(rapidjson::kArrayType);
  rapidjson::Document::AllocatorType& allocator = doc.GetAllocator();
  for (const auto& workflow : options.workflows) {
    if (options.team.empty() || workflow.suite.empty()) {
      continue;
    }
    rapidjson::Value rjItem(rapidjson::kObjectType);
    rjItem.AddMember("team", options.team, allocator);
    rjItem.AddMember("suite", workflow.suite, allocator);
    if (!workflow.version.empty()) {
      rjItem.AddMember("version", workflow.version, allocator);
    }
    if (workflow.testcases.empty()) {
      rapidjson::Value rjCases(rapidjson::kArrayType);
      rjItem.AddMember("testcases", rjCases, allocator);
    }
    doc.PushBack(rjItem, allocator);
  }
  rapidjson::StringBuffer string_buf;
  rapidjson::Writer<rapidjson::StringBuffer> writer(string_buf);
  writer.SetMaxDecimalPlaces(3);
  doc.Accept(writer);
  return string_buf.GetString();
}

std::vector<WorkflowOptions> parse_remote_options_response(
    const std::string& response) {
  std::vector<WorkflowOptions> out;
  rapidjson::Document parsed;
  if (parsed.Parse<0>(response.c_str()).HasParseError()) {
    throw touca::detail::runtime_error("failed to parse server response");
  }
  if (!parsed.IsArray()) {
    throw touca::detail::runtime_error(
        "Server returned unexpected response for remote options.");
  }
  for (const auto& item : parsed.GetArray()) {
    WorkflowOptions workflow;
    if (!item.IsObject()) {
      continue;
    }
    const auto& members = item.GetObject();
    if (members.HasMember("suite") && members["suite"].IsString()) {
      workflow.suite = members["suite"].GetString();
    }
    if (members.HasMember("version") && members["version"].IsString()) {
      workflow.version = members["version"].GetString();
    }
    if (members.HasMember("testcases") && members["testcases"].IsArray()) {
      for (const auto& testcase : members["testcases"].GetArray()) {
        if (testcase.IsString()) {
          workflow.testcases.push_back(testcase.GetString());
        }
      }
    }
    out.push_back(workflow);
  }
  return out;
}

static cxxopts::Options cli_options(const char* program = "./app") {
  cxxopts::Options options(program, "Command Line Options\n");

  // clang-format off
  options.add_options("main")
      ("h,help", "displays this help message")
      ("v,version", "prints version of this executable")
      ("api-key",
          "Touca server api key",
          cxxopts::value<std::string>())
      ("api-url",
          "Touca server api url",
          cxxopts::value<std::string>())
      ("team",
          "slug of team to which test results belong",
          cxxopts::value<std::string>())
      ("suite",
          "slug of suite to which test results belong",
          cxxopts::value<std::string>())
      ("revision",
          "version to associate with test results",
          cxxopts::value<std::string>())
      ("offline",
          "do not submit results to Touca server",
          cxxopts::value<bool>()->implicit_value("true"))
      ("save-as-binary",
          "save a copy of test results on local disk in binary format",
          cxxopts::value<bool>()->implicit_value("true")->default_value("true"))
      ("save-as-json",
          "save a copy of test results on local disk in json format",
          cxxopts::value<bool>()->implicit_value("true")->default_value("false"))
      ("output-directory",
          "path to a local directory to store results files",
          cxxopts::value<std::string>())
      ("overwrite",
          "overwrite result directory for testcase if it already exists",
          cxxopts::value<bool>()->implicit_value("true"))
      ("testcase",
          "one or more testcases to feed to the workflow",
          cxxopts::value<std::vector<std::string>>())
      ("filter",
          "Name of the workflow to run",
          cxxopts::value<std::string>())
      ("log-level",
          "level of detail with which events are logged",
          cxxopts::value<std::string>()->default_value("info"))
      ("colored-output",
          "use color in standard output",
          cxxopts::value<bool>()->default_value("true"))
      ("config-file",
          "path to configuration file",
          cxxopts::value<std::string>())
      ("skip-logs",
          "do not generate log files",
          cxxopts::value<bool>()->implicit_value("true"))
      ("redirect-output",
          "redirect content printed to standard streams to files",
          cxxopts::value<bool>()->default_value("true"));
  // clang-format on

  return options;
}

template <typename T>
static void parse_cli_option(const cxxopts::ParseResult& result,
                             const std::string& key, T& field) {
  if (result[key].count()) {
    field = result[key].as<T>();
  }
}

static void parse_file_option(const rapidjson::Value& result,
                              const std::string& key, std::string& field) {
  if (result.HasMember(key) && result[key].IsString()) {
    field = result[key].GetString();
  }
}

static void parse_file_option(const rapidjson::Value& result,
                              const std::string& key, bool& field) {
  if (result.HasMember(key) && result[key].IsBool()) {
    field = result[key].GetBool();
  }
}

/**
 * @param argc number of arguments provided to the application
 * @param argv list of arguments provided to the application
 * @param options test runner configuration options
 */
void apply_cli_arguments(int argc, char* argv[], RunnerOptions& options) {
  auto opts = cli_options(argv[0]);
  opts.allow_unrecognised_options();
  try {
    const auto& result = opts.parse(argc, argv);
    if (result.count("help")) {
      throw touca::detail::graceful_exit_error(touca::detail::format(
          "{}\nSee https://touca.io/docs for more information.", opts.help()));
    }
    if (result.count("version")) {
      throw touca::detail::graceful_exit_error(
          touca::detail::format("v{}.{}.{}", TOUCA_VERSION_MAJOR,
                                TOUCA_VERSION_MINOR, TOUCA_VERSION_PATCH));
    }
    if (result.count("testcase")) {
      options.testcases = result["testcase"].as<std::vector<std::string>>();
    }
    parse_cli_option(result, "output-directory", options.output_directory);
    parse_cli_option(result, "log-level", options.log_level);
    parse_cli_option(result, "save-as-binary", options.save_binary);
    parse_cli_option(result, "save-as-json", options.save_json);
    parse_cli_option(result, "redirect-output", options.redirect_output);
    parse_cli_option(result, "colored-output", options.colored_output);
    parse_cli_option(result, "api-key", options.api_key);
    parse_cli_option(result, "api-url", options.api_url);
    parse_cli_option(result, "config-file", options.config_file);
    parse_cli_option(result, "team", options.team);
    parse_cli_option(result, "suite", options.suite);
    parse_cli_option(result, "revision", options.version);
    parse_cli_option(result, "skip-logs", options.skip_logs);
    parse_cli_option(result, "offline", options.offline);
    parse_cli_option(result, "overwrite", options.overwrite_results);
  } catch (const cxxopts::OptionParseException& ex) {
    throw touca::detail::runtime_error(touca::detail::format(
        "failed to parse command line arguments: {}", ex.what()));
  }
}

void apply_config_file(RunnerOptions& options) {
  if (options.config_file.empty()) {
    return;
  }

  // configuration file must exist if it is specified
  if (!touca::filesystem::is_regular_file(options.config_file)) {
    throw touca::detail::runtime_error(touca::detail::format(
        "configuration file not found: {}", options.config_file));
  }

  // parse configuration file
  const auto& content = touca::detail::load_text_file(options.config_file);
  rapidjson::Document parsed;
  if (parsed.Parse<0>(content.c_str()).HasParseError()) {
    throw touca::detail::runtime_error("failed to parse configuration file");
  }

  // we expect content to be a json object
  if (!parsed.IsObject()) {
    throw touca::detail::runtime_error(
        "Expected configuration file to be a json object.");
  }

  for (auto it = parsed.MemberBegin(); it != parsed.MemberEnd(); ++it) {
    if (!it->name.IsString()) {
      continue;
    }
    const std::string key = it->name.GetString();
    const auto& result = it->value;
    if (key == "touca") {
      if (!result.IsObject()) {
        throw touca::detail::runtime_error(
            "expected field \"touca\" in configuration file to be an object");
      }
      parse_file_option(result, "api-key", options.api_key);
      parse_file_option(result, "api-url", options.api_url);
      parse_file_option(result, "team", options.team);
      parse_file_option(result, "suite", options.suite);
      parse_file_option(result, "revision", options.version);
      parse_file_option(result, "offline", options.offline);
      parse_file_option(result, "concurrency", options.concurrency);

      parse_file_option(result, "config-file", options.config_file);
      parse_file_option(result, "output-directory", options.output_directory);
      parse_file_option(result, "log-level", options.log_level);
      parse_file_option(result, "save-as-binary", options.save_binary);
      parse_file_option(result, "save-as-json", options.save_json);
      parse_file_option(result, "skip-logs", options.skip_logs);
      parse_file_option(result, "redirect-output", options.redirect_output);
      parse_file_option(result, "overwrite", options.overwrite_results);
    }
  }
}

void apply_config_profile(RunnerOptions& options) {
  std::string name{"default"};
  const auto& home = find_home_directory();
  const auto& settings_file = home / "settings";
  if (touca::filesystem::exists(settings_file)) {
    const auto& content = load_ini_file(settings_file);
    if (content.count("profile")) {
      name = content.at("profile");
    }
  }
  const auto& profile = home / "profiles" / name;
  if (touca::filesystem::exists(profile)) {
    const auto& content = load_ini_file(profile);
    assign_runner_options(options, content);
  }
}

void apply_runner_options(RunnerOptions& options) {
  if (options.output_directory.empty()) {
    options.output_directory = (find_home_directory() / "results").string();
  }
  if (!options.workflow_filter.empty()) {
    std::vector<Workflow> tmp;
    std::copy_if(options.workflows.begin(), options.workflows.end(),
                 std::back_inserter(tmp), [&options](Workflow& w) {
                   return w.suite == options.workflow_filter;
                 });
    options.workflows = tmp;
    options.workflow_filter.clear();
  }
  for (auto& w : options.workflows) {
    if (!options.testcases.empty()) {
      w.testcases = options.testcases;
    }
    if (!options.suite.empty()) {
      w.suite = options.suite;
    }
    if (!options.version.empty()) {
      w.version = options.version;
    }
  }
  options.suite.clear();
  options.version.clear();
  options.testcases.clear();
}

void apply_remote_options(RunnerOptions& options,
                          const std::unique_ptr<Transport>& transport) {
  if (options.offline || options.api_key.empty() || options.api_url.empty() ||
      options.workflows.empty()) {
    return;
  }
  const auto& payload = make_remote_options_payload(options);
  const auto& response = transport->post("/client/options", payload);
  if (response.status == -1) {
    throw touca::detail::runtime_error(touca::detail::format(
        "failed to reach server at {}: {}", options.api_url, response.body));
  }
  if (response.status == 403) {
    throw touca::detail::runtime_error(
        touca::detail::format("authentication failed: {}", response.status));
  }
  if (response.status != 200) {
    throw touca::detail::runtime_error(
        touca::detail::format("Failed to fetch options from the remote "
                              "server. (Response status: {})",
                              response.status));
  }
  const auto& parsed = parse_remote_options_response(response.body);
  for (const auto& v : parsed) {
    const auto& workflow =
        std::find_if(options.workflows.begin(), options.workflows.end(),
                     [&v](Workflow& w) { return v.suite == w.suite; });
    if (workflow != options.workflows.end()) {
      workflow->version = v.version;
      if (workflow->testcases.empty()) {
        workflow->testcases = v.testcases;
      }
    }
  }
}

void validate_runner_options(const RunnerOptions& options) {
  std::vector<std::string> missing_keys;
  const auto& check_missing_key = [&missing_keys](const std::string& value,
                                                  const std::string& name) {
    if (value.empty()) {
      missing_keys.push_back(touca::detail::format("\"{}\"", name));
    }
  };
  if (!options.offline) {
    check_missing_key(options.api_key, "api-key");
    check_missing_key(options.api_url, "api-url");
  }
  if (!missing_keys.empty()) {
    throw touca::detail::runtime_error(
        touca::detail::format("required configuration options {} are missing",
                              fmt::join(missing_keys, ", ")));
  }

  if (std::any_of(options.workflows.begin(), options.workflows.end(),
                  [](const Workflow& w) { return w.version.empty(); })) {
    throw touca::detail::runtime_error(
        "Configuration option \"revision\" is missing for one or more "
        "workflows.");
  }
  if (std::any_of(options.workflows.begin(), options.workflows.end(),
                  [](const Workflow& w) { return w.testcases.empty(); })) {
    throw touca::detail::runtime_error(
        "Configuration option \"testcases\" is missing for one or more "
        "workflows.");
  }

  const auto& levels = {"debug", "info", "warning"};
  if (std::find(levels.begin(), levels.end(), options.log_level) ==
      levels.end()) {
    throw touca::detail::runtime_error(
        "Configuration option \"log-level\" must be one of "
        "\"debug\", \"info\" or \"warning\".");
  }
}

void update_runner_options(int argc, char* argv[], RunnerOptions& options) {
  apply_cli_arguments(argc, argv, options);
  apply_config_file(options);
  apply_config_profile(options);
  apply_environment_variables(options);
  apply_api_url(options);
  apply_core_options(options);
  set_client_options(options);
  authenticate(options, get_client_transport());
  apply_runner_options(options);
  apply_remote_options(options, get_client_transport());
  validate_runner_options(options);
}
#endif  // TOUCA_INCLUDE_RUNNER

}  // namespace detail
}  // namespace touca
