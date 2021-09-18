// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.devkit;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;

import io.touca.Touca;
import io.touca.exceptions.ConfigException;
import io.touca.types.ToucaType;

/**
 *
 */
public class Client {

    private Map<String, Case> cases = new HashMap<String, Case>();
    private boolean configured = false;
    private String configurationError;
    private Options options = new Options();
    private String activeCase;
    private Transport transport;
    private TypeHandler typeHandler = new TypeHandler();
    private Map<Long, String> threadMap = new HashMap<Long, String>();

    /**
     * Configures the touca client.
     * 
     * Must be called before declaring testcases and adding results to the client.
     * Should be regarded as a potentially expensive operation.
     *
     * @param callback configuration parameters
     * @return true if client is ready to capture data
     * @see Touca#configure
     */
    public boolean configure(final Consumer<Options> callback) {
        final Options options = new Options();
        callback.accept(options);
        this.configurationError = null;
        try {
            this.options.update(options);
            configureTransport(this.options);
        } catch (ConfigException ex) {
            this.configurationError = String.format("Configuration failed: %s", ex.getMessage());
            return false;
        }
        this.configured = true;
        return true;
    }

    /**
     *
     */
    private void configureTransport(final Options options) {
        if (options.offline != null && options.offline == true) {
            return;
        }
        final Map<String, String> existing = options.diff(new Options());
        final String[] checks = { "team", "suite", "version", "apiKey", "apiUrl" };
        final String[] missing = Arrays.stream(checks).filter(x -> !existing.containsValue(x)).toArray(String[]::new);
        if (missing.length != 0) {
            return;
        }
        if (this.transport == null) {
            this.transport = new Transport();
        }
        this.transport.update(options);
    }

    /**
     * Checks if the client is configured to perform basic operations.
     *
     * Client is considered configured if it can capture test results and store them
     * locally on the filesystem. The configuration parameters `team`, `suite`,
     * `version` shall be provided, directly or indirectly, together in a single
     * call, or separately in a sequence of calls, in order for the client to be
     * considered as configured.
     *
     * The configuration parameters above may be provided indirectly, in part or in
     * full, as components of the configuration parameter `api-url`.
     *
     * In addition to the configuration parameters above, the parameters `api-url`
     * and `api-key` shall be provided for the client to be able to submit captured
     * test results to the server.
     *
     * @return true if the client is properly configured
     * @see configure
     */
    public boolean isConfigured() {
        return this.configured;
    }

    /**
     * Provides the most recent error, if any, that is encountered during client
     * configuration.
     *
     * @return short description of the most recent configuration error
     */
    public String configurationError() {
        return this.configurationError;
    }

    /**
     * Queries the Touca server for the list of testcases that are submitted to the
     * baseline version of this suite.
     *
     * @return list of test cases of the baseline version of this suite
     * @throws IllegalStateException when called on the client that is not
     *                               configured to communicate with the Touca
     *                               server.
     */
    public Iterable<String> getTestcases() {
        return new ArrayList<String>();
    }

    /**
     * Declares name of the test case to which all subsequent results will be
     * submitted until a new test case is declared.
     *
     * If configuration parameter `concurrency` is set to `enabled`, when a thread
     * calls {@link #declareTestcase} all other threads also have their most recent
     * testcase changed to the newly declared one. Otherwise, each thread will
     * submit to its own testcase.
     *
     * @param name name of the testcase to be declared
     */
    public void declareTestcase(final String name) {
        if (!this.configured) {
            return;
        }
        if (!this.cases.containsKey(name)) {
            Case testcase = new Case(meta -> {
                meta.testCase = name;
                meta.teamSlug = this.options.team;
                meta.testSuite = this.options.suite;
                meta.version = this.options.version;
            });
            this.cases.put(name, testcase);
        }
        this.threadMap.put(Thread.currentThread().getId(), name);
        this.activeCase = name;
    }

    /**
     * Removes all logged information associated with a given test case.
     *
     * This information is removed from memory, such that switching back to an
     * already-declared or already-submitted test case would behave similar to when
     * that test case was first declared. This information is removed, for all
     * threads, regardless of the configuration option `concurrency`. Information
     * already submitted to the server will not be removed from the server.
     *
     * This operation is useful in long-running regression test frameworks, after
     * submission of test case to the server, if memory consumed by the client
     * library is a concern or if there is a risk that a future test case with a
     * similar name may be executed.
     *
     * @param name name of the testcase to be removed from memory
     * @throws IllegalArgumentException when called with the name of a test case
     *                                  that was never declared
     */
    public void forgetTestcase(final String name) {
        if (!this.configured) {
            return;
        }
        if (!this.cases.containsKey(name)) {
            String error = String.format("key %s does not exist", name);
            throw new IllegalArgumentException(error);
        }
        this.cases.get(name).clear();
        this.cases.remove(name);
    }

    /**
     * Logs a given value as a test result for the declared test case and associates
     * it with the specified key.
     *
     * @param key   name to be associated with the logged test result
     * @param value value to be logged as a test result
     */
    public void addResult(final String key, final Object value) {
        final String testcase = getLastTestcase();
        if (testcase != null) {
            final ToucaType toucaValue = this.typeHandler.transform(value);
            cases.get(testcase).addResult(key, toucaValue);
        }
    }

    /**
     * Logs a given value as an assertion for the declared test case and associates
     * it with the specified key.
     *
     * @param key   name to be associated with the logged test result
     * @param value value to be logged as a test result
     */
    public void addAssertion(final String key, final Object value) {
        final String testcase = getLastTestcase();
        if (testcase != null) {
            final ToucaType toucaValue = this.typeHandler.transform(value);
            cases.get(testcase).addAssertion(key, toucaValue);
        }
    }

    /**
     * Adds a given value to a list of results for the declared test case which is
     * associated with the specified key.
     *
     * @param <T>   type of the value to be captured. Could be anything.
     * @param key   name to be associated with the logged test result
     * @param value element to be appended to the array
     */
    public <T> void addArrayElement(final String key, final T value) {
    }

    /**
     * Increments value of key every time it is executed. creates the key with
     * initial value of one if it does not exist.
     *
     * @param key name to be associated with the logged test result
     */
    public void addHitCount(final String key) {
    }

    /**
     * Adds an already obtained performance measurements.
     *
     * Useful for logging a metric that is measured without using the client
     * library.
     *
     * @param key          name to be associated with the performance metric
     * @param milliseconds duration in number of milliseconds
     */
    public void addMetric(final String key, final long milliseconds) {
    }

    /**
     * Starts timing an event with the specified name.
     *
     * Measurement of the event is only complete when function {@link #stopTimer} is
     * later called for the specified name.
     *
     * @param key name to be associated with the performance metric
     */
    public void startTimer(final String key) {
    }

    /**
     * Stops timing an event with the specified name.
     *
     * Expects function {@link #startTimer} to have been called previously with the
     * specified name.
     *
     * @param key name to be associated with the performance metric
     */
    public void stopTimer(final String key) {
    }

    /**
     * Registers custom serialization logic for a given custom data type. Calling
     * this function is rarely needed. The library already handles all custom data
     * types by serializing all their properties. Custom serializers allow you to
     * exclude a subset of an object properties during serialization.
     *
     * @param <T>      type of the value to be captured. Could be anything.
     * @param type     type to be serialized
     * @param callback function that converts an instance of a given type to an
     *                 object with different member variables.
     */
    public <T> void addSerializer(final Class<T> type, SerializerCallback<T> callback) {
    }

    /**
     * Stores test results and performance benchmarks in binary format in a file of
     * specified path.
     *
     * Touca binary files can be submitted at a later time to the Touca server.
     *
     * We do not recommend as a general practice for regression test tools to
     * locally store their test results. This feature may be helpful for special
     * cases such as when regression test tools have to be run in environments that
     * have no access to the Touca server (e.g. running with no network access).
     *
     * @param path  path to file in which test results and performance benchmarks
     *              should be stored
     * @param cases names of test cases whose results should be stored. If a set is
     *              not specified or is set as empty, all test cases will be stored
     *              in the specified file.
     */
    public void saveBinary(final String path, final Iterable<String> cases) {
    }

    /**
     * Stores test results and performance benchmarks in JSON format in a file of
     * specified path.
     *
     * This feature may be helpful during development of regression tests tools for
     * quick inspection of the test results and performance metrics being captured.
     *
     * @param path  path to file in which test results and performance benchmarks
     *              should be stored
     * @param cases names of test cases whose results should be stored. If a set is
     *              not specified or is set as empty, all test cases will be stored
     *              in the specified file.
     */
    public void saveJson(final String path, final Iterable<String> cases) {
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
     * @throws IllegalStateException when called on the client that is not
     *                               configured to communicate with the Touca
     *                               server.
     */
    public void post() {
    }

    /**
     * Notifies the Touca server that all test cases were executed for this version
     * and no further test result is expected to be submitted. Expected to be called
     * by the test tool once all test cases are executed and all test results are
     * posted.
     *
     * Sealing the version is optional. The Touca server automatically performs this
     * operation once a certain amount of time has passed since the last test case
     * was submitted. This duration is configurable from the "Settings" tab in
     * "Suite" Page.
     *
     * @throws IllegalStateException when called on the client that is not
     *                               configured to communicate with the Touca
     *                               server.
     */
    public void seal() {
    }

    /**
     *
     */
    private String getLastTestcase() {
        if (!isConfigured()) {
            return null;
        }
        if (options.concurrency) {
            return activeCase;
        }
        return threadMap.get(Thread.currentThread().getId());
    }

    /**
     *
     */
    @FunctionalInterface
    public interface SerializerCallback<T> {
        Object call(T dataType);
    }

}
