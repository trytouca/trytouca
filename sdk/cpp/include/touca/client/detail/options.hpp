// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <functional>
#include <string>
#include <vector>

#include "touca/core/filesystem.hpp"
#include "touca/core/transport.hpp"

namespace touca {

/**
 * Configuration options supported by the low-level Core API library.
 *
 * Use the `touca::configure` function for setting these options
 * programmatically. When using the test runner, you can set any subset of these
 * options without hard-coding the values using a variety of methods such as
 * command-line arguments, environment variables, JSON-formatted configuration
 * file, Touca CLI configuration profiles, etc. See `touca::RunnerOptions` to
 * learn more.
 */
struct ClientOptions {
  /**
   * API Key issued by the Touca server that identifies who is submitting the
   * test results.
   *
   * Since the value should be treated as a secret, we strongly recommend
   * that you do not hard-code this option and pass it via other methods such
   * as setting the environment variable `TOUCA_API_KEY` (ideal for the CI
   * environment) or using the Touca CLI to set this option in your
   * configuration profile to be automatically loaded at runtime (ideal for
   * local development).
   **/
  std::string api_key;

  /**
   * URL to Touca server API
   *
   * Defaults to `https://api.touca.io` when `api_key` is specified. If you are
   * self-hosting the Touca server, we encourage using the Touca CLI to set this
   * option in your configuration profile to be automatically loaded at runtime.
   **/
  std::string api_url;

  /**
   * Slug of your team on the Touca server
   *
   * Since it is unlikely for your team slug to change, we encourage using the
   * Touca CLI to set this option in your configuration profile to be
   * automatically loaded at runtime.
   **/
  std::string team;

  /**
   * Name of the test suite to submit test results to
   *
   * When using the test runner, value of the first parameter to
   * `touca::workflow` is used by default.
   */
  std::string suite;

  /**
   * Version of your code under test
   *
   * Since this version is expected to change, we encourage setting option via
   * the environment variable `TOUCA_TEST_VERSION` or passing it as a
   * command-line option.
   *
   * When using the test runner, you may also skip setting this option to let
   * the test runner query the Touca server for the most recent version of your
   * suite and use a minor version increment.
   */
  std::string version;

  /**
   * Disables all communications with the Touca server
   *
   * Determines whether client should connect with the Touca server during
   * the configuration. Will be set to `false` when neither `api_url` nor
   * `api_key` are set.
   */
  bool offline = false;

  /**
   * Isolates the testcase scope to calling thread
   *
   * Determines whether the scope of test case declaration is bound to
   * the thread performing the declaration, or covers all other threads.
   * Defaults to `true`.
   *
   * If set to `true`, when a thread calls `touca::declare_testcase`, all
   * other threads also have their most recent test case changed to the
   * newly declared test case and any subsequent call to data capturing
   * functions such as `touca::check` will affect the newly declared test case.
   */
  bool concurrency = true;
};

#ifdef TOUCA_INCLUDE_RUNNER

struct WorkflowOptions {
  std::string suite;
  std::string version;
  std::vector<std::string> testcases;
};

struct Workflow : public WorkflowOptions {
  std::function<void(const std::string&)> callback;
};

struct RunnerOptions : public ClientOptions {
  bool overwrite_results = false;
  bool save_binary = true;
  bool save_json = false;
  bool colored_output = true;
  bool redirect_output = true;
  bool skip_logs = false;
  std::string config_file;
  std::string output_directory;
  std::string log_level = "info";
  std::string workflow_filter;
  std::vector<Workflow> workflows;
  std::vector<std::string> testcases;
};

#endif

namespace detail {

/** Used in the implementation of `ClientImpl::configure`. */
void update_core_options(ClientOptions& options,
                         const std::unique_ptr<Transport>& transport);

#ifdef TOUCA_INCLUDE_RUNNER

/** Used in the implementation of `touca::run`. */
void update_runner_options(int argc, char* argv[], RunnerOptions& options);

/**
 * Lets the Touca test runner update configuration options of the
 * `ClientImpl` instance of `touca.cpp` without calling `touca.configure`.
 * Workaround (see backlog task T-523 for more info)
 **/
void set_client_options(const ClientOptions& options);

/**
 * Lets the Touca test runner to reuse the transport member variable of the
 * `ClientImpl` instance of `touca.cpp` for authentication and for fetching the
 * remote options. Workaround (see backlog task T-523 for more info)
 **/
const std::unique_ptr<Transport>& get_client_transport();
#endif

}  // namespace detail
}  // namespace touca
