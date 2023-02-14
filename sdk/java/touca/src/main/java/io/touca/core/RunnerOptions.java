// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import com.google.gson.Gson;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import java.lang.reflect.Type;
import java.util.function.Consumer;

/**
 * Configuration options supported by the built-in test runner.
 */
public final class RunnerOptions extends ClientOptions {
  /**
   * Store all the data points captured for each test case into a local file
   * in binary format. Touca binary archives can later be inspected using the
   * Touca CLI and submitted to a Touca server instance.
   */
  public Boolean saveBinary = false;

  /**
   * Store all the data points captured for each test case into a local file
   * in JSON format. Unlike Touca binary archives, these JSON files are only
   * helpful for manual inspection of the captured test results and are not
   * supported by the Touca server.
   */
  public Boolean saveJson = false;

  /**
   * Overwrite the locally generated test results for a given testcase if the
   * results directory already exists.
   */
  public Boolean overwriteResults = false;

  /**
   * Use ANSI colors when reporting the test progress in the standard output.
   */
  public Boolean coloredOutput = true;

  /**
   * Relative or full path to a configuration file to be loaded and applied
   * at runtime.
   */
  public String configFile;

  /**
   * Relative or full path to the directory in which Touca test results
   * are written, when the runner is configured to write them into the local
   * filesystem.
   */
  public String outputDirectory;

  /**
   * Limits the test to running the specified workflow as opposed to all the
   * registered workflows.
   */
  public String workflowFilter;

  /** The set of all registered workflows. */
  public WorkflowWrapper[] workflows;

  /**
   * Set of testcases to feed one by one to all the registered workflows.
   * When not provided, the test runner uses the set of testcases configured
   * for each workflow. If that set is empty, the test runner attempts to
   * retrieve and reuse the set of testcases submitted for the baseline
   * version of each workflow.
   */
  public String[] testcases;

  /** Root URL to Touca server web interface. */
  public String webUrl;

  /** Submits test results asynchronously if set. */
  public Boolean submitAsync = false;

  /**
   * Creates an instance without setting any configuration option.
   */
  public RunnerOptions() {
    super();
  }

  /**
   * Creates an instance with a callback function that lets you set a subset of
   * available configuration options.
   *
   * @param callback callback to set configuration options
   */
  public RunnerOptions(final Consumer<RunnerOptions> callback) {
    super();
    callback.accept(this);
  }

  /**
   * Copy configuration options from a given object.
   *
   * @param options object whose options should be copied
   */
  public void merge(final RunnerOptions options) {
    super.merge(options);
    merge(options.saveBinary, k -> saveBinary = k);
    merge(options.saveJson, k -> saveJson = k);
    merge(options.overwriteResults, k -> overwriteResults = k);
    merge(options.coloredOutput, k -> coloredOutput = k);
    merge(options.configFile, k -> configFile = k);
    merge(options.outputDirectory, k -> outputDirectory = k);
    merge(options.testcases, k -> testcases = k);
    merge(options.submitAsync, k -> submitAsync = k);
  }

  @Override
  public final String toString() {
    return new Gson().toJson(this);
  }

  /**
   * Parser for configuration file.
   */
  public static class Deserializer implements JsonDeserializer<RunnerOptions> {

    /**
     * Parses configuration options from a given string.
     *
     * @param json    json element to be deserialized
     * @param type    type of the json string
     * @param context context for deserialization
     * @return a new options instance that represents content of json string
     * @throws JsonParseException if it fails to parse string to activity object
     */
    @Override
    public RunnerOptions deserialize(final JsonElement json, final Type type,
        final JsonDeserializationContext context) throws JsonParseException {
      final JsonObject root = json.getAsJsonObject();
      if (!root.has("touca")) {
        return new RunnerOptions();
      }
      final JsonObject fileOptions = root.get("touca").getAsJsonObject();
      return new RunnerOptions(options -> {
        parseString(fileOptions, "api-key", k -> options.apiKey = k);
        parseString(fileOptions, "api-url", k -> options.apiUrl = k);
        parseString(fileOptions, "team", k -> options.team = k);
        parseString(fileOptions, "suite", k -> options.suite = k);
        parseString(fileOptions, "version", k -> options.version = k);
        parseBoolean(fileOptions, "offline", k -> options.offline = k);
        parseBoolean(fileOptions, "concurrency", k -> options.concurrency = k);
        parseBoolean(fileOptions, "no-reflection", k -> options.reflection = !k);
        parseBoolean(fileOptions, "save-as-binary", k -> options.saveBinary = k);
        parseBoolean(fileOptions, "save-as-json", k -> options.saveJson = k);
        parseBoolean(fileOptions, "overwrite-results", k -> options.overwriteResults = k);
        parseBoolean(fileOptions, "colored-output", k -> options.coloredOutput = k);
        parseString(fileOptions, "output-directory", k -> options.outputDirectory = k);
        parseBoolean(fileOptions, "submit_async", k -> options.submitAsync = k);
      });
    }

    private void parseString(final JsonObject obj, final String key,
        final Consumer<String> field) {
      if (!obj.has(key)) {
        return;
      }
      if (!obj.get(key).isJsonPrimitive()) {
        throw new JsonParseException("expected primitive");
      }
      if (!obj.get(key).getAsJsonPrimitive().isString()) {
        throw new JsonParseException("expected string");
      }
      field.accept(obj.get(key).getAsString());
    }

    private void parseBoolean(final JsonObject obj, final String key,
        final Consumer<Boolean> field) throws JsonParseException {
      if (!obj.has(key)) {
        return;
      }
      if (!obj.get(key).isJsonPrimitive()) {
        throw new JsonParseException("expected primitive");
      }
      if (!obj.get(key).getAsJsonPrimitive().isBoolean()) {
        throw new JsonParseException("expected boolean");
      }
      field.accept(obj.get(key).getAsBoolean());
    }
  }

}
