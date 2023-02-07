// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/touca.hpp"

#include "touca/client/detail/client.hpp"

namespace touca {

static ClientImpl instance;

void configure(const std::function<void(ClientOptions&)> options) {
  instance.configure(options);
}

bool is_configured() { return instance.is_configured(); }

std::string configuration_error() { return instance.configuration_error(); }

void add_logger(const std::shared_ptr<logger> logger) {
  instance.add_logger(logger);
}

void declare_testcase(const std::string& name) {
  instance.declare_testcase(name);
}

void forget_testcase(const std::string& name) {
  instance.forget_testcase(name);
}

namespace detail {

void check(const std::string& key, const data_point& value) {
  instance.check(key, value);
}

void assume(const std::string& key, const data_point& value) {
  instance.assume(key, value);
}

void add_array_element(const std::string& key, const data_point& value) {
  instance.add_array_element(key, value);
}

}  // namespace detail

void add_hit_count(const std::string& key) { instance.add_hit_count(key); }

void add_metric(const std::string& key, const unsigned duration) {
  instance.add_metric(key, duration);
}

void start_timer(const std::string& key) { instance.start_timer(key); }

void stop_timer(const std::string& key) { instance.stop_timer(key); }

void save_binary(const std::string& path,
                 const std::vector<std::string>& testcases,
                 const bool overwrite) {
  return instance.save(path, testcases, DataFormat::FBS, overwrite);
}

void save_json(const std::string& path,
               const std::vector<std::string>& testcases,
               const bool overwrite) {
  return instance.save(path, testcases, DataFormat::JSON, overwrite);
}

bool post() { return instance.post(); }

std::string seal() { return instance.seal(); }

scoped_timer::scoped_timer(const std::string& name) : _name(name) {
  instance.start_timer(_name);
}

scoped_timer::~scoped_timer() { instance.stop_timer(_name); }

namespace detail {
/** see ClientImpl::set_client_options */
void set_client_options(const ClientOptions& options) {
  instance.set_client_options(options);
}
/** see ClientImpl::get_client_transport */
const std::unique_ptr<Transport>& get_client_transport() {
  return instance.get_client_transport();
}
}  // namespace detail
}  // namespace touca
