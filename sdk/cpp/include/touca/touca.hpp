// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

/**
 * @file touca.hpp
 *
 * @brief Entry-point to the Touca SDK for C++.
 *
 * @details `touca/touca.hpp` is the only header file of Touca SDK for C++
 *          that users should include in their regression test tool.
 *          It provides all the functions necessary to configure the client,
 *          capture results and submit them to the Touca server.
 */

#include <unordered_map>

#include "touca/core/serializer.hpp"
#include "touca/extra/logger.hpp"
#include "touca/lib_api.hpp"

// the following header file(s) are included only to make it sufficient
// for the users of this library to include only this header file

#include "touca/extra/scoped_timer.hpp"

#ifdef TOUCA_INCLUDE_RUNNER
#include "touca/runner/runner.hpp"
#endif

/**
 * @namespace touca
 *
 * @brief Provides an interface to the Touca SDK for C++.
 */
namespace touca {

/**
 * @brief Configures the touca client.
 *
 * @details Must be called before declaring testcases and adding
 *          results to the client.
 *
 * @code
 *     touca::configure([](ClientOptions& x){
 *         x.api-key = "03dda763-62ea-436f-8395-f45296e56e4b"
 *         x.api-url = "https://api.touca.io"
 *         x.team = "your-team"
 *     });
 * @endcode
 *
 * @param options a callback function for setting configuration parameters
 */
TOUCA_CLIENT_API void configure(
    const std::function<void(ClientOptions&)> options = nullptr);

/**
 * @brief Checks if the client is configured to perform basic operations.
 *
 * @details Client is considered configured if it can capture test results
 *          and store them locally on the filesystem. The following
 *          configuration parameters shall be provided, directly or
 *          indirectly, together in a single call, or separately in a
 *          sequence of calls, in order for the client to be considered as
 *          configured.
 *
 *          @li team
 *          @li suite
 *          @li version
 *
 *          The configuration parameters above may be provided indirectly,
 *          in part or in full, as components of the configuration
 *          parameter `api-url`.
 *
 * @warning In addition to the configuration parameters above, the
 *          parameters `api-url` and `api-key` shall be provided for the
 *          client to be able to submit captured test results to the server.
 *
 * @return true if the client is properly configured
 *
 * @see configure for a list of permissible configuration parameters
 */
TOUCA_CLIENT_API bool is_configured();

/**
 * @brief Provides the most recent error, if any, encountered during
 *        client configuration.
 *
 * @return short description of the most recent configuration error
 */
TOUCA_CLIENT_API std::string configuration_error();

/**
 * @brief registers a custom logger that is notified when an event
 *        of potential interest takes place.
 *
 * @details This function enables users to register their own logger
 *          derived from `touca::logger` and listen for log events
 *          generated by the client library. Log events include
 *          warnings and errors if client library is misused or fails
 *          to perform an instructed action.
 *          Adding a logger is **not** necessary to use the client library.
 *
 * @param logger a custom logger derived from `touca::logger` that
 *        is notified of log events generated by the client library.
 */
TOUCA_CLIENT_API void add_logger(const std::shared_ptr<touca::logger> logger);

/**
 * @brief Declares name of the testcase to which all subsequent results
 *        will be submitted until a new testcase is declared.
 *
 * @details Unless configuration options `concurrency` is set to false, when a
 *          thread calls `declare_testcase` all other threads also have their
 *          most recent testcase changed to the newly declared one.
 *
 * @param name name of the testcase to be declared
 */
TOUCA_CLIENT_API void declare_testcase(const std::string& name);

/**
 * @brief Removes all logged information associated with a given testcase.
 *
 * @details Removes from memory, all information that is logged for the
 *          previously-declared testcase, for all threads, regardless
 *          of whether configuration option `concurrency` is set.
 *          This function does not remove testcase results from the
 *          server, in case they are already submitted.
 *          It clears all information about that testcase from the client
 *          library such that switching back to an already-declared or
 *          already-submitted testcase would behave similar to when that
 *          testcase was first declared.
 *          Calling this function is useful in long-running regression
 *          tests, after submission of testcase to the server,
 *          if memory consumed by the client library is a concern or if
 *          there is a risk that a future testcase with a similar name
 *          may be executed.
 *
 * @param name name of the testcase to be removed from memory
 */
TOUCA_CLIENT_API void forget_testcase(const std::string& name);

#ifndef DOXYGEN_SHOULD_SKIP_THIS

/**
 * @namespace touca::detail
 *
 * @brief Provides functions internally used by client library.
 *
 * @details Directly calling functions exposed in this namespace
 *          is strongly discouraged.
 */
namespace detail {

TOUCA_CLIENT_API void check(const std::string& key, const data_point& value);

TOUCA_CLIENT_API void assume(const std::string& key, const data_point& value);

TOUCA_CLIENT_API void add_array_element(const std::string& key,
                                        const data_point& value);

}  // namespace detail

#endif  // DOXYGEN_SHOULD_SKIP_THIS

/**
 * @brief Logs a given value as a test result for the declared testcase
 *        and associates it with the specified key.
 *
 * @details This function provides the primary interface for adding
 *          test results to the declared testcase.
 *
 * @tparam Char type of string to be associated with the value
 *         stored as a result. Expected to be convertible to
 *         `std::basic_string<char>`.
 *
 * @tparam Value original type of value `value` to be stored as
 *               a result in association with given key `key`.
 *
 * @param key name to be associated with the logged test result.
 *
 * @param value value to be logged as a test result
 */
template <typename Char, typename Value>
void check(Char&& key, const Value& value) {
  detail::check(std::forward<Char>(key), serializer<Value>().serialize(value));
}

/**
 * @brief Logs a given value as an assumption for the declared testcase
 *        and associates it with the specified key.
 *
 * @details Assertions are a special category of test results that are
 *          hardly ever expected to change for a given test case between
 *          different versions of the workflow.
 *          Assertions are treated differently by the Touca server:
 *          The server specially highlights assumptions if they are
 *          different between two test versions and removes them from
 *          user focus if they remain unchanged.
 *          Therefore, assumptions are particularly helpful for verifying
 *          assumptions about input data and their properties.
 *
 * @tparam Char type of string to be associated with the value
 *         stored as an assumption. Expected to be convertible to
 *         `std::basic_string<char>`.
 *
 * @tparam Value original type of value `value` to be stored as
 *               an assumption in association with given key `key`.
 *
 * @param key name to be associated with the logged test result.
 *
 * @param value value to be logged as an assumption
 *
 * @see check
 */
template <typename Char, typename Value>
void assume(Char&& key, const Value& value) {
  detail::assume(std::forward<Char>(key), serializer<Value>().serialize(value));
}

/**
 * @brief adds a given element to a list of results for the declared
 *        testcase which is associated with the specified key.
 *
 * @details Could be considered as a helper utility function.
 *          This method is particularly helpful to log a list of
 *          elements as they are found:
 *          @code
 *              for (const auto number : numbers) {
 *                  if (isPrime(number)) {
 *                      touca::add_array_element("prime numbers", number);
 *                      touca::add_hit_count("number of primes");
 *                  }
 *              }
 *          @endcode
 *          This pattern can be considered as a syntactic sugar for the
 *          following alternative:
 *          @code
 *              std::vector<unsigned> primes;
 *              for (const auto number : numbers) {
 *                  if (isPrime(number)) {
 *                      primes.emplace_back(number);
 *                  }
 *              }
 *              if (!primes.empty()) {
 *                  touca::check("prime numbers", primes);
 *                  touca::check("number of primes", primes.size());
 *              }
 *          @endcode
 *
 *          The items added to the list are not required to be of the
 *          same type. The following code is acceptable:
 *          @code
 *              touca::add_array_element("elements", 42);
 *              touca::add_array_element("elements", "forty three");
 *          @endcode
 *
 * @tparam Char type of string to be associated with the value
 *         stored as an element. Expected to be convertible to
 *         `std::basic_string<char>`.
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
 *        `touca::array`.
 *
 * @see check
 *
 * @since v1.1
 */
template <typename Char, typename Value>
void add_array_element(Char&& key, const Value& value) {
  detail::add_array_element(std::forward<Char>(key),
                            serializer<Value>().serialize(value));
}

/**
 * @brief Increments value of key `key` every time it is executed.
 *        creates the key with initial value of one if it does not exist.
 *
 * @details May be considered as a helper utility function.
 *          This method is particularly helpful to track variables
 *          whose values are determined in loops with indeterminate
 *          execution cycles:
 *          @code
 *              for (const auto number : numbers) {
 *                  if (isPrime(number)) {
 *                      add_array_element("prime numbers", number);
 *                      add_hit_count("number of primes");
 *                  }
 *              }
 *          @endcode
 *          This pattern can be considered as a syntactic sugar for the
 *          following alternative:
 *          @code
 *              std::vector<unsigned> primes;
 *              for (const auto number : numbers) {
 *                  if (isPrime(number)) {
 *                      primes.emplace_back(number);
 *                  }
 *              }
 *              if (!primes.empty()) {
 *                  touca::check("prime numbers", primes);
 *                  touca::check("number of primes", primes.size());
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
TOUCA_CLIENT_API void add_hit_count(const std::string& key);

/**
 * @brief adds an already obtained performance measurements.
 *
 * @details useful for logging a metric that is measured without using
 *          the client library.
 *
 * @param key name to be associated with the performance metric
 * @param duration duration in number of milliseconds
 * @since v1.2.0
 */
TOUCA_CLIENT_API void add_metric(const std::string& key,
                                 const unsigned duration);

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
TOUCA_CLIENT_API void start_timer(const std::string& key);

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
TOUCA_CLIENT_API void stop_timer(const std::string& key);

/**
 * @brief Stores test results in binary format in a file of specified path.
 *
 * @details Stores test results assigned to given set of testcases in
 *          a file of specified path in binary format.
 *          We do not recommend as a general practice for regression
 *          test tools to locally store their test results. This feature
 *          may be helpful for special cases such as when regression
 *          test tools have to be run in environments that have no
 *          access to the Touca server (e.g. running with no
 *          network access).
 *
 * @param path path to file in which test results should be stored
 *
 * @param testcases set of names of testcases whose results should be
 *                  stored. if given set is empty, all test cases will
 *                  be stored in the specified file.
 *
 * @param overwrite determines whether to overwrite any file that exists
 *                  in the specified `path`. Defaults to **true**.
 */
TOUCA_CLIENT_API void save_binary(
    const std::string& path, const std::vector<std::string>& testcases = {},
    const bool overwrite = true);

/**
 * @brief Stores test results in json format in a file of specified path.
 *
 * @details Stores test results assigned to given set of testcases in
 *          a file of specified path in json format.
 *
 * @param path path to file in which test results should be stored
 *
 * @param testcases set of names of testcases whose results should be
 *                  stored to disk. if given set is empty, all
 *                  testcases will be stored in the specified file.
 *
 * @param overwrite determines whether to overwrite any file that exists
 *                  in the specified `path`. Defaults to **true**.
 */
TOUCA_CLIENT_API void save_json(const std::string& path,
                                const std::vector<std::string>& testcases = {},
                                const bool overwrite = true);

/**
 * @brief Submits all test results recorded so far to Touca server.
 *
 * @details posts all test results of all testcases declared by this
 *          client to Touca server in flatbuffers format. Should only be called
 *          after the client is configured.
 *
 *          It is possible to call touca::post() multiple
 *          times during runtime of the regression test tool.
 *          Test cases already submitted to the server whose test results
 *          have not changed, will not be resubmitted.
 *          It is also possible to add test results to a testcase
 *          after it is submitted to the server. Any subsequent call
 *          to touca::post() will resubmit the modified
 *          testcase.
 *
 * @return true if all test results are successfully posted to the server.
 *
 * @throw runtime_error if client is not configured or that it is configured
 *        to operate without communicating with the server.
 */
TOUCA_CLIENT_API bool post();

/**
 * @brief Notifies Touca server that all test cases were executed
 *        and no further test result is expected to be submitted.
 *
 * @details Expected to be called by the test tool once all test cases
 *          are executed and all test results are posted.
 *
 *          Sealing the version is optional. The Touca server automatically
 *          performs this operation once a certain amount of time has
 *          passed since the last test case was submitted. This duration
 *          is configurable from the "Settings" tab in "Suite" Page.
 *
 * @return true if Touca server accepts our request.
 *
 * @throw runtime_error if client is not configured or that it is configured
 *        to operate without communicating with the server.
 *
 * @since v1.3
 */
TOUCA_CLIENT_API bool seal();

}  // namespace touca
