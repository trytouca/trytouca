// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/client/detail/client.hpp"

#include <fstream>
#include <sstream>

#include "nlohmann/json.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/devkit/platform.hpp"
#include "touca/devkit/utils.hpp"
#include "touca/impl/schema.hpp"

/** maximum number of attempts to re-submit failed http requests */
constexpr unsigned long post_max_retries = 2;

/** maximum number of cases to be posted in a single http request */
constexpr unsigned long post_max_cases = 10;

namespace touca {

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

bool ClientImpl::configure(const ClientImpl::OptionsMap& opts) {
  _opts.parse_error.clear();

  std::unordered_map<std::string, std::function<void(const std::string&)>>
      parsers;
  parsers.emplace("team", parse_member(_opts.team));
  parsers.emplace("suite", parse_member(_opts.suite));
  parsers.emplace("version", parse_member(_opts.revision));
  parsers.emplace("api-key", parse_member(_opts.api_key));
  parsers.emplace("api-url", parse_member(_opts.api_url));
  parsers.emplace("offline", parse_member(_opts.offline));
  parsers.emplace("single-thread", parse_member(_opts.single_thread));

  for (const auto& kvp : opts) {
    if (!parsers.count(kvp.first)) {
      _opts.parse_error =
          touca::detail::format("unknown parameter \"{}\"", kvp.first);
      return false;
    }
    parsers.at(kvp.first)(kvp.second);
  }
  return configure_impl();
}

bool ClientImpl::configure(const ClientOptions& options) {
  _opts.parse_error.clear();
  _opts = options;
  return configure_impl();
}

bool ClientImpl::configure_impl() {
  // apply environment variables. the implementation below ensures
  // that the environment variables take precedence over the specified
  // configuration parameters.

  const std::unordered_map<std::string, std::string&> env_table = {
      {"TOUCA_API_KEY", _opts.api_key},
      {"TOUCA_API_URL", _opts.api_url},
      {"TOUCA_TEST_VERSION", _opts.revision},
  };
  for (const auto& kvp : env_table) {
    const auto env_value = std::getenv(kvp.first.c_str());
    if (env_value != nullptr) {
      kvp.second = env_value;
    }
  }

  // associate a name to each string-based configuration parameter

  const std::unordered_map<std::string, std::string&> params = {
      {"team", _opts.team},
      {"suite", _opts.suite},
      {"version", _opts.revision},
      {"api-key", _opts.api_key},
      {"api-url", _opts.api_url}};

  // if `api-url` is given in long format, parse `team`, `suite`, and
  // `version` from its path.

  ApiUrl api_url(_opts.api_url);
  if (!api_url.confirm(_opts.team, _opts.suite, _opts.revision)) {
    _opts.parse_error = api_url._error;
    return false;
  }
  _opts.team = api_url._team;
  _opts.suite = api_url._suite;
  _opts.revision = api_url._revision;

  // if required parameters are not set, maybe user is just experimenting.

  const auto is_pristine = [&params](const std::vector<std::string>& keys) {
    return std::all_of(
        keys.begin(), keys.end(),
        [&params](const std::string& key) { return params.at(key).empty(); });
  };
  if (is_pristine({"team", "suite", "version", "api-key", "api-url"})) {
    _configured = true;
    return true;
  }

  // check that the set of available configuration parameters includes
  // the bare minimum required parameters.

  for (const auto& param : {"team", "suite", "version"}) {
    if (params.at(param).empty()) {
      _opts.parse_error = fmt::format(
          "required configuration parameter \"{}\" is missing", param);
      return false;
    }
  }

  // if `api_key` and `api_url` are not provided, assume user does
  // not intend to submit results in which case we are done.

  if (_opts.offline) {
    _configured = true;
    return true;
  }

  // otherwise, check that all necessary config params are provided.

  for (const auto& param : {"api-key", "api-url"}) {
    if (params.at(param).empty()) {
      _opts.parse_error = fmt::format(
          "required configuration parameter \"{}\" is missing", param);
      return false;
    }
  }

  // perform authentication to server using the provided
  // API key and obtain API token for posting results.

  _platform = std::unique_ptr<Platform>(new Platform(api_url));
  if (!_platform->auth(_opts.api_key)) {
    _opts.parse_error = _platform->get_error();
    return false;
  }

  // retrieve list of known test cases for this suite

  _elements = _platform->elements();
  if (_elements.empty()) {
    _opts.parse_error = _platform->get_error();
    return false;
  }

  _configured = true;
  return true;
}

bool ClientImpl::configure_by_file(const touca::filesystem::path& path) {
  // check that specified path leads to an existing regular file on disk

  if (!touca::filesystem::is_regular_file(path)) {
    _opts.parse_error = "configuration file is missing";
    return false;
  }

  // load content of configuration file into memory

  std::ifstream ifs(path.string());
  std::stringstream ss;
  ss << ifs.rdbuf();

  // attempt to parse content of configuration file

  const auto& parsed = nlohmann::json::parse(ss.str(), nullptr, false);

  // check that configuration file has a top-level `touca` section

  if (!parsed.is_object() || !parsed.contains("touca") ||
      !parsed["touca"].is_object()) {
    _opts.parse_error = "configuration file is not valid";
    return false;
  }

  // populate an OptionsMap with the value of configuration parameters
  // specified in the JSON file.

  OptionsMap opts;

  // parse configuration parameters whose value may be specified as string

  const auto& strKeys = {"api-key", "api-url", "team",         "suite",
                         "version", "offline", "single-thread"};

  const auto& config = parsed["touca"];
  for (const auto& key : strKeys) {
    if (config.contains(key) && config[key].is_string()) {
      opts.emplace(key, config[key].get<std::string>());
    }
  }

  return configure(opts);
}

void ClientImpl::add_logger(std::shared_ptr<logger> logger) {
  _loggers.push_back(logger);
}

std::vector<std::string> ClientImpl::get_testcases() const { return _elements; }

std::shared_ptr<touca::Testcase> ClientImpl::declare_testcase(
    const std::string& name) {
  if (!_configured) {
    return nullptr;
  }
  if (!_testcases.count(name)) {
    const auto& tc = std::make_shared<Testcase>(_opts.team, _opts.suite,
                                                _opts.revision, name);
    _testcases.emplace(name, tc);
  }
  _threadMap[std::this_thread::get_id()] = name;
  _mostRecentTestcase = name;
  return _testcases.at(name);
}

void ClientImpl::forget_testcase(const std::string& name) {
  if (!_testcases.count(name)) {
    const auto err = touca::detail::format("key `{}` does not exist", name);
    notify_loggers(logger::Level::Warning, err);
    throw std::invalid_argument(err);
  }
  _testcases.at(name)->clear();
  _testcases.erase(name);
}

void ClientImpl::check(const std::string& key,
                       const std::shared_ptr<IType>& value) {
  if (hasLastTestcase()) {
    _testcases.at(getLastTestcase())->check(key, value);
  }
}

void ClientImpl::assume(const std::string& key,
                        const std::shared_ptr<IType>& value) {
  if (hasLastTestcase()) {
    _testcases.at(getLastTestcase())->assume(key, value);
  }
}

void ClientImpl::add_array_element(const std::string& key,
                                   const std::shared_ptr<IType>& value) {
  if (hasLastTestcase()) {
    _testcases.at(getLastTestcase())->add_array_element(key, value);
  }
}

void ClientImpl::add_hit_count(const std::string& key) {
  if (hasLastTestcase()) {
    _testcases.at(getLastTestcase())->add_hit_count(key);
  }
}

void ClientImpl::add_metric(const std::string& key, const unsigned duration) {
  if (hasLastTestcase()) {
    _testcases.at(getLastTestcase())->add_metric(key, duration);
  }
}

void ClientImpl::start_timer(const std::string& key) {
  if (hasLastTestcase()) {
    _testcases.at(getLastTestcase())->tic(key);
  }
}

void ClientImpl::stop_timer(const std::string& key) {
  if (hasLastTestcase()) {
    _testcases.at(getLastTestcase())->toc(key);
  }
}

void ClientImpl::save(const touca::filesystem::path& path,
                      const std::vector<std::string>& testcases,
                      const DataFormat format, const bool overwrite) const {
  if (touca::filesystem::exists(path) && !overwrite) {
    throw std::invalid_argument("file already exists");
  }

  auto tcs = testcases;
  if (tcs.empty()) {
    std::transform(
        _testcases.begin(), _testcases.end(), std::back_inserter(tcs),
        [](const ElementsMap::value_type& kvp) { return kvp.first; });
  }

  switch (format) {
    case DataFormat::JSON:
      save_json(path, find_testcases(tcs));
      break;
    case DataFormat::FBS:
      save_flatbuffers(path, find_testcases(tcs));
      break;
    default:
      throw std::invalid_argument("saving in given format not supported");
  }
}

bool ClientImpl::post() const {
  // check that client is configured to submit test results

  if (!_platform) {
    notify_loggers(logger::Level::Error,
                   "client is not configured to contact server");
    return false;
  }
  if (!_platform->has_token()) {
    notify_loggers(logger::Level::Error,
                   "client is not authenticated to the server");
    return false;
  }

  auto ret = true;
  // we should only post testcases that we have not posted yet
  // or those that have changed since we last posted them.
  std::vector<std::string> testcases;
  for (const auto& tc : _testcases) {
    if (!tc.second->_posted) {
      testcases.emplace_back(tc.first);
    }
  }
  // group multiple testcases together according to `_postMaxTestcases`
  // configuration parameter and post each group separately in
  // flatbuffers format.
  for (auto it = testcases.begin(); it != testcases.end();) {
    const auto& tail = it + (std::min)(static_cast<ptrdiff_t>(post_max_cases),
                                       std::distance(it, testcases.end()));
    std::vector<std::string> batch(it, tail);
    // attempt to post results for this group of testcases.
    // currently we only support posting data in flatbuffers format.
    const auto isPosted = post_flatbuffers(find_testcases(batch));
    it = tail;
    if (!isPosted) {
      notify_loggers(logger::Level::Error,
                     "failed to post test results for a group of testcases");
      ret = false;
      continue;
    }
    for (const auto& tc : batch) {
      _testcases.at(tc)->_posted = true;
    }
  }
  return ret;
}

bool ClientImpl::seal() const {
  if (!_platform) {
    notify_loggers(logger::Level::Error,
                   "client is not configured to contact server");
    return false;
  }
  if (!_platform->has_token()) {
    notify_loggers(logger::Level::Error,
                   "client is not authenticated to the server");
    return false;
  }
  if (!_platform->seal()) {
    notify_loggers(logger::Level::Warning, _platform->get_error());
    return false;
  }
  return true;
}

bool ClientImpl::hasLastTestcase() const {
  // if client is not configured, report that no testcase has been
  // declared. this behavior renders calls to other data capturing
  // functions as no-op which is helpful in production environments
  // where `configure` is expected to never be called.

  if (!_configured) {
    return false;
  }

  // If client is configured, check whether testcase declaration is set as
  // "shared" in which case report the most recently declared testcase.

  if (!_opts.single_thread) {
    return !_mostRecentTestcase.empty();
  }

  // If testcase declaration is "thread-specific", check if this thread
  // has declared any testcase before.

  return _threadMap.count(std::this_thread::get_id());
}

std::string ClientImpl::getLastTestcase() const {
  // We do not expect this function to be called without calling
  // `hasLastTestcase` first.

  if (!hasLastTestcase()) {
    throw std::logic_error("testcase not declared");
  }

  // If client is configured, check whether testcase declaration is set as
  // "shared" in which case report the name of the most recently declared
  // testcase.

  if (!_opts.single_thread) {
    return _mostRecentTestcase;
  }

  // If testcase declaration is "thread-specific", report the most recent
  // testcase declared by this thread.

  return _threadMap.at(std::this_thread::get_id());
}

std::vector<Testcase> ClientImpl::find_testcases(
    const std::vector<std::string>& names) const {
  std::vector<Testcase> testcases;
  testcases.reserve(names.size());
  for (const auto& name : names) {
    testcases.emplace_back(*_testcases.at(name));
  }
  return testcases;
}

void ClientImpl::save_json(const touca::filesystem::path& path,
                           const std::vector<Testcase>& testcases) const {
  nlohmann::ordered_json doc = nlohmann::json::array();
  for (const auto& testcase : testcases) {
    doc.push_back(testcase.json());
  }
  detail::save_string_file(path.string(), doc.dump());
}

void ClientImpl::save_flatbuffers(
    const touca::filesystem::path& path,
    const std::vector<Testcase>& testcases) const {
  detail::save_binary_file(path.string(), Testcase::serialize(testcases));
}

bool ClientImpl::post_flatbuffers(
    const std::vector<Testcase>& testcases) const {
  const auto& buffer = Testcase::serialize(testcases);
  std::string content((const char*)buffer.data(), buffer.size());
  const auto& errors = _platform->submit(content, post_max_retries);
  for (const auto& err : errors) {
    notify_loggers(logger::Level::Warning, err);
  }
  return errors.empty();
}

void ClientImpl::notify_loggers(const logger::Level severity,
                                const std::string& msg) const {
  for (const auto& logger : _loggers) {
    logger->log(severity, msg);
  }
}

}  // namespace touca
