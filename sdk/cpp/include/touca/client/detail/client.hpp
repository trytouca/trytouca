// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <thread>
#include <unordered_map>

#include "touca/client/detail/options.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/core/testcase.hpp"
#include "touca/core/transport.hpp"
#include "touca/extra/logger.hpp"

namespace touca {

using path = std::string;

/**
 * @enum DataFormat
 * @brief describes supported formats for storing test results to disk
 */
enum class DataFormat : unsigned char {
  FBS, /**< flatbuffers */
  JSON /**< json */
};

/**
 * We are exposing this class for convenient unit-testing.
 */
class TOUCA_CLIENT_API ClientImpl {
 public:
  bool configure(const std::function<void(ClientOptions&)> options = nullptr);

  inline bool is_configured() const { return _configured; }

  inline std::string configuration_error() const { return _config_error; }

  inline const ClientOptions& options() const { return _options; }

  void add_logger(std::shared_ptr<touca::logger> logger);

  std::shared_ptr<Testcase> declare_testcase(const std::string& name);

  void forget_testcase(const std::string& name);

  void check(const std::string& key, const data_point& value);

  void assume(const std::string& key, const data_point& value);

  void add_array_element(const std::string& key, const data_point& value);

  void add_hit_count(const std::string& key);

  void add_metric(const std::string& key, const unsigned duration);

  void start_timer(const std::string& key);

  void stop_timer(const std::string& key);

  void save(const touca::filesystem::path& path,
            const std::vector<std::string>& testcases, const DataFormat format,
            const bool overwrite) const;

  bool post() const;

  bool seal() const;

  // tech debt

  void set_client_options(const ClientOptions& options);
  const std::unique_ptr<Transport>& get_client_transport() const;

 private:
  std::string get_last_testcase() const;

  bool has_last_testcase() const;

  std::vector<Testcase> find_testcases(
      const std::vector<std::string>& names) const;

  void save_json(const touca::filesystem::path& path,
                 const std::vector<Testcase>& testcases) const;

  void save_flatbuffers(const touca::filesystem::path& path,
                        const std::vector<Testcase>& testcases) const;

  bool post_flatbuffers(const std::vector<Testcase>& testcases) const;

  void notify_loggers(const touca::logger::Level severity,
                      const std::string& msg) const;

  bool _configured = false;
  std::string _config_error;
  ClientOptions _options;
  ElementsMap _testcases;
  std::string _mostRecentTestcase;
  std::unique_ptr<Transport> _transport =
      detail::make_unique<DefaultTransport>();
  std::unordered_map<std::thread::id, std::string> _threadMap;
  std::vector<std::shared_ptr<touca::logger>> _loggers;
};

}  // namespace touca
