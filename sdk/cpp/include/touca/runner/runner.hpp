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
 * @brief Configures the client based on a given set of configuration options
 *
 * @param options object holding configuration options
 */
void configure(const ClientOptions& options);

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
  enum class Level : uint8_t { Debug, Info, Warning, Error };

  /**
   * @brief Called by the test framework when a log event is published.
   *
   * @param level minimum level of detail to subscribe to
   * @param event log message published by the framework
   */
  virtual void log(const Level level, const std::string& event) = 0;

  virtual ~Sink() = default;
};

/**
 * @brief Provides the set of testcases to be used in this regression
 *        test tool.
 *
 * @details Serves as a container for the set of testcases to be given,
 *          one by one, to the workflow under test. Test authors are
 *          expected to create an instance of a class derived from `Suite`
 *          to be returned from `Workflow::suite`.
 *
 * @see Workflow
 *
 * @since v1.2.0
 */
class TOUCA_CLIENT_API Suite {
 public:
  /**
   * @brief Populates the set of testcases stored in this object.
   *
   * @details To be implemented by the test authors if they choose to
   *          create their own Suite. The implementation should use
   *          `Suite::push` to store testcases without the risk of
   *          duplication.
   *          It is okay if this function throws an exception. Touca
   *          Test Framework is supposed to handle any thrown exception.
   *
   * @throws std::runtime_error if we failed to populate list of test
   *         cases.
   */
  virtual void initialize(){};

  /**
   * @details This function enables easy iteration, by the Touca Test
   *          Framework, over the set of testcases in this suite.
   *
   * @return an iterator to the first testcase in this testsuite.
   */
  inline std::vector<std::string>::const_iterator begin() const {
    return _vec.begin();
  }

  /**
   * @details This testcase acts as a placeholder; attempting to access
   *          it results in undefined behavior.
   *
   * @return an iterator to the testcase following the last testcase
   *         in this testsuite.
   */
  inline std::vector<std::string>::const_iterator end() const {
    return _vec.end();
  }

  /**
   * @return the number of testcases in this suite.
   */
  inline std::size_t size() const { return _vec.size(); }

 protected:
  /**
   * @brief Adds a given testcase `testcase` to this suite.
   *
   * @details Testcases are meant to be mutually exclusive and to produce
   *          a consistent behavior by the workflow under test. As such,
   *          this function ignores processing testcases that are already
   *          in the suite.
   *
   * @param testcase testcase to be added to the suite.
   */
  void push(const std::string& testcase);

 private:
  std::unordered_set<std::string> _set;
  std::vector<std::string> _vec;
};

/**
 * @brief Formulates how a regression test tool using this Test Framework
 *        should operate.
 *
 * @details An abstract class to be implemented by the test authors.
 *          Designed to provide maximum flexibility that allows engineers
 *          to tailor the regression test for their workflow under test
 *          and its requirements.
 *
 * @see Suite to learn how to declare and define testcases to run against
 *      the workflow under test.
 *
 * @since v1.2.0
 */
class TOUCA_CLIENT_API Workflow {
 public:
  /**
   * @brief Describes extra command line arguments supported by this
   *        test tool.
   *
   * @details Shown to the users of the Regression Test Tool if they
   *          invoke the test application with argument `--help`.
   *
   *          Implementing this function is *optional*.
   */
  virtual std::string describe_options() const { return ""; };

  /**
   * @brief Makes Touca configuration options available for use in
   *        `Workflow::execute` and `Workflow::skip` functions.
   *
   * @details For internal use, only.
   *
   *          This function is already implemented.
   *
   * @param options framework configuration options.
   */
  void set_options(const FrameworkOptions& options);

  /**
   * @brief Enables parsing of additional command line arguments.
   *
   * @details Allows test authors to parse additional configuration
   *          options, specified as command line arguments, that they
   *          may want to use either in the implementation of other
   *          functions of this class or in the workflow under test.
   *
   *          Implementing this function is *optional*.
   *
   * @param argc number of arguments provided to your application's
   *             `main` function.
   *
   * @param argv arguments provided to your applications `main` function.
   *
   * @return false if extra configuration options could not be correctly
   *         parsed which should prompt the application to abort without
   *         running the testcases.
   */
  virtual bool parse_options(int argc, char* argv[]);

  /**
   * @brief Enables validation of extra configuration parameters.
   *
   * @details Validates workflow-specific options that are either
   *          specified in the configuration file, or parsed via
   *          `Workflow::parse_options`.
   *
   *          Implementing this function is *optional*.
   *
   * @return true if values for extra configuration options meet
   *         expectations and requirements of the test authors.
   */
  virtual bool validate_options() const { return true; }

  /**
   * @brief Registers an instance of Sink to subscribe to
   *        the log events produced by the Touca Test Framework.
   *
   * @details Useful for Test Authors who use their own loggers to
   *          capture events of the workflow under test. Implementing
   *          this function is optional. It allows relaying the log
   *          events produced by the framework to any custom logger.
   *
   *          While this function allows registration of a single
   *          derived instance of Sink, developers have control
   *          over how that derived class is implemented and may consume
   *          any log event by multiple external loggers with different
   *          filtering of levels of detail.
   *
   *          Implementing this function is *optional*.
   *
   * @see Sink for an example of how to extract log events
   *      produced by the Test Framework.
   */
  virtual std::unique_ptr<Sink> log_subscriber() const { return nullptr; }

  /**
   * @brief Enables test authors to perform any one-time initialization,
   *        that should be performed prior to running the workflow under
   *        test.
   *
   * @return false if workflow-specific initializations failed for any
   *         reason that should prompt the application to abort without
   *         running the testcases.
   */
  virtual bool initialize() { return true; }

  /**
   * @brief Determines the set of testcases to be run against the
   *        workflow under test.
   *
   * @details Test authors may decide whether to implement their own
   *          custom suite by deriving from class `Suite` or to use
   *          one of the general purpose classes offered by the Test
   *          Framework.
   *
   *          Implementing this function is **required**.
   *
   * @see `touca/runner/runner.hpp` to learn about the set of
   *      ready to use subclasses of `Suite`.
   *
   * @return An instance of a `Suite` that contains the set of testcases
   *         to run the regression test with.
   */
  virtual std::shared_ptr<Suite> suite() const = 0;

  /**
   * @brief Checks if a given testcase should be skipped by the Test
   *        Framework.
   *
   * @details Called by the Touca Test Framework for each testcase
   *          prior to its execution. This function provides a mechanism
   *          for Test Authors to add custom logic to determine whether
   *          a given testcase should be excluded from the test.
   *
   *          By default, the test framework will skip a testcase if
   *          there is already a binary or a json result file for that
   *          testcase in the directory referenced by the `output-dir`
   *          configuration parameter, provided that at least one of
   *          the configuration parameters `save-as-binary` or
   *          `save-as-json` are set to true.
   *
   *          Implementing this function is *optional*.
   *
   * @param testcase unique identifier for the testcase that should be
   *                 tested for exclusion.
   *
   * @return `true` if testcase should be excluded
   *
   * @see `framework::main` for general information about the call
   *      order of different functions within this class, by the Test
   *      Framework.
   */
  virtual bool skip(const std::string& testcase) const;

  /**
   * @brief Runs the workflow under test for the input associated with
   *        a given testcase.
   *
   * @details Intended to invoke the workflow under test with the given
   *          testcase. The framework captures any exception thrown by
   *          this function and will consider the testcase causing the
   *          exception as failed. The framework also captures any
   *          content printed to standard output or standard error
   *          streams and redirects them to separate files generated in
   *          the results directory of the testcase.
   *          The framework measures and reports the runtime of this
   *          function for each given testcase.
   *
   *          Implementing this function is **required**.
   *
   * @param testcase unique identifier for the testcase that should be
   *                 tested for exclusion.
   *
   * @return `true` if workflow under test processed the given testcase
   *         as expected.
   *
   * @see `framework::main` for general information about the call
   *      order of different functions within this class, by the Test
   *      Framework.
   */
  virtual std::vector<std::string> execute(
      const std::string& testcase) const = 0;

 protected:
  FrameworkOptions _options;
};

TOUCA_CLIENT_API int main(int argc, char* argv[], Workflow& workflow);

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

}  // namespace touca
