// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/client/detail/options.hpp"

#include "nlohmann/json.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/devkit/platform.hpp"

namespace touca {
namespace detail {
using func_t = std::function<void(const std::string&)>;

template <typename T>
func_t parse_member(T& member);

template <>
func_t parse_member(std::string& member) {
  return [&member](const std::string& value) { member = value; };
}

template <>
func_t parse_member(bool& member) {
  return [&member](const std::string& value) { member = value != "false"; };
}
}  // namespace detail

/**
 * the implementation below ensures that the environment variables take
 * precedence over the specified configuration parameters.
 */
void parse_env_variables(ClientOptions& options) {
  const std::unordered_map<std::string, std::string&> env_table = {
      {"TOUCA_API_KEY", options.api_key},
      {"TOUCA_API_URL", options.api_url},
      {"TOUCA_TEST_VERSION", options.revision},
  };
  for (const auto& kvp : env_table) {
    const auto env_value = std::getenv(kvp.first.c_str());
    if (env_value != nullptr) {
      kvp.second = env_value;
    }
  }
}

bool reformat_options(ClientOptions& existing) {
  parse_env_variables(existing);

  // associate a name to each string-based configuration parameter
  const std::unordered_map<std::string, std::string&> params = {
      {"team", existing.team},
      {"suite", existing.suite},
      {"version", existing.revision},
      {"api-key", existing.api_key},
      {"api-url", existing.api_url}};

  // if `api-url` is given in long format, parse `team`, `suite`, and
  // `version` from its path.
  ApiUrl api_url(existing.api_url);
  if (!api_url.confirm(existing.team, existing.suite, existing.revision)) {
    throw std::runtime_error(api_url._error);
  }
  existing.team = api_url._team;
  existing.suite = api_url._suite;
  existing.revision = api_url._revision;

  // if required parameters are not set, maybe user is just experimenting.
  const auto is_pristine = [&params](const std::vector<std::string>& keys) {
    return std::all_of(
        keys.begin(), keys.end(),
        [&params](const std::string& key) { return params.at(key).empty(); });
  };
  if (is_pristine({"team", "suite", "version", "api-key", "api-url"})) {
    return true;
  }

  // check that the set of available configuration parameters includes
  // the bare minimum required parameters.
  for (const auto& param : {"team", "suite", "version"}) {
    if (params.at(param).empty()) {
      throw std::runtime_error(fmt::format(
          "required configuration parameter \"{}\" is missing", param));
    }
  }

  // if `api_key` and `api_url` are not provided, assume user does
  // not intend to submit results in which case we are done.
  if (existing.offline) {
    return true;
  }

  // otherwise, check that all necessary config params are provided.
  for (const auto& param : {"api-key", "api-url"}) {
    if (params.at(param).empty()) {
      throw std::runtime_error(fmt::format(
          "required configuration parameter \"{}\" is missing", param));
    }
  }

  return false;
}

void parse_options(const std::unordered_map<std::string, std::string>& incoming,
                   ClientOptions& existing) {
  std::unordered_map<std::string, std::function<void(const std::string&)>>
      parsers;
  parsers.emplace("team", detail::parse_member(existing.team));
  parsers.emplace("suite", detail::parse_member(existing.suite));
  parsers.emplace("version", detail::parse_member(existing.revision));
  parsers.emplace("api-key", detail::parse_member(existing.api_key));
  parsers.emplace("api-url", detail::parse_member(existing.api_url));
  parsers.emplace("offline", detail::parse_member(existing.offline));
  parsers.emplace("single-thread",
                  detail::parse_member(existing.single_thread));

  for (const auto& kvp : incoming) {
    if (parsers.count(kvp.first)) {
      parsers.at(kvp.first)(kvp.second);
    }
  }
}

std::unordered_map<std::string, std::string> load_options(
    const std::string& path) {
  // check that specified path leads to an existing regular file on disk
  if (!touca::filesystem::is_regular_file(path)) {
    throw std::invalid_argument("configuration file is missing");
  }

  // load configuration file into memory
  const auto& content = touca::detail::load_string_file(path);

  // parse configuration file
  const auto& parsed = nlohmann::json::parse(content, nullptr, false);

  // check that configuration file has a top-level `touca` section
  if (parsed.is_discarded() || !parsed.is_object() ||
      !parsed.contains("touca") || !parsed["touca"].is_object()) {
    throw std::runtime_error("configuration file is not valid");
  }

  // parse configuration parameters from the JSON content.
  std::unordered_map<std::string, std::string> options;
  const auto& config = parsed["touca"];
  for (const auto& key : {"team", "suite", "version", "api-key", "api-url",
                          "offline", "single-thread"}) {
    if (config.contains(key) && config[key].is_string()) {
      options.emplace(key, config[key].get<std::string>());
    }
  }
  return options;
}

}  // namespace touca
