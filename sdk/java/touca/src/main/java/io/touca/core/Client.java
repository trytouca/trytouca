// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import com.google.flatbuffers.FlatBufferBuilder;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import io.touca.TypeAdapter;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.function.Consumer;

/**
 * The Touca client.
 */
@SuppressWarnings("PMD.TooManyMethods")
public class Client {

  private boolean configured;
  private String configError;
  private String activeCase;
  private Transport transport = new Transport();
  private final TypeHandler typeHandler = new TypeHandler();
  private final ClientOptions options = new ClientOptions();
  private final Map<String, Case> cases = new HashMap<>();
  private final Map<Long, String> threadMap = new HashMap<>();

  /**
   * Configures the touca client based on configuration options set via the
   * given callback.
   *
   * Must be called before declaring testcases and adding
   * results to the client.
   *
   * @param callback function for setting configuration parameters
   * @return true if client is ready to capture data
   */
  public boolean configure(final Consumer<ClientOptions> callback) {
    this.configError = null;
    callback.accept(this.options);
    try {
      OptionsParser.updateCoreOptions(this.options, this.transport);
    } catch (ToucaException ex) {
      this.configError = String.format("Configuration failed: %s", ex.getMessage());
      this.configured = false;
      return false;
    }
    if (!this.options.reflection) {
      this.typeHandler.disableReflection();
    }
    this.configured = true;
    return true;
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
   * @see #configure(Consumer) for the usage pattern
   */
  public boolean isConfigured() {
    return this.configured;
  }

  /**
   * Provides the most recent error, if any, that is encountered during client
   * configuration.
   *
   * @return short description of the most recent configuration error
   * @see #configure(Consumer) for the usage pattern
   */
  public String configurationError() {
    return this.configError;
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
      final Case testcase = new Case(name, this.options.team,
          this.options.suite, this.options.version);
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
   */
  public void forgetTestcase(final String name) {
    if (!this.configured) {
      return;
    }
    // remove testcase if it exists
    this.cases.remove(name);
  }

  /**
   * Helper function that performs a given operation on the most recent test
   * case.
   *
   * @param callback operation to perform on the most recent test case.
   */
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
   * @param <T>   type of the value to be converted
   * @param value value to be converted to a ToucaType
   * @return a ToucaType instance that the SDK knows how to handle
   */
  public <T> ToucaType transform(final T value) {
    return this.typeHandler.transform(value);
  }

  /**
   * Registers custom conversion logic for a given data type.
   *
   * By default, the client handles custom data types by serializing all their
   * properties. Registering a type adapter for a given type allows you to
   * override this behavior. During serialization, when the client encounters a
   * type with a registered type adapter, it applies the type conversion before
   * performing the serialization.
   *
   * @param <T>     type of the value to be captured
   * @param clazz   type to be converted
   * @param adapter logic to convert an instance of a given type to an object
   */
  public <T> void addTypeAdapter(final Class<T> clazz,
      final TypeAdapter<T> adapter) {
    this.typeHandler.addTypeAdapter(clazz, adapter);
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
   * @param cases names of test cases whose results should be stored. If a set
   *              is not specified or is set as empty, all test cases will be
   *              stored
   *              in the specified file.
   * @throws ToucaException if we encounter file system errors when writing
   *                        content to file
   */
  public void saveBinary(final Path path, final String[] cases)
      throws ToucaException {
    final Case[] items = this.save(path, cases);
    final byte[] content = this.serialize(items);
    try {
      Path parent = path.getParent();
      if (parent != null) {
        Files.createDirectories(parent);
      }
      Files.write(path, content);
    } catch (IOException ex) {
      throw new ToucaException("failed to create file %s: %s", path, ex.getMessage());
    }
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
   * @param cases names of test cases whose results should be stored. If a set
   *              is not specified or is set as empty, all test cases will be
   *              stored
   *              in the specified file.
   * @throws ToucaException if we encounter file system errors when writing
   *                        content to file
   */
  public void saveJson(final Path path, final String[] cases)
      throws ToucaException {
    final Case[] items = this.save(path, cases);
    final String content = this.makeJson(items);
    try {
      Path parent = path.getParent();
      if (parent != null) {
        Files.createDirectories(parent);
      }
      Files.write(path, content.getBytes(StandardCharsets.UTF_8));
    } catch (IOException ex) {
      throw new ToucaException("failed to create file %s: %s", path, ex.getMessage());
    }
  }

  /**
   * Submits all test results recorded so far to the Touca server.
   *
   * It is possible to call {@link #post} multiple times during runtime of the
   * regression test tool. Test cases already submitted to the server whose test
   * results have not changed, will not be resubmitted.
   *
   * It is also possible to add test results to a testcase after it is submitted
   * to the server. Any subsequent call to {@link #post} will resubmit the
   * modified test case.
   *
   * @throws ToucaException when called on the client that is not configured to
   *                        communicate with the Touca server.
   */
  public Post.Status post(final Post.Options opts) {
    if (!this.isConfigured() || this.options.offline) {
      throw new ToucaException("client is not configured to contact the server");
    }
    final byte[] content = this.serialize(this.cases.values().toArray(new Case[] {}));
    final Map<String, String> headers = new HashMap<>();
    if (opts.submitAsync) {
      headers.put("X-Touca-Submission-Mode", opts.submitAsync ? "async" : "sync");
    }
    final Transport.Response response = this.transport.postRequest(
        "/client/submit", "application/octet-stream", content, headers);
    if (response.code == HttpURLConnection.HTTP_NO_CONTENT) {
      return Post.Status.Sent;
    }
    if (response.code == HttpURLConnection.HTTP_OK) {
      return Post.parseResponse(response.content);
    }
    throw new ToucaException("Failed to submit test results.%s",
        response.code == HttpURLConnection.HTTP_BAD_REQUEST
            ? Post.parseError(response.content)
            : "");
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
   * @throws ToucaException when called on the client that is not configured to
   *                        communicate with the Touca server.
   */
  public void seal() {
    if (!this.isConfigured() || this.options.offline) {
      throw new ToucaException("client is not configured to contact the server");
    }
    final Transport.Response response = this.transport.postRequest(
        String.format("/batch/%s/%s/%s/seal", options.team, options.suite, options.version),
        "application/json", new byte[0]);
    if (response.code == HttpURLConnection.HTTP_FORBIDDEN) {
      throw new ToucaException("client is not authenticated");
    }
    if (response.code != HttpURLConnection.HTTP_NO_CONTENT) {
      throw new ToucaException("failed to seal this version: %d", response.code);
    }
  }

  private String getLastTestcase() {
    if (!isConfigured()) {
      return null;
    }
    if (options.concurrency) {
      return activeCase;
    }
    return threadMap.get(Thread.currentThread().getId());
  }

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

  private String makeJson(final Case[] testcases) {
    final Gson gson = new GsonBuilder().create();
    final JsonArray array = new JsonArray(testcases.length);
    for (final Case testcase : testcases) {
      array.add(testcase.json());
    }
    return gson.toJson(array);
  }

  private Case[] save(final Path path, final String[] cases) {
    if (cases == null || cases.length == 0) {
      return new HashSet<>(this.cases.values()).toArray(new Case[0]);
    }
    return this.cases.entrySet().stream()
        .filter(x -> Arrays.asList(cases).contains(x.getKey()))
        .map(Map.Entry::getValue).distinct().toArray(Case[]::new);
  }

  public Transport getTransport() {
    return this.transport;
  }
}
