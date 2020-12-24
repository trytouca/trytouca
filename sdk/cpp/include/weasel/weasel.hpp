/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

/**
 * @file weasel.hpp
 *
 * @brief Entry-point to the Weasel Client Library for C++.
 *
 * @details `weasel/weasel.hpp` is the only header file of Weasel C++
 *          Client Library that users should include in their regression
 *          test tool. It provides all the functions necessary to configure
 *          the client, register results and submit them to the Weasel
 *          platform.
 *
 * @author Pejman Ghorbanzade <pejman@ghorbanzade.com>
 * @date 2018-2020
 */

#include "weasel/detail/scoped_timer.hpp"
#include "weasel/devkit/convert.hpp"
#include "weasel/extra/logger.hpp"
#include "weasel/lib_api.hpp"
#include <unordered_map>

// the following header file(s) are included only to make it sufficient
// for the users of this library to include only this header file

#include "weasel/devkit/object.hpp"

#ifndef DOXYGEN_SHOULD_SKIP_THIS
#if (__cplusplus >= 201703L)
#define MAYBE_UNUSED [[maybe_unused]]
#else
#define MAYBE_UNUSED
#endif
#endif

/**
 * @def WEASEL_SCOPED_TIMER
 * @brief convenience macro for logging performance of a function
 *        as a weasel performance metric.
 * @see weasel::make_timer()
 *      for more information about adding performance metrics.
 */
#define WEASEL_SCOPED_TIMER                                                          \
    MAYBE_UNUSED const auto& weasel_scoped_timer = weasel::make_timer(__FUNCTION__); \
    std::ignore = weasel_scoped_timer;

/**
 * @namespace weasel
 *
 * @brief Provides an interface to the Weasel C++ Client Library.
 */
namespace weasel {

    using path = std::string;

    /**
     * @brief Configures the weasel client.
     *
     * @details Must be called before declaring testcases and adding
     *          results to the client. Should be regarded as a potentially
     *          expensive operation. Takes configuration parameters as a
     *          list of key value pairs whose keys are from the list below.
     *
     * @li @b api-key
     *        API Key issued by Weasel Platform.
     *        As an alternative to passing this parameter to `configure`,
     *        you can set environment variable `WEASEL_API_KEY` instead.
     *
     * @li @b api-url
     *        URL of Weasel Platform API. Can be provided either in long
     *        format like `https://getweasel.com/api/@/myteam/mysuite` or
     *        in short format like `https://getweasel.com/api`. If slug of
     *        the team and suite to which the results belong are specified,
     *        separately passing `team` and `suite` configuration parameters
     *        will not be required.
     *
     * @li @b version
     *        Version of the workflow under test.
     *        Required at all times.
     *
     * @li @b suite
     *        Name of the testsuite to which testresults belong.
     *        Required if `api-url` is not set or if `api-url` is provided
     *        in short format.
     *
     * @li @b team
     *        Name of the team to which this testsuite belongs.
     *        Required if `api-url` is not set or if `api-url` is provided
     *        in short format.
     *
     * @li @b handshake
     *        Ensures Weasel Platform is ready to accept incoming
     *        testresults as part of client configuration process.
     *        Handshake is performed only if `api-key` and `api-url`
     *        parameters are set.
     *        Defaults to `true`.
     *
     * @li @b post-testcases
     *        Maximum number of testcases whose results may be included
     *        in a single http post request, when `weasel::post` is called.
     *        Defaults to 10.
     *
     * @li @b post-maxretries
     *        Maximum number of consecutive attempts the client library
     *        should make to re-submit testresults if initial http post
     *        request fails when `weasel::post` is called.
     *        Defaults to 2.
     *
     * @li @b testcase-declaration-mode
     *        Can be one of `all-threads` and `per-thread`.
     *        Defaults to `all-threads`.
     *        Indicates whether testcase declaration is per thread or
     *        shared among all threads of the process. If testcase
     *        declaration is for all threads, when a thread calls
     *        `declare_testcase` all other threads also have their
     *        most recent testcase changed to the newly declared
     *        testcase and any future call to logging functions like
     *        `add_result` will affect the newly declared testcase.
     *
     * The most common pattern for configuring the client is to set
     * configuration parameters `api-url` and `version` as shown below,
     * while providing `WEASEL_API_KEY` as an environment variable.
     *
     * @code
     *     weasel::configure({
     *         { "api-url": "https://getweasel.com/api/@/some-team/some-suite" },
     *         { "version": "4.2.0" }
     *     });
     * @endcode
     *
     * It is possible to provide your API key as a value for `api-key`
     * configuration parameter instead of setting an environment variable.
     * We advise **against** doing so. API key should be considered as
     * sensitive user information and should not be hard-coded.
     *
     * It is also possible to provide `api-url` in short format and to
     * separately specify `team` slug and `suite` slug as shown below.
     *
     * @code
     *     weasel::configure({
     *         { "api-key": "03dda763-62ea-436f-8395-f45296e56e4b" },
     *         { "api-url": "https://getweasel.com/api" },
     *         { "team": "some-team" },
     *         { "suite": "some-suite" },
     *         { "version": "4.2.0" }
     *     });
     * @endcode
     *
     * When `api-key` and `api-url` are provided, the configuration process
     * performs authentication to Weasel Platform, preparing for submission
     * of results when `weasel::post` is called in the future. In case you
     * do not intend to submit any result to the Platform, you can opt not
     * to provide any of `api-key` and `api-url` parameters and to use the
     * following pattern instead.
     *
     * @code
     *     weasel::configure({
     *         { "team": "some-team" },
     *         { "suite": "some-suite" },
     *         { "version": "4.2.0" }
     *     });
     * @endcode
     */
    WEASEL_CLIENT_API void configure(
        const std::unordered_map<std::string, std::string>& opts);

    /**
     * @brief Configures the weasel client using a configuration file
     *        in specified filesystem path.
     *
     * @details Convenience function that configures client based on a
     *          a given configuration file. Expects the configuration
     *          file to be in json format.
     *          The configuration file must include a top-level property
     *          `weasel` whose value is an object describing configuration
     *          parameters of the client. Formal specification of the
     *          expected json file is shown below.
     *
     * @include config-file.schema.json
     *
     * @param path path to a configuration file in json format
     *
     * @see configure for more information about individual configuration
     *                parameters
     * @since v1.1
     */
    WEASEL_CLIENT_API void configure(const weasel::path& path);

    /**
     * @brief registers a custom logger that is notified when an event
     *        of potential interest takes place.
     *
     * @details This function enables users to register their own logger
     *          derived from `weasel::logger` and listen for log events
     *          generated by Weasel Client Library. Log events include
     *          warnings and errors if client library is misused or fails
     *          to perform an instructed action.
     *          Adding a logger is **not** necessary to use the weasel
     *          client library.
     *
     * @param logger a custom logger derived from `weasel::logger` that
     *        is notified of log events generated by Weasel Client Library
     */
    WEASEL_CLIENT_API void add_logger(
        const std::shared_ptr<weasel::logger> logger);

    /**
     * @brief Declares name of the testcase to which all subsequent results
     *        will be submitted until a new testcase is declared.
     *
     * @details if configuration parameter `testcase-declaration-mode` is
     *          set to `all-threads`, when a thread calls `declare_testcase`
     *          all other threads also have their most recent testcase
     *          changed to the newly declared one. Otherwise, each thread
     *          will submit to its own testcase.
     *
     * @param name name of the testcase to be declared
     */
    WEASEL_CLIENT_API void declare_testcase(const std::string& name);

    /**
     * @brief wide string variant of the `declare_testcase` function.
     *
     * @param name name of the testcase to be declared
     *
     * @see declare_testcase for more information
     */
    WEASEL_CLIENT_API void declare_testcase(const std::wstring& name);

    /**
     * @brief Removes all logged information associated with a given testcase.
     *
     * @details Removes from memory, all information that is logged for the
     *          previously-declared testcase, for all threads, regardless
     *          of the `testcase-declaration-mode` configuration parameter.
     *          This function does not remove testcase results from the
     *          platform, in case they are already submitted.
     *          It clears all information about that testcase from the client
     *          library such that switching back to an already-declared or
     *          already-submitted testcase would behave similar to when that
     *          testcase was first declared.
     *          Calling this function is useful in long-running regression
     *          test frameworks, after submission of testcase to the platform,
     *          if memory consumed by the client library is a concern or if
     *          there is a risk that a future testcase with a similar name
     *          may be executed.
     *
     * @param name name of the testcase to be removed from memory
     */
    WEASEL_CLIENT_API void forget_testcase(const std::string& name);

    /**
     * @brief wide string variant of the `forget_testcase` function.
     *
     * @param name name of the testcase to be removed from memory
     *
     * @see forget_testcase for more information
     */
    WEASEL_CLIENT_API void forget_testcase(const std::wstring& name);

#ifndef DOXYGEN_SHOULD_SKIP_THIS

    /**
     * @namespace weasel::internal
     *
     * @brief Provides functions internally used by client library.
     *
     * @details Directly calling functions exposed in this namespace
     *          is strongly discouraged.
     */
    namespace internal {

        WEASEL_CLIENT_API void add_result(
            const std::string& key,
            const std::shared_ptr<weasel::types::IType>& value);

        WEASEL_CLIENT_API void add_result(
            const std::wstring& key,
            const std::shared_ptr<weasel::types::IType>& value);

        WEASEL_CLIENT_API void add_assertion(
            const std::string& key,
            const std::shared_ptr<weasel::types::IType>& value);

        WEASEL_CLIENT_API void add_assertion(
            const std::wstring& key,
            const std::shared_ptr<weasel::types::IType>& value);

        WEASEL_CLIENT_API void add_array_element(
            const std::string& key,
            const std::shared_ptr<weasel::types::IType>& value);

        WEASEL_CLIENT_API void add_array_element(
            const std::wstring& key,
            const std::shared_ptr<weasel::types::IType>& value);

    } // namespace internal

#endif // DOXYGEN_SHOULD_SKIP_THIS

    /**
     * @brief Logs a given value as a test result for the declared testcase
     *        and associates it with the specified key.
     *
     * @details This function provides the primary interface for adding
     *          test results to the declared testcase.
     *
     * @tparam Char type of string to be associated with the value
     *         stored as a result. Expected to be convertible to
     *         `std::basic_string<char>` or `std::basic_string<wchar_t>`.
     *
     * @tparam Value original type of value `value` to be stored as
     *               a result in association with given key `key`.
     *
     * @param key name to be associated with the logged test result.
     *
     * @param value value to be logged as a test result
     */
    template <typename Char, typename Value>
    void add_result(Char&& key, const Value& value)
    {
        const auto& ivalue = convert::Conversion<Value>()(value);
        internal::add_result(std::forward<Char>(key), ivalue);
    }

    /**
     * @brief Logs a given value as an assertion for the declared testcase
     *        and associates it with the specified key.
     *
     * @details Assertions are a special category of test results that are
     *          hardly ever expected to change for a given test case between
     *          different versions of the workflow.
     *          Assertions are treated differently by the Weasel Platform:
     *          The platform specially highlights assertions if they are
     *          different between two test versions and removes them from
     *          user focus if they remain unchanged.
     *          Therefore, assertions are particularly helpful for verifying
     *          assumptions about input data and their properties.
     *
     * @tparam Char type of string to be associated with the value
     *         stored as an assertion. Expected to be convertible to
     *         `std::basic_string<char>` or `std::basic_string<wchar_t>`.
     *
     * @tparam Value original type of value `value` to be stored as
     *               an assertion in association with given key `key`.
     *
     * @param key name to be associated with the logged test result.
     *
     * @param value value to be logged as an assertion
     *
     * @see add_result
     */
    template <typename Char, typename Value>
    void add_assertion(Char&& key, const Value& value)
    {
        const auto& ivalue = convert::Conversion<Value>()(value);
        internal::add_assertion(std::forward<Char>(key), ivalue);
    }

    /**
     * @brief adds a given element to a list of results for the declared
     *        testcase which is associated with the specified key.
     *
     * @details May be considered as a helper utility function.
     *          This method is particularly helpful to log a list of
     *          elements as they are found:
     *          @code
     *              for (const auto number : numbers) {
     *                  if (isPrime(number)) {
     *                      weasel::add_array_element("prime numbers", number);
     *                      weasel::add_hit_count("number of primes");
     *                  }
     *              }
     *          @endcode
     *          This pattern can be considered as a syntactic sugar for
     *          for the following alternative:
     *          @code
     *              std::vector<unsigned> primes;
     *              for (const auto number : numbers) {
     *                  if (isPrime(number)) {
     *                      primes.emplace_back(number);
     *                  }
     *              }
     *              if (!primes.empty()) {
     *                  weasel::add_result("prime numbers", primes);
     *                  weasel::add_result("number of primes", primes.size());
     *              }
     *          @endcode
     *
     *          The elements added to the list are not required to be of the
     *          same type. The following code is acceptable:
     *          @code
     *              weasel::add_array_element("elements", 42);
     *              weasel::add_array_element("elements", "forty three");
     *          @endcode
     *
     * @tparam Char type of string to be associated with the value
     *         stored as an element. Expected to be convertible to
     *         `std::basic_string<char>` or `std::basic_string<wchar_t>`.
     *
     * @tparam Value original type of value `value` to be stored as
     *               an element of an array associated with given key `key`.
     *
     * @param key name to be associated with the logged test result.
     *
     * @param value element to be appended to the array
     *
     * @throw std::invalid_argument if specified key is already associated
     *        with a test result whose type is not a derivative of
     *        `weasel::types::array`.
     *
     * @see add_result
     *
     * @since v1.1
     */
    template <typename Char, typename Value>
    void add_array_element(Char&& key, const Value& value)
    {
        const auto& ivalue = convert::Conversion<Value>()(value);
        internal::add_array_element(std::forward<Char>(key), ivalue);
    }

    /**
     * @brief Increments value of key `key` every time it is executed.
     *        creates the key with initial value of one if it does not exist.
     *
     * @details May be considered as a helper utility function.
     *          This method is particularly helpful to track variables
     *          whose values are determined in loops with undeterminate
     *          execution cycles:
     *          @code
     *              for (const auto number : numbers) {
     *                  if (isPrime(number)) {
     *                      add_array_element("prime numbers", number);
     *                      add_hit_count("number of primes");
     *                  }
     *              }
     *          @endcode
     *          This pattern can be considered as a syntactic sugar for
     *          for the following alternative:
     *          @code
     *              std::vector<unsigned> primes;
     *              for (const auto number : numbers) {
     *                  if (isPrime(number)) {
     *                      primes.emplace_back(number);
     *                  }
     *              }
     *              if (!primes.empty()) {
     *                  weasel::add_result("prime numbers", primes);
     *                  weasel::add_result("number of primes", primes.size());
     *              }
     *          @endcode
     *
     * @param key name to be associated with the logged test result.
     *
     * @throw std::invalid_argument if specified key is already associated
     *        with a test result which was not an integer.
     *
     * @since v1.1
     */
    WEASEL_CLIENT_API void add_hit_count(const std::string& key);

    /**
     * @brief adds an already obtained performance measurements.
     *
     * @details useful for logging a metric that is measured without using
     *          weasel client.
     *
     * @param key name to be associated with the performance metric
     * @param duration duration in number of milliseconds
     * @since v1.2.0
     */
    WEASEL_CLIENT_API void add_metric(
        const std::string& key, const unsigned duration);

    /**
     * @brief starts performance measurement of a given metric.
     *
     * @details records the time of invocation of this function, associates
     *          it with the given key and awaits a future call to `stop_timer`
     *          with the same key to log the duration as a performance metric.
     *
     * @param key name to be associated with the performance metric
     *
     * @since v1.1
     */
    WEASEL_CLIENT_API void start_timer(const std::string& key);

    /**
     * @brief stops performance measurement of a given metric.
     *
     * @details logs a performance metric whose value is the duration
     *          between this call and a previous call to `start_timer`
     *          with the same key.
     *
     * @param key name to be associated with the performance metric
     *
     * @since v1.1
     */
    WEASEL_CLIENT_API void stop_timer(const std::string& key);

    /**
     * @param key name to be associated with the performance metric
     *
     * @return a scoped timer object that notifies this client instance
     *         both when it is instantiated and when it goes out of scope;
     *         logging the duration between the two events as a performance
     *         metric.
     */
    WEASEL_CLIENT_API weasel::scoped_timer make_timer(const std::string& key);

    /**
     * @brief Stores testresults in binary format in a file of specified path.
     *
     * @details Stores testresults assigned to given set of testcases in
     *          a file of specified path in binary format.
     *          We do not recommend as a general practice for regression
     *          test tools to locally store their testresults. This feature
     *          may be helpful for special cases such as when regression
     *          test tools have to be run in environments that have no
     *          access to the Weasel Platform (e.g. running with no
     *          network access).
     *
     * @param path path to file in which testresults should be stored
     *
     * @param testcases set of names of testcases whose results should be
     *                  stored to disk. if given set is empty, all
     *                  testcases will be stored in the specified file.
     *
     * @param overwrite determines whether to overwrite any file that exists
     *                  in the specified `path`. Defaults to **true**.
     */
    WEASEL_CLIENT_API void save_binary(
        const weasel::path& path,
        const std::vector<std::string>& testcases = {},
        const bool overwrite = true);

    /**
     * @brief Stores testresults in json format in a file of specified path.
     *
     * @details Stores testresults assigned to given set of testcases in
     *          a file of specified path in json format.
     *
     * @param path path to file in which testresults should be stored
     *
     * @param testcases set of names of testcases whose results should be
     *                  stored to disk. if given set is empty, all
     *                  testcases will be stored in the specified file.
     *
     * @param overwrite determines whether to overwrite any file that exists
     *                  in the specified `path`. Defaults to **true**.
     */
    WEASEL_CLIENT_API void save_json(
        const weasel::path& path,
        const std::vector<std::string>& testcases = {},
        const bool overwrite = true);

    /**
     * @brief Submits all testresults recorded so far to Weasel Platform.
     *
     * @details posts all testresults of all testcases declared by this
     *          client to Weasel server in flatbuffers format. Uses the
     *          following configuration parameters that are provided
     *          during configuration time:
     *
     *          * `api-key`: API Key for Authenticating to Weasel Platform.
     *          * `api-url`: URL to Weasel Platform API.
     *          * `post-testcases`: maximum number of testcases to include
     *            in every HTTP post request.
     *          * `post-maxretries`: maximum number of attempts to submit
     *            testresults in a bundle of testcases until the HTTP post
     *            request is successful.
     *
     *          It is possible to call weasel::post() multiple
     *          times during runtime of the regression test tool.
     *          Testcases already submitted to platform whose testresults
     *          have not changed, will not be resubmitted.
     *          It is also possible to add testresults to a testcase
     *          after it is submitted to the platform. Any subsequent call
     *          to weasel::post() will resubmit the modified
     *          testcase.
     *
     * @return true if all testresults are successfully posted to
     *         Weasel Platform.
     *
     * @throw runtime_error if configuration parameter `api-url` is
     *        not provided during configuration operation.
     */
    WEASEL_CLIENT_API bool post();

    /**
     * @namespace weasel::compare
     *
     * @brief Provides API for comparing testcases.
     *
     * @details Functions and classes declared in this namespace are
     *          primarily exposed to be used by Weasel Comparator.
     *          Users seeking to build regression test tools should
     *          disregard the API exposed through this namespace.
     */
    namespace compare {
    }

    /**
     * @namespace weasel::convert
     *
     * @brief Provides API for declaring how objects of custom classes
     *        should be handled by Weasel C++ Client Library.
     *
     * @details Allows users seeking to build regression test tools to
     *          leverage the extensible Weasel Type System and implement
     *          specializations of the Weasel Conversion logic for their
     *          own custom types.
     */
    namespace convert {
    }

} // namespace weasel
