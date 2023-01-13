// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

/**
 * @file runner.hpp
 *
 * Touca SDK has a high-level API that makes it easy to write tests and
 * to run them using our built-in test runner.
 *
 * The test runner abstracts away many of the common features expected of a
 * test tool, such as parsing and processing configuration options, logging,
 * error handling, managing test results on the filesystem and submitting
 * them to the Touca server. An example implementation invokes `touca::run()`
 * after registering one or more test workflows via `touca::workflow()`.
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
 * Serves as the main entrypoint to the built-in test runner.
 *
 * Runs your test workflows one by one, with the appropriate configuration
 * options, and to handle all captured test results by submitting them to the
 * Touca server or writing them into the local filesystem.
 *
 * This function works similar to the application's `main()` function and is
 * expected to be called within the `main()` function. This design gives you
 * the possibility to perform custom actions before and after invoking the test
 * runner.
 *
 * @param argc number of arguments provided to the application
 * @param argv list of arguments provided to the application
 * @return exit status that could be returned by the test application's
 *         `main()` function
 * @see `touca::workflow()` that should be called at least once prior to calling
 *      this function.
 */
TOUCA_CLIENT_API int run(int argc, char* argv[]);

/**
 * Registers a test workflow to be run with one or more test cases by the Touca
 * test runner.
 *
 * While we make no assumption about the input to your code under test, the
 * input parameter to function `workflow_callback` is always the identifier
 * for your test case with type `const std::string&`. It is up to the test
 * workflow to perform the mapping from the identifier to the actual test input.
 *
 * @param name name of this test workflow to be used as the test suite slug
 * @param workflow_callback function that calls your code under test once for
 *                          each test case.
 * @param options_callback optional function that helps you set certain
 *                         configuration options for this particular workflow.
 * @see `touca::WorkflowOptions` for a list of supported options.
 */
TOUCA_CLIENT_API void workflow(
    const std::string& name,
    const std::function<void(const std::string&)> workflow_callback,
    const std::function<void(WorkflowOptions&)> options_callback = nullptr);

/**
 * High-level function that lets you customize the behavior of the built-in
 * test runner at runtime, before running the test workflows.
 *
 * Calling this function is optional. In most cases, it is easier to configure
 * the test runner via command-line arguments, environment variables, or by
 * using a configuration profile.
 *
 * Any customization using this function will be applied *before* performing
 * other methods of configuration (such as parsing command-line arguments).
 *
 * @code
 *  int main(int argc, char* argv[]) {
 *    touca::configure_workflow([](touca::RunnerOptions& x) {
 *      x.save_binary = true;
 *    });
 *    touca::workflow("is_prime", [](const std::string& testcase) {
 *      const auto number = std::stoul(testcase);
 *      touca::check("output", is_prime(number));
 *    });
 *    return touca::run(argc, argv);
 *  }
 * @endcode
 *
 * @param runner_options_workflow function that helps you customize
 *                                the test runner behavior.
 * @see `touca::RunnerOptions` for a list of supported options.
 */
TOUCA_CLIENT_API void configure_runner(
    const std::function<void(RunnerOptions&)> runner_options_callback);

/**
 * @brief Allows extraction of log events produced by the test runner
 */
struct TOUCA_CLIENT_API Sink {
  /**
   * @brief Levels of detail of published log events.
   */
  enum class Level : uint8_t { Debug, Info, Warn, Error };

  /**
   * @brief Called by the test runner when a log event is published.
   *
   * @param level minimum level of detail to subscribe to
   * @param event log message published by the runner
   */
  virtual void log(const Level level, const std::string& event) = 0;

  virtual ~Sink() = default;
};

/**
 * @brief Registers a sink to subscribe to the test runner log events.
 *
 * @param sink sink instance to be called when a log event is published
 * @param level minimum level of detail to subscribe to
 */
TOUCA_CLIENT_API void add_sink(std::unique_ptr<Sink> sink,
                               const Sink::Level level = Sink::Level::Info);

}  // namespace touca
