// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.devkit;

import java.time.Instant;
import java.util.AbstractMap.SimpleEntry;
import java.util.Map.Entry;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import io.touca.devkit.ResultEntry.ResultCategory;
import io.touca.types.ArrayType;
import io.touca.types.ToucaType;
import io.touca.types.IntegerType;

public class Case {
  private CaseMetadata meta;
  private Map<String, ResultEntry> results = new HashMap<String, ResultEntry>();
  private Map<String, Long> tics = new HashMap<String, Long>();
  private Map<String, Long> tocs = new HashMap<String, Long>();

  /**
   * Creates a Test Case instance that stores all the test results and
   * performance benchmarks captured for a given test case.
   *
   * @param testCase unique name for this test case
   * @param team unique slug for this team
   * @param suite unique slug for this suite
   * @param version version of code under test
   */
  public Case(final String testCase, final String team, final String suite,
      final String version) {
    this.meta = new CaseMetadata(testCase, team, suite, version);
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
      IntegerType value = new IntegerType(1l);
      this.results.put(key,
          new ResultEntry(value, ResultEntry.ResultCategory.Check));
      return;
    }
    ResultEntry entry = this.results.get(key);
    if (entry.value.type() != ToucaType.Types.Number) {
      throw new IllegalArgumentException(
          "specified key is associated with a result of a different type");
    }
    IntegerType value = (IntegerType) entry.value;
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

  /**
   * Reports stored content for JSON serialization
   * 
   * @return a json element that to be serialized by the caller
   */
  public final JsonElement json() {
    final JsonArray jsonResults = new JsonArray();
    final JsonArray jsonAssertions = new JsonArray();
    for (Map.Entry<String, ResultEntry> result : results.entrySet()) {
      final ResultEntry value = result.getValue();
      final JsonObject obj = new JsonObject();
      obj.addProperty("key", result.getKey());
      obj.add("value", value.value.json());
      switch (value.type) {
        case Assert:
          jsonAssertions.add(obj);
          break;
        default:
          jsonResults.add(obj);
      }
    }
    final JsonArray jsonMetrics = new JsonArray();
    for (Entry<String, ToucaType> entry : metrics()) {
      final JsonObject jsonMetric = new JsonObject();
      jsonMetric.addProperty("key", entry.getKey());
      jsonMetric.add("value", entry.getValue().json());
      jsonMetrics.add(jsonMetric);
    }
    final JsonObject output = new JsonObject();
    output.add("metadata", meta.json());
    output.add("results", jsonResults);
    output.add("assertions", jsonAssertions);
    output.add("metrics", jsonMetrics);
    return output;
  }

  /**
   *
   */
  private List<SimpleEntry<String, ToucaType>> metrics() {
    List<SimpleEntry<String, ToucaType>> metrics =
        new ArrayList<SimpleEntry<String, ToucaType>>();
    for (Map.Entry<String, Long> entry : tics.entrySet()) {
      final String key = entry.getKey();
      final Long tic = entry.getValue();
      if (!tocs.containsKey(key)) {
        continue;
      }
      final Long toc = tocs.get(key);
      final IntegerType diff = new IntegerType(toc - tic);
      metrics.add(new SimpleEntry<String, ToucaType>(key, diff));
    }
    return metrics;
  }
}
