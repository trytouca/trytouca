// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.devkit;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import io.touca.devkit.ResultEntry.ResultCategory;
import io.touca.types.ArrayType;
import io.touca.types.ToucaType;
import io.touca.types.NumberType;

public class Case {

  public static final class Metadata {
    public String testCase;
    public String teamSlug;
    public String testSuite;
    public String version;
    private String builtAt;

    public Metadata(final String testCase, final String teamSlug,
        final String testSuite, final String version) {
      this.testCase = testCase;
      this.teamSlug = teamSlug;
      this.testSuite = testSuite;
      this.version = version;
      this.builtAt = LocalDateTime.now().toString();
    }
  }

  private Metadata meta;
  private Map<String, ResultEntry> results = new HashMap<String, ResultEntry>();
  private Map<String, Long> tics = new HashMap<String, Long>();
  private Map<String, Long> tocs = new HashMap<String, Long>();

  /**
   * Creates a Test Case instance that stores all the test results and
   * performance benchmarks captured for a given test case.
   *
   * @param metadata metadata for this test case
   */
  public Case(final Metadata metadata) {
    this.meta = metadata;
  }

  /**
   * Logs a given value as a test result for the declared test case and
   * associates it with the specified key.
   * 
   * @param key name to be associated with the logged test result
   * @param value value to be logged as a test result
   */
  public void addResult(final String key, final ToucaType value) {
    this.results.put(key,
        new ResultEntry(value, ResultEntry.ResultCategory.Check));
  }

  /**
   * Logs a given value as an assertion for the declared test case and
   * associates it with the specified key.
   * 
   * @param key name to be associated with the logged test result
   * @param value value to be logged as a test result
   */
  public void addAssertion(final String key, final ToucaType value) {
    this.results.put(key,
        new ResultEntry(value, ResultEntry.ResultCategory.Assert));
  }

  /**
   * Adds a given value to a list of results for the declared test case which is
   * associated with the specified key.
   *
   * @param key name to be associated with the logged test result
   * @param element element to be appended to the array
   */
  public void addArrayElement(final String key, final ToucaType element) {
    if (!this.results.containsKey(key)) {
      ArrayType value = new ArrayType();
      value.add(element);
      this.results.put(key,
          new ResultEntry(value, ResultEntry.ResultCategory.Check));
      return;
    }
    ResultEntry entry = this.results.get(key);
    if (entry.type != ResultCategory.Check
        || entry.value.type() != ToucaType.Types.Array) {
      throw new IllegalArgumentException("specified key has a different type");
    }
    ArrayType value = (ArrayType) entry.value;
    value.add(element);
    this.results.get(key).value = value;
  }

  /**
   * Increments value of key every time it is executed. creates the key with
   * initial value of one if it does not exist.
   *
   * @param key name to be associated with the logged test result
   */
  public void addHitCount(final String key) {
    if (!this.results.containsKey(key)) {
      NumberType value = new NumberType(1);
      this.results.put(key,
          new ResultEntry(value, ResultEntry.ResultCategory.Check));
      return;
    }
    ResultEntry entry = this.results.get(key);
    if (entry.value.type() != ToucaType.Types.Number) {
      throw new IllegalArgumentException(
          "specified key is associated with a result of a different type");
    }
    NumberType value = (NumberType) entry.value;
    value.increment();
  }

  /**
   * Adds an already obtained measurements to the list of captured performance
   * benchmarks.
   *
   * Useful for logging a metric that is measured without using this SDK.
   *
   * @param key name to be associated with this performance benchmark
   * @param milliseconds duration of this measurement in milliseconds
   */
  public void addMetric(final String key, final Long milliseconds) {
    long timePoint = Instant.now().toEpochMilli();
    this.tics.put(key, timePoint);
    this.tocs.put(key, timePoint + milliseconds);
  }

  /**
   * Starts timing an event with the specified name.
   *
   * Measurement of the event is only complete when function {@link stopTimer}
   * is later called for the specified name.
   *
   * @param key name to be associated with the performance metric
   */
  public void startTimer(final String key) {
    this.tics.put(key, Instant.now().toEpochMilli());
  }

  /**
   * Stops timing an event with the specified name.
   * 
   * Expects function {@link startTimer} to have been called previously with the
   * specified name.
   * 
   * @param key name to be associated with the performance metric
   */
  public void stopTimer(final String key) {
    if (tics.containsKey(key)) {
      this.tocs.put(key, Instant.now().toEpochMilli());
    }
  }
}
