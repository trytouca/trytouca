// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import java.util.function.Consumer;

/**
 *
 */
public final class RunnerOptions extends Options {
  public String[] testcases;
  public String testcaseFile;
  public Boolean saveAsBinary;
  public Boolean saveAsJson;
  public Boolean overwrite;
  public String outputDirectory;

  public RunnerOptions() {}

  public RunnerOptions(Consumer<RunnerOptions> consumer) {
    consumer.accept(this);
  }

  public void apply(final RunnerOptions options) {
    super.apply(options);
    testcases = options.testcases;
    testcaseFile = options.testcaseFile;
    saveAsBinary = options.saveAsBinary;
    saveAsJson = options.saveAsJson;
    overwrite = options.overwrite;
    outputDirectory = options.outputDirectory;
  }

}
