// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import java.util.function.Consumer;

/**
 * Configuration options for the Touca test framework.
 */
public final class RunnerOptions extends ClientOptions {
  public String[] testcases;
  public String testcaseFile;
  public Boolean saveAsBinary;
  public Boolean saveAsJson;
  public Boolean overwrite;
  public String outputDirectory;
  public Boolean coloredOutput;
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
    saveAsBinary = incoming.saveAsBinary;
    saveAsJson = incoming.saveAsJson;
    overwrite = incoming.overwrite;
    outputDirectory = incoming.outputDirectory;
    coloredOutput = incoming.coloredOutput;
  }

}
