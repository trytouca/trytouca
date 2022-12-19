// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/touca.hpp"

#include "touca/client/detail/client.hpp"
#include "touca/core/utils.hpp"

namespace touca {

static ClientImpl instance;

void configure(const ClientImpl::OptionsMap& opts) { instance.configure(opts); }

void configure(const ClientOptions& options) { instance.configure(options); }

void configure(const std::string& path) { instance.configure_by_file(path); }

bool is_configured() { return instance.is_configured(); }

std::string configuration_error() { return instance.configuration_error(); }

void add_logger(const std::shared_ptr<logger> logger) {
  instance.add_logger(logger);
}

std::vector<std::string> get_testcases() { return instance.get_testcases(); }

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

bool seal() { return instance.seal(); }

scoped_timer::scoped_timer(const std::string& name) : _name(name) {
  instance.start_timer(_name);
}

scoped_timer::~scoped_timer() { instance.stop_timer(_name); }

}  // namespace touca
