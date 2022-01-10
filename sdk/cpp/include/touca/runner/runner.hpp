// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

/**
 * @file runner.hpp
 *
 * @brief Entry-point to the built-in test framework.
 *
 * @details Test framework designed to abstract away many of the common features
 * expected of a regression test tool, such as parsing of command line arguments
 * and configuration files, logging, error handling, managing test results on
 * filesystem and submitting them to the Touca server. An example implementation
 * invokes `touca::run` after registering one or more workflows.
 *
 * @code
 *  int main(int argc, char* argv[]) {
 *    touca::workflow("is_prime", [](const std::string& testcase) {
 *      const auto number = std::stoul(testcase);
 *      touca::check("output", is_prime(number));
 *    });
 *    return touca::run(argc, argv);
 *  }
 * @endcode
 */

#include <functional>
#include <memory>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

#include "touca/client/detail/client.hpp"
#include "touca/lib_api.hpp"

namespace touca {

/**
 * Test framework configuration options
 */
struct FrameworkOptions : public ClientOptions {
  std::map<std::string, std::string> extra;
  std::string testcase_file;
  std::string config_file;
  std::string output_dir = "./results";
  std::string log_level = "info";
  bool has_help = false;
  bool has_version = false;
  bool colored_output = true;
  bool save_binary = true;
  bool save_json = false;
  bool skip_logs = false;
  bool redirect = true;
  bool overwrite = false;
};

TOUCA_CLIENT_API std::vector<std::string> get_testsuite_remote(
    const FrameworkOptions& options);

TOUCA_CLIENT_API std::vector<std::string> get_testsuite_local(
    const touca::filesystem::path& path);

/**
 * @brief Allows extraction of log events produced by the test framework
 */
struct TOUCA_CLIENT_API Sink {
  /**
   * @brief Levels of detail of published log events.
   */
  enum class Level : uint8_t { Debug, Info, Warn, Error };

  /**
   * @brief Called by the test framework when a log event is published.
   *
   * @param level minimum level of detail to subscribe to
   * @param event log message published by the framework
   */
  virtual void log(const Level level, const std::string& event) = 0;

  virtual ~Sink() = default;
};

TOUCA_CLIENT_API void configure(
    const std::function<void(FrameworkOptions&)> func);

TOUCA_CLIENT_API void workflow(
    const std::string& name,
    const std::function<void(const std::string&)> workflow);

TOUCA_CLIENT_API int run(int argc, char* argv[]);

/**
 * @brief Registers a sink to subscribe to the test framework log events.
 *
 * @param sink sink instance to be called when a log event is published
 * @param level minimum level of detail to subscribe to
 */
TOUCA_CLIENT_API void add_sink(std::unique_ptr<Sink> sink,
                               const Sink::Level level = Sink::Level::Info);

void TOUCA_CLIENT_API reset_test_runner();

}  // namespace touca
