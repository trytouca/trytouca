// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

/**
 * @file framework.hpp
 *
 * @brief Entry-point to the Touca Test Framework for C++.
 *
 * @details `touca/framework.hpp` provides the functions necessary to
 *          write a Regression Test tool that can submit its results to the
 *          Touca server.
 */

#include "touca/framework/lib_api.hpp"
#include <memory>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

/**
 * @namespace touca::framework
 *
 * @brief Provides API of Touca Test Framework for C++.
 *
 * @details Helps engineers develop a regression test tool that can submit
 *          its results to the Touca server.
 */
namespace touca { namespace framework {

    /**
     * @brief An abstract representation of an input to the workflow under
     *        test that is expected to trigger a consistent behavior by that
     *        workflow.
     *
     * @details On Touca, a `framework::Testcase` can be thought of as a
     *          unique identifier for the input to the workflow and not the
     *          input itself. This distinction gives users the freedom to
     *          choose what constitutes an appropriate input for their
     *          workflow. The input may be a file or a large dataset with
     *          the same name as the `framework::Testcase`.
     *          The mapping from the `framework::Testcase` name to the input
     *          can be done at the start of the workflow execution.
     *
     * @see Workflow::execute
     * @since v1.2.0
     */
    using Testcase = std::string;

    /**
     * @brief A list of errors encountered during execution of the workflow
     *        under test with a given input.
     *
     * @details If the list of errors is empty, the workflow execution is
     *          determined to have been successful. Otherwise, the framework
     *          marks the `framework::Testcase` as failed and prints the
     *          errors, in the error that they were received, to the standard
     *          output stream and the application log files.
     *
     * @since v1.2.0
     */
    using Errors = std::vector<std::string>;

    /**
     * @brief A simple container for the configuration parameters used by
     *        the application, the Touca Test Framework and the workflow
     *        under test.
     *
     * @details For simplicity, the configuration parameters are always
     *          stored in string format. While these options are accessible
     *          from the Workflow instance, the user can choose whether to
     *          use them or not.
     *
     * @since v1.2.0
     */
    using Options = std::unordered_map<std::string, std::string>;

    /**
     * @brief Different levels of detail with which framework log events
     *        may be reported.
     *
     * @see LogSubscriber
     *
     * @since v1.2.0
     */
    enum LogLevel : unsigned char {
        Debug, /**< Captures order of framework function calls. */
        Info, /**< Captures outcome of the workflow execution for each framework::Testcase. */
        Warning, /**< Captures warnings about potentially incorrect behavior of the test application. */
        Error /**< Captures failed framework::Testcase instances and their error messages. */
    };

    /**
     * @brief Allows extraction of log events produced by the Touca Test
     *        Framework in a controlled level of detail.
     *
     * @details Registering an instance of `LogSubscriber` to subscribe to
     *          the log events of the framework is optional and can be done
     *          through overriding and implementing `Workflow::log_subscriber`.
     *
     * @see Workflow::log_subscriber
     *
     * @since v1.2.0
     */
    struct TOUCA_FRAMEWORK_API LogSubscriber {
        /**
         * @brief Function called by the Touca Test Framework every time
         *        it publishes a log event.
         *
         * @details Since Workflow allows registering only one LogSubscriber,
         *          this function will be called for all events, regardless
         *          of their level of detail. We leave it to the test author
         *          to decide whether and how to handle log events with higher
         *          levels of detail.
         *
         * @param level verbosity of the log event published by the framework
         * @param event log message published by the framework
         */
        virtual void log(const LogLevel level, const std::string& event) = 0;

        virtual ~LogSubscriber() = default;
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
    class TOUCA_FRAMEWORK_API Suite {
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
        virtual void initialize() {};

        /**
         * @details This function enables easy iteration, by the Touca Test
         *          Framework, over the set of testcases in this suite.
         *
         * @return an iterator to the first testcase in this testsuite.
         */
        inline std::vector<Testcase>::const_iterator begin() const { return _vec.begin(); }

        /**
         * @details This testcase acts as a placeholder; attempting to access
         *          it results in undefined behavior.
         *
         * @return an iterator to the testcase following the last testcase
         *         in this testsuite.
         */
        inline std::vector<Testcase>::const_iterator end() const { return _vec.end(); }

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
        void push(const Testcase& testcase);

    private:
        std::unordered_set<Testcase> _set;
        std::vector<Testcase> _vec;
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
    class TOUCA_FRAMEWORK_API Workflow {
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
         * @brief Merges configuration options `options` into the set of
         *        configuration options of the Workflow `_options`.
         *
         * @details This function is used by the Touca Test Framework to
         *          make framework's own configuration parameters accessible
         *          from `Workflow::execute` and `Workflow::skip` functions,
         *          just in case developers want to use them.
         *
         *          This function is already implemented.
         *
         * @param options configuration options to be added to `_options`.
         *
         * @see `Workflow::execute` for a full list of configuration options
         *      populated by the Touca Test Framework.
         */
        void add_options(const Options& options);

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
         * @brief Registers an instance of LogSubscriber to subscribe to
         *        the log events produced by the Touca Test Framework.
         *
         * @details Useful for Test Authors who use their own loggers to
         *          capture events of the workflow under test. Implementing
         *          this function is optional. It allows relaying the log
         *          events produced by the framework to any custom logger.
         *
         *          While this function allows registration of a single
         *          derived instance of LogSubscriber, developers have control
         *          over how that derived class is implemented and may consume
         *          any log event by multiple external loggers with different
         *          filtering of levels of detail.
         *
         *          Implementing this function is *optional*.
         *
         * @see LogSubscriber for an example of how to extract log events
         *      produced by the Test Framework.
         */
        virtual std::shared_ptr<LogSubscriber> log_subscriber() const { return nullptr; }

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
         * @see `touca/framework/suites.hpp` to learn about the set of
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
        virtual bool skip(const Testcase& testcase) const;

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
        virtual Errors execute(const Testcase& testcase) const = 0;

    protected:
        /**
         * Container for the configuration parameters of the application,
         * the Test Framework and the workflow under test.
         *
         * @see `framework::Options`
         */
        Options _options;
    };

    /**
     * @brief Takes over running your regression test application.
     *
     * @details Designed to abstract away many of the common features expected
     *          of a regression test tool, such as parsing of command line
     *          arguments and configuration files, logging, error handling,
     *          managing test results on filesystem and submitting them to
     *          the Touca server.
     *
     *          In most typical regression test tools, this function is meant
     *          to be called from the application's `main` function, using the
     *          pattern shown below.
     *
     *          @code
     *              int main(int argc, char* argv[])
     *              {
     *                  MyWorkflow workflow;
     *                  return touca::framework::main(argc, argv, workflow);
     *              }
     *          @endcode
     *
     *          Where `MyWorkflow` would be a custom class derived from
     *          Workflow and implemented by the test author.
     *
     *          `framework::main` calls various methods of the provided
     *          `Workflow` instance in the order shown below.
     *
     *            - `Workflow::describe_options`
     *            - `Workflow::add_options`
     *            - `Workflow::parse_options`
     *            - `Workflow::validate_options`
     *            - `Workflow::log_subscriber`
     *            - `Workflow::initialize`
     *            - `Workflow::suite`
     *            - `Workflow::skip`
     *            - `Workflow::execute`
     *
     * @param argc number of arguments provided to your application's `main`
     *             function.
     *
     * @param argv arguments provided to your applications `main` function.
     *
     * @param workflow instance of a class derived from `Workflow` that
     *                 describes what the test tool should do for each
     *                 testcase.
     *
     * @return zero on success and non-zero on failure
     *
     * @see Workflow
     *
     * @since v1.2.0
     */
    TOUCA_FRAMEWORK_API int main(int argc, char* argv[], Workflow& workflow);

}} // namespace touca::framework
