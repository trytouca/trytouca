// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

import io.touca.core.Client;
import io.touca.core.Options;
import io.touca.exceptions.StateException;
import io.touca.rules.ComparisonRule;
import io.touca.runner.Runner;
import java.io.IOException;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.nio.file.Paths;
import java.util.function.Consumer;

/**
 * Entry-point to the Touca SDK for Java.
 */
@SuppressWarnings("PMD.TooManyMethods")
public final class Touca {

  private static final Client instance = new Client();

  /**
   * This class is designed to be used as utility and cannot be instantiated.
   */
  private Touca() {
  }

  /**
   * Activates Touca data capturing functions.
   *
   * Must be called before declaring testcases and adding results to the client.
   * Should be regarded as a potentially expensive operation. Should be called
   * only from your test environment.
   *
   * You can pass a variety of configuration parameters that customize the SDK
   * behavior. Passing no option configures the client with minimum
   * functionality which allows you to capture test results and performance
   * benchmarks and store them in local filesystem but does not allow the SDK to
   * communicate with the Touca server.
   *
   * As long as the API Key and API URL to the Touca server are known to the
   * client, it attempts to perform a handshake with the Touca server to
   * authenticate with the server and obtain the list of known test cases for
   * the baseline version of the specified suite. You can explicitly disable
   * this handshake in rare cases where you want to prevent ever communicating
   * with the Touca server.
   *
   * You can call this function any number of times. The client preserves the
   * configuration parameters specified in previous calls to this function.
   *
   * @param callback lambda function for setting configuration parameters
   * @return true if client is ready to capture data
   */
  public static boolean configure(final Consumer<Options> callback) {
    return instance.configure(callback);
  }

  /**
   * Convenience function for {@link #configure(Consumer)}.
   *
   * Configures the Touca client with minimum functionality. The client would be
   * able to capture behavior and performance data and store them on a local
   * filesystem but it will not be able to post them to the Touca server.
   *
   * @return true if client is ready to capture data
   * @see #configure(Consumer) configure
   */
  public static boolean configure() {
    return instance.configure((options) -> {
    });
  }

  /**
   * Checks if previous call(s) to {@link #configure} have set the right
   * combination of configuration parameters to enable the client to perform
   * expected tasks.
   *
   * We recommend that you perform this check after client configuration and
   * before calling other functions of the library::
   *
   * <pre>
   * {@code
   * if (!touca.isConfigured()) {
   *   System.out.println(touca.configurationError());
   *   System.exit(1);
   * }
   * }
   * </pre>
   *
   * At a minimum, the client is considered configured if it can capture test
   * results and store them locally on the filesystem. A single call to
   * {@link #configure} without any configuration parameters can help us get to
   * this state. However, if a subsequent call to {@link #configure} sets the
   * parameter `api_url` in short form without specifying parameters such as
   * `team`, `suite` and `version`, the client configuration is incomplete: We
   * infer that the user intends to submit results but the provided
   * configuration parameters are not sufficient to perform this operation.
   *
   * @return true if the client is properly configured
   * @see #configure() configure
   */
  public static boolean isConfigured() {
    return instance.isConfigured();
  }

  /**
   * Provides the most recent error, if any, that is encountered during client
   * configuration.
   *
   * @return short description of the most recent configuration error
   * @see #configure() configure
   */
  public static String configurationError() {
    return instance.configurationError();
  }

  /**
   * Queries the Touca server for the list of testcases that are submitted to
   * the baseline version of this suite.
   *
   * @return list of test cases of the baseline version of this suite
   * @throws StateException when called on the client that is not configured to
   *                        communicate with the Touca server.
   */
  public static Iterable<String> getTestcases() {
    return instance.getTestcases();
  }

  /**
   * Declares name of the test case to which all subsequent results will be
   * submitted until a new test case is declared.
   *
   * If configuration parameter `concurrency` is set to `enabled`, when a thread
   * calls {@link #declareTestcase} all other threads also have their most
   * recent testcase changed to the newly declared one. Otherwise, each thread
   * will submit to its own testcase.
   *
   * @param name name of the testcase to be declared
   */
  public static void declareTestcase(final String name) {
    instance.declareTestcase(name);
  }

  /**
   * Removes all logged information associated with a given test case.
   *
   * This information is removed from memory, such that switching back to an
   * already-declared or already-submitted test case would behave similar to
   * when that test case was first declared. This information is removed, for
   * all threads, regardless of the configuration option `concurrency`.
   * Information already submitted to the server will not be removed from the
   * server.
   *
   * This operation is useful in long-running regression test frameworks, after
   * submission of test case to the server, if memory consumed by the client
   * library is a concern or if there is a risk that a future test case with a
   * similar name may be executed.
   *
   * @param name name of the testcase to be removed from memory
   */
  public static void forgetTestcase(final String name) {
    instance.forgetTestcase(name);
  }

  /**
   * Logs a given value as a test result for the declared test case and
   * associates it with the specified key.
   *
   * @param <T>   type of the value to be captured.
   * @param key   name to be associated with the logged test result
   * @param value value to be logged as a test result
   */
  public static <T> void check(final String key, final T value) {
    instance.perform(element -> {
      element.check(key, instance.transform(value));
    });
  }

  /**
   * Logs a given value as a test result for the declared test case and
   * associates it with the specified key.
   *
   * @param <T>   type of the value to be captured.
   * @param key   name to be associated with the logged test result
   * @param value value to be logged as a test result
   * @param rule  comparison rule to consider when comparing this data point
   */
  public static <T> void check(final String key, final T value, final ComparisonRule rule) {
    instance.perform(element -> {
      element.check(key, instance.transform(value), rule);
    });
  }

  /**
   * Logs a given value as an assertion for the declared test case and
   * associates it with the specified key.
   *
   * @param <T>   type of the value to be captured.
   * @param key   name to be associated with the logged test result
   * @param value value to be logged as a test result
   */
  public static <T> void assume(final String key, final T value) {
    instance.perform(element -> {
      element.assume(key, instance.transform(value));
    });
  }

  /**
   * Adds a given value to a list of results for the declared test case which is
   * associated with the specified key.
   *
   * Could be considered as a helper utility function. This method is
   * particularly helpful to log a list of items as they are found:
   *
   * <pre>
   * <code>
   * for (int number: numbers) {
   *     if (is_prime(number)) {
   *         Touca.addArrayElement("prime numbers", number);
   *         Touca.addHitCount("number of primes");
   *     }
   * }
   * </code>
   * </pre>
   *
   * This pattern can be considered as a syntactic sugar for the following
   * alternative:
   *
   * <pre>
   * <code>
   * for (int number : numbers) {
   *     if (is_prime(number)) {
   *         primes.add(number);
   *     }
   * }
   * if (!primes.isEmpty()) {
   *     Touca.check("prime numbers", primes);
   *     Touca.check("number of primes", primes.size());
   * }
   * </code>
   * </pre>
   *
   * The items added to the list are not required to be of the same type. The
   * following code is acceptable:
   *
   * <pre>
   * <code>
   * Touca.addArrayElement("prime numbers", 42);
   * Touca.addArrayElement("prime numbers", "forty three");
   * </code>
   * </pre>
   *
   * @param <T>   type of the value to be captured.
   * @param key   name to be associated with the logged test result
   * @param value element to be appended to the array
   * @throws IllegalArgumentException if specified key is already associated
   *                                  with a test result which was not iterable
   */
  public static <T> void addArrayElement(final String key, final T value) {
    instance.perform(element -> {
      element.addArrayElement(key, instance.transform(value));
    });
  }

  /**
   * Increments value of key every time it is executed. creates the key with
   * initial value of one if it does not exist.
   *
   * Could be considered as a helper utility function. This method is
   * particularly helpful to track variables whose values are determined in
   * loops with indeterminate execution cycles:
   *
   * <pre>
   * <code>
   * for (int number: numbers) {
   *     if (isPrime(number)) {
   *         Touca.addArrayElement("prime numbers", number);
   *         Touca.addHitCount("number of primes");
   *     }
   * }
   * </code>
   * </pre>
   *
   * This pattern can be considered as a syntactic sugar for the following
   * alternative:
   *
   * <pre>
   * <code>
   * for (int number: numbers) {
   *     if (is_prime(number)) {
   *         primes.add(number);
   *     }
   * }
   * if (!primes.isEmpty()) {
   *     Touca.check("prime numbers", primes);
   *     Touca.check("number of primes", primes.size());
   * }
   * </code>
   * </pre>
   *
   * @param key name to be associated with the logged test result
   * @throws IllegalArgumentException if specified key is already associated
   *                                  with a test result which was not an integer
   */
  public static void addHitCount(final String key) {
    instance.perform(element -> {
      element.addHitCount(key);
    });
  }

  /**
   * Adds an already obtained measurements to the list of captured performance
   * benchmarks.
   *
   * Useful for logging a metric that is measured without using this SDK.
   *
   * @param key          name to be associated with this performance benchmark
   * @param milliseconds duration of this measurement in milliseconds
   */
  public static void addMetric(final String key, final long milliseconds) {
    instance.perform(element -> {
      element.addMetric(key, milliseconds);
    });
  }

  /**
   * Starts timing an event with the specified name.
   *
   * Measurement of the event is only complete when function {@link #stopTimer}
   * is later called for the specified name.
   *
   * @param key name to be associated with the performance metric
   */
  public static void startTimer(final String key) {
    instance.perform(element -> {
      element.startTimer(key);
    });
  }

  /**
   * Stops timing an event with the specified name.
   *
   * Expects function {@link #startTimer} to have been called previously with
   * the specified name.
   *
   * @param key name to be associated with the performance metric
   */
  public static void stopTimer(final String key) {
    instance.perform(element -> {
      element.stopTimer(key);
    });
  }

  /**
   * Measures runtime of a given callback function.
   *
   * @param key      name to be associated with the performance metric
   * @param callback function whose runtime should be measured
   */
  public static void scopedTimer(final String key, final Runnable callback) {
    try (ScopedTimer timer = new ScopedTimer("calculate_gpa")) {
      callback.run();
    }
  }

  /**
   * Stores test results and performance benchmarks in binary format in a file
   * of specified path.
   *
   * Touca binary files can be submitted at a later time to the Touca server.
   *
   * We do not recommend as a general practice for regression test tools to
   * locally store their test results. This feature may be helpful for special
   * cases such as when regression test tools have to be run in environments
   * that have no access to the Touca server (e.g. running with no network
   * access).
   *
   * @param path  path to file in which test results and performance benchmarks
   *              should be stored
   * @param cases names of test cases whose results should be stored. If set to
   *              null or empty, all test cases will be stored in the specified
   *              file.
   * @throws IOException if we encounter any filesystem error
   */
  public static void saveBinary(final String path, final String[] cases)
      throws IOException {
    instance.saveBinary(Paths.get(path), cases);
  }

  /**
   * Stores test results and performance benchmarks in JSON format in a file of
   * specified path.
   *
   * This feature may be helpful during development of regression tests tools
   * for quick inspection of the test results and performance metrics being
   * captured.
   *
   * @param path  path to file in which test results and performance benchmarks
   *              should be stored
   * @param cases names of test cases whose results should be stored. If set to
   *              null or empty, all test cases will be stored in the specified
   *              file.
   * @throws IOException if we encounter any filesystem error
   */
  public static void saveJson(final String path, final String[] cases)
      throws IOException {
    instance.saveJson(Paths.get(path), cases);
  }

  /**
   * Registers custom conversion logic for a given data type.
   *
   * By default, Touca handles custom data types by serializing all their
   * properties. Registering a type adapter for a given type allows you to
   * override this behavior. During serialization, when Touca encounters a type
   * with a registered type adapter, it applies the type conversion before
   * performing the serialization.
   *
   * @param <T>     type of the value to be captured
   * @param type    type to be converted
   * @param adapter logic to convert an instance of a given type to an object
   */
  public static <T> void addTypeAdapter(final Class<T> type,
      final TypeAdapter<T> adapter) {
    instance.addTypeAdapter(type, adapter);
  }

  /**
   * Submits all test results recorded so far to Touca server.
   *
   * It is possible to call {@link #post} multiple times during runtime of the
   * regression test tool. Test cases already submitted to the server whose test
   * results have not changed, will not be resubmitted.
   *
   * It is also possible to add test results to a testcase after it is submitted
   * to the server. Any subsequent call to {@link #post} will resubmit the
   * modified test case.
   *
   * @throws StateException when called on the client that is not configured to
   *                        communicate with the Touca server.
   */
  public static void post() {
    instance.post();
  }

  /**
   * Notifies the Touca server that all test cases were executed for this
   * version and no further test result is expected to be submitted. Expected to
   * be called by the test tool once all test cases are executed and all test
   * results are posted.
   *
   * Sealing the version is optional. The Touca server automatically performs
   * this operation once a certain amount of time has passed since the last test
   * case was submitted. This duration is configurable from the "Settings" tab
   * in "Suite" Page.
   *
   * @throws StateException when called on the client that is not configured to
   *                        communicate with the Touca server.
   */
  public static void seal() {
    instance.seal();
  }

  /**
   * Runs registered workflows, one by one, for available test cases.
   *
   * This function is intended to be called once from the main function after
   * all workflows are declared.
   *
   * Calls System.exit(1) if configuration options specified as command line
   * arguments, environment variables, or in a configuration file, have
   * unexpected values or are in conflict with each other.
   *
   * @param mainClass class that includes the main method of test application
   * @param mainArgs  command-line arguments provided to the application
   */
  public static void run(final Class<?> mainClass, final String[] mainArgs) {
    new Runner().parse(mainArgs).findWorkflows(mainClass).run(instance);
  }

  /**
   * Declares a test workflow to be executed by the test framework with multiple
   * test cases, one at a time.
   */
  @Target(ElementType.METHOD)
  @Retention(RetentionPolicy.RUNTIME)
  public @interface Workflow {
    // no value
  }

}
