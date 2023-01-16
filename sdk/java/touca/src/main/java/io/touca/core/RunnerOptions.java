// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

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
  public Boolean saveBinary;

  /**
   * Store all the data points captured for each test case into a local file
   * in JSON format. Unlike Touca binary archives, these JSON files are only
   * helpful for manual inspection of the captured test results and are not
   * supported by the Touca server.
   */
  public Boolean saveJson;

  /**
   * Overwrite the locally generated test results for a given testcase if the
   * results directory already exists.
   */
  public Boolean overwriteResults;

  /**
   * Use ANSI colors when reporting the test progress in the standard output.
   */
  public Boolean coloredOutput;

  /**
   * Relative or full path to the directory in which Touca test results
   * are written, when the runner is configured to write them into the local
   * filesystem.
   */
  public String outputDirectory;

  /**
   * Set of testcases to feed one by one to all the registered workflows.
   * When not provided, the test runner uses the set of testcases configured
   * for each workflow. If that set is empty, the test runner attempts to
   * retrieve and reuse the set of testcases submitted for the baseline
   * version of each workflow.
   */
  public String[] testcases;

  public String testcaseFile;
  public Boolean printHelp;
  public Boolean printVersion;

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
   * Applies configuration options of a given instance to this instance.
   *
   * @param incoming configuration options to apply to this instance
   */
  public void apply(final RunnerOptions incoming) {
    super.apply(incoming);
    printHelp = incoming.printHelp;
    printVersion = incoming.printVersion;
    testcases = incoming.testcases;
    testcaseFile = incoming.testcaseFile;
    saveBinary = incoming.saveBinary;
    saveJson = incoming.saveJson;
    overwriteResults = incoming.overwriteResults;
    outputDirectory = incoming.outputDirectory;
    coloredOutput = incoming.coloredOutput;
  }

}
