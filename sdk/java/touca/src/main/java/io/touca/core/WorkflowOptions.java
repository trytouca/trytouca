// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import java.util.function.Consumer;

/**
 * Configuration options that can be set for individual test workflows when
 * calling the high-level API function `Touca.workflow()`.
 *
 * Setting these parameters is optional. The test runner has built-in mechanism
 * to attempt to find the appropriate value for each option based on the overall
 * configuration options of the overall test.
 */
public class WorkflowOptions {
  /**
   * Version of the code under test. When this parameter is not set, and is not
   * otherwise specified when running the test, the test runner queries the
   * Touca server to find the most recent submitted version for this suite and
   * uses a minor increment of that version.
   */
  public String version;

  /**
   * List of test cases to be given one by one to the test workflow. When this
   * parameter is not set, and is not otherwise specified when running the test,
   * the test runner fetches and reuses the list of submitted test cases for the
   * baseline version of this suite.
   */
  public String[] testcases;

  public WorkflowOptions() {
    // intentionally left empty
  }

  public WorkflowOptions(final Consumer<WorkflowOptions> callback) {
    callback.accept(this);
  }
}
