// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/client/detail/client.hpp"

#include <fstream>
#include <sstream>

#include "nlohmann/json.hpp"
#include "touca/client/detail/options.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/devkit/platform.hpp"
#include "touca/devkit/utils.hpp"
#include "touca/impl/schema.hpp"

/** maximum number of attempts to re-submit failed http requests */
constexpr unsigned post_max_retries = 2;

/** maximum number of cases to be posted in a single http request */
constexpr unsigned post_max_cases = 10;

namespace touca {

bool ClientImpl::configure(const ClientImpl::OptionsMap& opts) {
  _config_error.clear();
  parse_options(opts, _options);
  return apply_options();
}

bool ClientImpl::configure(const ClientOptions& options) {
  _config_error.clear();
  _options = options;
  return apply_options();
}

bool ClientImpl::apply_options() {
  try {
    if (reformat_options(_options)) {
      _configured = true;
      return true;
    }
  } catch (const std::exception& ex) {
    _config_error = ex.what();
    _configured = false;
    return false;
  }

  // perform authentication to server using the provided
  // API key and obtain API token for posting results.
  ApiUrl api_url(_options.api_url);
  _platform = std::unique_ptr<Platform>(new Platform(api_url));
  if (!_platform->auth(_options.api_key)) {
    _config_error = _platform->get_error();
    return false;
  }

  // retrieve list of known test cases for this suite
  if (_options.testcases.empty()) {
    _options.testcases = _platform->elements();
    if (_options.testcases.empty()) {
      _config_error = _platform->get_error();
      return false;
    }
  }

  _configured = true;
  return true;
}

bool ClientImpl::configure_by_file(const touca::filesystem::path& path) {
  try {
    return configure(load_options(path.string()));
  } catch (const std::exception& ex) {
    _config_error = ex.what();
    _configured = false;
    return false;
  }
}

void ClientImpl::add_logger(std::shared_ptr<logger> logger) {
  _loggers.push_back(logger);
}

std::vector<std::string> ClientImpl::get_testcases() const {
  return _options.testcases;
}

std::shared_ptr<touca::Testcase> ClientImpl::declare_testcase(
    const std::string& name) {
  if (!_configured) {
    return nullptr;
  }
  if (!_testcases.count(name)) {
    const auto& tc = std::make_shared<Testcase>(_options.team, _options.suite,
                                                _options.revision, name);
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

void ClientImpl::check(const std::string& key, const data_point& value) {
  if (has_last_testcase()) {
    _testcases.at(get_last_testcase())->check(key, value);
  }
}

void ClientImpl::assume(const std::string& key, const data_point& value) {
  if (has_last_testcase()) {
    _testcases.at(get_last_testcase())->assume(key, value);
  }
}

void ClientImpl::add_array_element(const std::string& key,
                                   const data_point& value) {
  if (has_last_testcase()) {
    _testcases.at(get_last_testcase())->add_array_element(key, value);
  }
}

void ClientImpl::add_hit_count(const std::string& key) {
  if (has_last_testcase()) {
    _testcases.at(get_last_testcase())->add_hit_count(key);
  }
}

void ClientImpl::add_metric(const std::string& key, const unsigned duration) {
  if (has_last_testcase()) {
    _testcases.at(get_last_testcase())->add_metric(key, duration);
  }
}

void ClientImpl::start_timer(const std::string& key) {
  if (has_last_testcase()) {
    _testcases.at(get_last_testcase())->tic(key);
  }
}

void ClientImpl::stop_timer(const std::string& key) {
  if (has_last_testcase()) {
    _testcases.at(get_last_testcase())->toc(key);
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
  };
  if (!_platform->set_params(_options.team, _options.suite,
                             _options.revision) ||
      !_platform->seal()) {
    notify_loggers(logger::Level::Warning, _platform->get_error());
    return false;
  }
  return true;
}

bool ClientImpl::has_last_testcase() const {
  // if client is not configured, report that no testcase has been
  // declared. this behavior renders calls to other data capturing
  // functions as no-op which is helpful in production environments
  // where `configure` is expected to never be called.

  if (!_configured) {
    return false;
  }

  // If client is configured, check whether testcase declaration is set as
  // "shared" in which case report the most recently declared testcase.

  if (!_options.single_thread) {
    return !_mostRecentTestcase.empty();
  }

  // If testcase declaration is "thread-specific", check if this thread
  // has declared any testcase before.

  return _threadMap.count(std::this_thread::get_id());
}

std::string ClientImpl::get_last_testcase() const {
  // We do not expect this function to be called without calling
  // `has_last_testcase` first.

  if (!has_last_testcase()) {
    throw std::logic_error("testcase not declared");
  }

  // If client is configured, check whether testcase declaration is set as
  // "shared" in which case report the name of the most recently declared
  // testcase.

  if (!_options.single_thread) {
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
