// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/client/detail/client.hpp"

#include <fstream>
#include <sstream>

#include "rapidjson/document.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#include "touca/client/detail/options.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/core/transport.hpp"
#include "touca/impl/schema.hpp"

/** maximum number of attempts to re-submit failed http requests */
constexpr unsigned post_max_retries = 2U;

/** maximum number of cases to be posted in a single http request */
constexpr unsigned post_max_cases = 10U;

namespace touca {

bool ClientImpl::configure(const std::function<void(ClientOptions&)> options) {
  _config_error.clear();
  if (options) {
    options(_options);
  }
  try {
    touca::detail::update_core_options(_options, _transport);
  } catch (const std::exception& ex) {
    _config_error = ex.what();
    _configured = false;
    return false;
  }
  _configured = true;
  return true;
}

void ClientImpl::add_logger(std::shared_ptr<logger> logger) {
  _loggers.push_back(logger);
}

std::shared_ptr<touca::Testcase> ClientImpl::declare_testcase(
    const std::string& name) {
  if (!_configured) {
    return nullptr;
  }
  if (!_testcases.count(name)) {
    const auto& tc = std::make_shared<Testcase>(_options.team, _options.suite,
                                                _options.version, name);
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
    throw touca::detail::runtime_error(err);
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
    throw touca::detail::runtime_error("file already exists");
  }

  auto tcs = testcases;
  if (tcs.empty()) {
    std::transform(
        _testcases.begin(), _testcases.end(), std::back_inserter(tcs),
        [](const ElementsMap::value_type& kvp) { return kvp.first; });
  }

  if (format == DataFormat::JSON) {
    save_json(path, find_testcases(tcs));
  } else {
    save_flatbuffers(path, find_testcases(tcs));
  }
}

bool ClientImpl::post() const {
  // check that client is configured to submit test results
  if (!_configured || _options.offline) {
    throw touca::detail::runtime_error(
        "client is not configured to contact server");
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

void ClientImpl::seal() const {
  if (!_configured || _options.offline) {
    throw touca::detail::runtime_error(
        "client is not configured to contact the server");
  }
  const auto& response = _transport->post(
      touca::detail::format("/client/seal/{}/{}/{}", _options.team,
                            _options.suite, _options.version));
  if (response.status == -1) {
    throw touca::detail::runtime_error(
        touca::detail::format("failed to reach the server: {}", response.body));
  }
  if (response.status == 403) {
    throw touca::detail::runtime_error("client is not authenticated");
  }
  if (response.status != 204) {
    throw touca::detail::runtime_error(
        touca::detail::format("failed to seal version: {}", response.status));
  }
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

  if (_options.concurrency) {
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
    throw touca::detail::runtime_error("testcase not declared");
  }

  // If client is configured, check whether testcase declaration is set as
  // "shared" in which case report the name of the most recently declared
  // testcase.

  if (_options.concurrency) {
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
  rapidjson::Document doc(rapidjson::kArrayType);
  rapidjson::Document::AllocatorType& allocator = doc.GetAllocator();

  for (const auto& testcase : testcases) {
    doc.PushBack(testcase.json(allocator), allocator);
  }

  rapidjson::StringBuffer strbuf;
  rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
  writer.SetMaxDecimalPlaces(3);
  doc.Accept(writer);

  touca::detail::save_text_file(path.string(), strbuf.GetString());
}

void ClientImpl::save_flatbuffers(
    const touca::filesystem::path& path,
    const std::vector<Testcase>& testcases) const {
  touca::detail::save_binary_file(path.string(),
                                  Testcase::serialize(testcases));
}

bool ClientImpl::post_flatbuffers(
    const std::vector<Testcase>& testcases) const {
  const auto& buffer = Testcase::serialize(testcases);
  std::string content((const char*)buffer.data(), buffer.size());
  std::vector<std::string> errors;
  for (auto i = 0UL; i < post_max_retries; ++i) {
    const auto response = _transport->binary("/client/submit", content);
    if (response.status == 403) {
      throw touca::detail::runtime_error("client is not authenticated");
    }
    if (response.status == 204) {
      break;
    }
    errors.emplace_back(touca::detail::format(
        "failed to post test results for a group of testcases ({}/{})", i + 1,
        post_max_retries));
    if (i == post_max_retries) {
      errors.emplace_back("giving up on submitting test results");
    }
  }
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

// see backlog task T-523 for more info
void ClientImpl::set_client_options(const ClientOptions& options) {
  _options = options;
  _configured = true;
}

// see backlog task T-523 for more info
const std::unique_ptr<Transport>& ClientImpl::get_client_transport() const {
  return _transport;
}

}  // namespace touca
