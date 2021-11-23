// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <thread>
#include <unordered_map>

#include "touca/core/filesystem.hpp"
#include "touca/core/testcase.hpp"
#include "touca/devkit/platform.hpp"
#include "touca/extra/logger.hpp"

namespace touca {

using path = std::string;

/**
 * @enum DataFormat
 * @brief describes supported formats for storing testresults to disk
 */
enum class DataFormat : unsigned char {
  FBS, /**< flatbuffers */
  JSON /**< json */
};

enum class ConcurrencyMode : unsigned char { PerThread, AllThreads };

struct ClientOptions {
  std::string api_key;   /**< API Key to authenticate to the Touca server */
  std::string api_url;   /**< URL to Touca server API */
  std::string team;      /**< version of code under test */
  std::string suite;     /**< Suite to which results should be submitted */
  std::string revision;  /**< Team to which this suite belongs */
  bool handshake = true; /**< whether client should perform handshake with the
                            server during configuration */
  ConcurrencyMode case_declaration =
      ConcurrencyMode::AllThreads; /**< whether testcase declaration should be
                                      isolated to each thread */

  /* The following member variables are internal and purposely not documented.
   */

  std::string api_token; /**< API Token issued upon authentication. */
  std::string api_root;  /**< API URL in short format. */
  std::string parse_error;
};

/**
 * We are exposing this class for convenient unit-testing.
 */
class TOUCA_CLIENT_API ClientImpl {
 public:
  using OptionsMap = std::unordered_map<std::string, std::string>;

  bool configure(const ClientImpl::OptionsMap& opts = {});

  bool configure_by_file(const touca::filesystem::path& path);

  inline bool is_configured() const { return _configured; }

  inline std::string configuration_error() const { return _opts.parse_error; }

  inline const ClientOptions& options() const { return _opts; }

  void add_logger(std::shared_ptr<touca::logger> logger);

  std::vector<std::string> get_testcases() const;

  std::shared_ptr<Testcase> declare_testcase(const std::string& name);

  void forget_testcase(const std::string& name);

  void check(const std::string& key, const std::shared_ptr<IType>& value);

  void assume(const std::string& key, const std::shared_ptr<IType>& value);

  void add_array_element(const std::string& key,
                         const std::shared_ptr<IType>& value);

  void add_hit_count(const std::string& key);

  void add_metric(const std::string& key, const unsigned duration);

  void start_timer(const std::string& key);

  void stop_timer(const std::string& key);

  void save(const touca::filesystem::path& path,
            const std::vector<std::string>& testcases, const DataFormat format,
            const bool overwrite) const;

  bool post() const;

  bool seal() const;

 private:
  std::string getLastTestcase() const;

  bool hasLastTestcase() const;

  std::vector<Testcase> find_testcases(
      const std::vector<std::string>& names) const;

  void save_json(const touca::filesystem::path& path,
                 const std::vector<Testcase>& testcases) const;

  void save_flatbuffers(const touca::filesystem::path& path,
                        const std::vector<Testcase>& testcases) const;

  bool post_flatbuffers(const std::vector<Testcase>& testcases) const;

  void notify_loggers(const touca::logger::Level severity,
                      const std::string& msg) const;

  bool is_platform_ready() const;

  bool _configured = false;
  ClientOptions _opts;
  ElementsMap _testcases;
  std::string _mostRecentTestcase;
  std::vector<std::string> _elements;
  std::unique_ptr<Platform> _platform;
  std::unordered_map<std::thread::id, std::string> _threadMap;
  std::vector<std::shared_ptr<touca::logger>> _loggers;
};

}  // namespace touca
