// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.devkit;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;
import java.util.function.Function;
import com.google.flatbuffers.FlatBufferBuilder;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import io.touca.Touca;
import io.touca.exceptions.ConfigException;
import io.touca.exceptions.StateException;
import io.touca.schema.Schema;
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
      this.options.apply(options);
      configureTransport(this.options);
    } catch (ConfigException ex) {
      this.configurationError =
          String.format("Configuration failed: %s", ex.getMessage());
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
    final String[] checks = {"team", "suite", "version", "apiKey", "apiUrl"};
    final String[] missing = Arrays.stream(checks)
        .filter(x -> !options.entrySet().containsKey(x) == true)
        .toArray(String[]::new);
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
   * Client is considered configured if it can capture test results and store
   * them locally on the filesystem. The configuration parameters `team`,
   * `suite`, `version` shall be provided, directly or indirectly, together in a
   * single call, or separately in a sequence of calls, in order for the client
   * to be considered as configured.
   *
   * The configuration parameters above may be provided indirectly, in part or
   * in full, as components of the configuration parameter `api-url`.
   *
   * In addition to the configuration parameters above, the parameters `api-url`
   * and `api-key` shall be provided for the client to be able to submit
   * captured test results to the server.
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
   * Queries the Touca server for the list of testcases that are submitted to
   * the baseline version of this suite.
   *
   * @return list of test cases of the baseline version of this suite
   * @throws StateException when called on the client that is not configured to
   *         communicate with the Touca server.
   */
  public Iterable<String> getTestcases() {
    if (this.transport == null) {
      throw new StateException(
          "client not configured to perform this operation");
    }
    return this.transport.getTestcases();
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
  public void declareTestcase(final String name) {
    if (!this.configured) {
      return;
    }
    if (!this.cases.containsKey(name)) {
      Case testcase = new Case(name, this.options.team, this.options.suite,
          this.options.version);
      this.cases.put(name, testcase);
    }
    this.threadMap.put(Thread.currentThread().getId(), name);
    this.activeCase = name;
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
   * @throws IllegalArgumentException when called with the name of a test case
   *         that was never declared
   */
  public void forgetTestcase(final String name) {
    if (!this.configured) {
      return;
    }
    if (!this.cases.containsKey(name)) {
      String error = String.format("key %s does not exist", name);
      throw new IllegalArgumentException(error);
    }
    this.cases.remove(name);
  }

  public void perform(final Consumer<Case> callback) {
    final String testcase = getLastTestcase();
    if (testcase != null) {
      callback.accept(this.cases.get(testcase));
    }
  }

  /**
   * Converts any given value of any given type to a known ToucaType instance
   * that the SDK knows how to handle.
   *
   * Enables conversion of custom user-defined types using serialization logic
   * passed by the library consumer.
   *
   * @param <T> type of the value to be converted
   * @param value value to be converted to a ToucaType
   * @return a ToucaType instance that the SDK knows how to handle
   */
  public <T> ToucaType transform(final T value) {
    return this.typeHandler.transform(value);
  }

  /**
   * Registers custom serialization logic for a given custom data type. Calling
   * this function is rarely needed. The library already handles all custom data
   * types by serializing all their properties. Custom serializers allow you to
   * exclude a subset of an object properties during serialization.
   *
   * @param <T> type of the value to be captured. Could be anything.
   * @param clazz type to be serialized
   * @param callback function that converts an instance of a given type to an
   *        object with different member variables.
   */
  public <T> void addSerializer(final Class<T> clazz,
      final Function<T, ?> callback) {
    this.typeHandler.addSerializer(clazz, callback);
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
   * @param path path to file in which test results and performance benchmarks
   *        should be stored
   * @param cases names of test cases whose results should be stored. If a set
   *        is not specified or is set as empty, all test cases will be stored
   *        in the specified file.
   * @throws IOException if we encounter file system errors when writing content
   *         to file
   */
  public void saveBinary(final Path path, final Set<String> cases)
      throws IOException {
    final Case[] items = this.save(path, cases);
    final byte[] content = this.serialize(items);
    Files.write(path, content);
  }

  /**
   * Stores test results and performance benchmarks in JSON format in a file of
   * specified path.
   *
   * This feature may be helpful during development of regression tests tools
   * for quick inspection of the test results and performance metrics being
   * captured.
   *
   * @param path path to file in which test results and performance benchmarks
   *        should be stored
   * @param cases names of test cases whose results should be stored. If a set
   *        is not specified or is set as empty, all test cases will be stored
   *        in the specified file.
   * @throws IOException if we encounter file system errors when writing content
   *         to file
   */
  public void saveJson(final Path path, final Set<String> cases)
      throws IOException {
    final Case[] items = this.save(path, cases);
    final String content = this.makeJson(items);
    Files.write(path, content.getBytes(StandardCharsets.UTF_8));
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
   *         communicate with the Touca server.
   */
  public void post() {
    if (this.transport == null) {
      throw new StateException(
          "client not configured to perform this operation");
    }
    if (!this.transport.hasToken()) {
      throw new StateException("client not authenticated");
    }
    byte[] content = this.serialize(this.cases.values().toArray(new Case[] {}));
    this.transport.post(content);
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
   *         communicate with the Touca server.
   */
  public void seal() {
    if (this.transport == null) {
      throw new StateException(
          "client not configured to perform this operation");
    }
    if (!this.transport.hasToken()) {
      throw new StateException("client not authenticated");
    }
    this.transport.seal();
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
  private byte[] serialize(final Case[] testcases) {
    final FlatBufferBuilder builder = new FlatBufferBuilder(1024);
    final int[] msgBuf = new int[testcases.length];
    for (int i = 0; i < testcases.length; i++) {
      final byte[] content = testcases[i].serialize();
      final int buf = Schema.MessageBuffer.createBufVector(builder, content);
      Schema.MessageBuffer.startMessageBuffer(builder);
      Schema.MessageBuffer.addBuf(builder, buf);
      msgBuf[i] = Schema.MessageBuffer.endMessageBuffer(builder);
    }
    final int fbsMsgBuf = Schema.Messages.createMessagesVector(builder, msgBuf);
    Schema.Messages.startMessages(builder);
    Schema.Messages.addMessages(builder, fbsMsgBuf);
    final int fbsMessages = Schema.Messages.endMessages(builder);
    builder.finish(fbsMessages);
    return builder.sizedByteArray();
  }

  /**
   *
   */
  private String makeJson(final Case[] testcases) {
    final Gson gson = new GsonBuilder().create();
    final JsonArray array = new JsonArray(testcases.length);
    for (final Case testcase : testcases) {
      array.add(testcase.json());
    }
    return gson.toJson(array);
  }

  /**
   *
   */
  private Case[] save(final Path path, final Set<String> cases) {
    Path parent = path.getParent();
    if (parent != null && parent.toFile().mkdirs()) {
      // TODO: log that directory was created
    }
    if (cases.isEmpty()) {
      return this.cases.values().toArray(new Case[this.cases.size()]);
    }
    return this.cases.entrySet().stream()
        .filter(x -> cases.contains(x.getKey())).map(x -> x.getValue())
        .toArray(Case[]::new);
  }

}