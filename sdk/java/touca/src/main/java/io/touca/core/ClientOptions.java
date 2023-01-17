// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import com.google.gson.Gson;
import java.util.function.Consumer;

/**
 * Configuration options supported by the low-level Core API library.
 *
 * Use the `Touca.configure` function for setting these options
 * programmatically. When using the test runner, you can set any subset of these
 * options without hard-coding the values using a variety of methods such as
 * command-line arguments, environment variables, JSON-formatted configuration
 * file, Touca CLI configuration profiles, etc. See `Touca.RunnerOptions` to
 * learn more.
 */
public class ClientOptions {
  /**
   * API Key issued by the Touca server that identifies who is submitting the
   * test results.
   *
   * Since the value should be treated as a secret, we strongly recommend
   * that you do not hard-code this option and pass it via other methods such
   * as setting the environment variable `TOUCA_API_KEY` (ideal for the CI
   * environment) or using the Touca CLI to set this option in your
   * configuration profile to be automatically loaded at runtime (ideal for
   * local development).
   **/
  public String apiKey;

  /**
   * URL to Touca server API.
   *
   * Defaults to `https://api.touca.io` when `api_key` is specified. If you are
   * self-hosting the Touca server, we encourage using the Touca CLI to set this
   * option in your configuration profile to be automatically loaded at runtime.
   **/
  public String apiUrl;

  /**
   * Slug of your team on the Touca server.
   *
   * Since it is unlikely for your team slug to change, we encourage using the
   * Touca CLI to set this option in your configuration profile to be
   * automatically loaded at runtime.
   **/
  public String team;

  /**
   * Name of the test suite to submit test results to.
   *
   * When using the test runner, value of the first parameter to
   * `touca::workflow` is used by default.
   */
  public String suite;

  /**
   * Version of your code under test.
   *
   * Since this version is expected to change, we encourage setting option via
   * the environment variable `TOUCA_TEST_VERSION` or passing it as a
   * command-line option.
   *
   * When using the test runner, you may also skip setting this option to let
   * the test runner query the Touca server for the most recent version of your
   * suite and use a minor version increment.
   */
  public String version;

  /**
   * Disables all communications with the Touca server.
   *
   * Determines whether client should connect with the Touca server during
   * the configuration. Will be set to `false` when neither `api_url` nor
   * `api_key` are set.
   */
  public Boolean offline = false;

  /**
   * Isolates the testcase scope to calling thread.
   *
   * Determines whether the scope of test case declaration is bound to
   * the thread performing the declaration, or covers all other threads.
   * Defaults to `true`.
   *
   * If set to `true`, when a thread calls `touca::declare_testcase`, all
   * other threads also have their most recent test case changed to the
   * newly declared test case and any subsequent call to data capturing
   * functions such as `touca::check` will affect the newly declared test case.
   */
  public Boolean concurrency = true;

  /**
   * Uses reflection to serialize custom user-defined types.
   */
  public Boolean reflection = true;

  /**
   * Creates an Options instance with no configuration options which, when
   * passed to the Client, would configure the Client with minimum
   * functionality.
   */
  public ClientOptions() {
    // intentionally left empty
  }

  /**
   * Creates an Options instance with a callback function that lets you set a
   * subset of available configuration options.
   *
   * @param callback callback to set configurations options
   */
  public ClientOptions(final Consumer<ClientOptions> callback) {
    callback.accept(this);
  }

  protected <T> void merge(final T value, final Consumer<T> copy) {
    if (value != null) {
      copy.accept(value);
    }
  }

  /**
   * Copies the configuration options of a given instance into this instance.
   *
   * @param options instance whose options should be copied
   */
  public void merge(final ClientOptions options) {
    merge(options.apiKey, k -> apiKey = k);
    merge(options.apiUrl, k -> apiUrl = k);
    merge(options.team, k -> team = k);
    merge(options.suite, k -> suite = k);
    merge(options.version, k -> version = k);
    merge(options.offline, k -> offline = k);
    merge(options.concurrency, k -> concurrency = k);
    merge(options.reflection, k -> reflection = k);
  }

  @Override
  public String toString() {
    return new Gson().toJson(this);
  }

}
