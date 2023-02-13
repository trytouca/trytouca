// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

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

/**
 * Configuration options that can be set for individual test workflows when
 * calling the high-level API function `touca::workflow()`.
 *
 * Setting these parameters is optional. The test runner has built-in mechanism
 * to attempt to find the appropriate value for each option based on the overall
 * configuration options of the overall test.
 */
struct WorkflowOptions {
  /**
   * Name of the suite to be used that overrides the name of the workflow
   * specified as the first parameter to `touca::workflow()`.
   */
  std::string suite;

  /**
   * Version of the code under test. When this parameter is not set, and is not
   * otherwise specified when running the test, the test runner queries the
   * Touca server to find the most recent submitted version for this suite and
   * uses a minor increment of that version.
   */
  std::string version;

  /**
   * List of test cases to be given one by one to the test workflow. When this
   * parameter is not set, and is not otherwise specified when running the test,
   * the test runner fetches and reuses the list of submitted test cases for the
   * baseline version of this suite.
   */
  std::vector<std::string> testcases;
};

struct Workflow : public WorkflowOptions {
  std::function<void(const std::string&)> callback;
};

/**
 * Configuration options supported by the built-in test runner.
 */
struct RunnerOptions : public ClientOptions {
  /**
   * Store all the data points captured for each test case into a local file
   * in binary format. Touca binary archives can later be inspected using the
   * Touca CLI and submitted to a Touca server instance.
   */
  bool save_binary = false;

  /**
   * Store all the data points captured for each test case into a local file
   * in JSON format. Unlike Touca binary archives, these JSON files are only
   * helpful for manual inspection of the captured test results and are not
   * supported by the Touca server.
   */
  bool save_json = false;

  /**
   * Overwrite the locally generated test results for a given testcase if the
   * results directory already exists.
   */
  bool overwrite_results = false;

  /**
   * Use ANSI colors when reporting the test progress in the standard output.
   */
  bool colored_output = true;

  /**
   * Capture the standard output and standard error of the code under test
   * and redirect them to a local file.
   */
  bool redirect_output = true;

  /**
   * Indicates whether to generate a copy of the standard output of the test
   * into a `Console.log` file.
   */
  bool skip_logs = false;

  /**
   * Relative or full path to a configuration file to be loaded and applied
   * at runtime.
   */
  std::string config_file;

  /**
   * Relative or full path to the directory in which Touca test results
   * are written, when the runner is configured to write them into the local
   * filesystem.
   */
  std::string output_directory;

  /**
   * Level of detail to use when publishing log events to the external loggers.
   */
  std::string log_level = "info";

  /**
   * Set of testcases to feed one by one to all the registered workflows.
   * When not provided, the test runner uses the set of testcases configured
   * for each workflow. If that set is empty, the test runner attempts to
   * retrieve and reuse the set of testcases submitted for the baseline
   * version of each workflow.
   */
  std::vector<std::string> testcases;

  /**
   * Limits the test to running the specified workflow as opposed to all the
   * registered workflows.
   */
  std::string workflow_filter;

  /**
   * The set of all registered workflows.
   */
  std::vector<Workflow> workflows;

  /** Submits test results asynchronously if value is 'async'. */
  std::string submission_mode = "sync";

  /* Root URL to Touca server web interface */
  std::string web_url;
};

#endif

struct Post {
  enum class Status : unsigned char { Sent, Fail, Skip, Pass, Diff };
  struct Options {
    bool sync = true;
  };

 protected:
  Post() = default;
};

namespace detail {
/** Used in the implementation of `ClientImpl::configure`. */
void update_core_options(ClientOptions& options,
                         const std::unique_ptr<Transport>& transport);

#ifdef TOUCA_INCLUDE_RUNNER

/** Used in the implementation of `touca::run`. */
void update_runner_options(int argc, char* argv[], RunnerOptions& options);

/** see ClientImpl::set_client_options */
void set_client_options(const ClientOptions& options);

/** see ClientImpl::get_client_transport */
const std::unique_ptr<Transport>& get_client_transport();
#endif

}  // namespace detail
}  // namespace touca
