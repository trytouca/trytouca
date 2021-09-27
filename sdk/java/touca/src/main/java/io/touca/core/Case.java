// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.AbstractMap.SimpleEntry;
import java.util.Map.Entry;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.google.flatbuffers.FlatBufferBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import io.touca.core.Schema.ResultType;

/**
 *
 */
public class Case {

  private String testCase;
  private String teamSlug;
  private String testSuite;
  private String version;
  private String builtAt;
  private Map<String, ResultEntry> results = new HashMap<String, ResultEntry>();
  private Map<String, Long> tics = new HashMap<String, Long>();
  private Map<String, Long> tocs = new HashMap<String, Long>();
  private static Map<ResultCategory, Integer> resultTypes =
      new HashMap<ResultCategory, Integer>() {
        {
          put(ResultCategory.Check, ResultType.Check);
          put(ResultCategory.Assert, ResultType.Assert);
        }
      };

  /**
   *
   */
  private static enum ResultCategory {
    Check, Assert
  }

  /**
   *
   */
  private static final class ResultEntry {
    public ToucaType value;
    public ResultCategory type;

    /**
     * Wraps a given data point for easier organization.
     *
     * @param value the object storing actual value of the captured variable
     * @param type the category that this entry belongs to
     */
    public ResultEntry(final ToucaType value, ResultCategory type) {
      this.value = value;
      this.type = type;
    }
  }

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
    this.testCase = testCase;
    this.teamSlug = team != null ? team : "unknown";
    this.testSuite = suite != null ? suite : "unknown";
    this.version = version != null ? version : "unknown";
    this.builtAt = LocalDateTime.now().toString();
  }

  /**
   * Logs a given value as a test result for the declared test case and
   * associates it with the specified key.
   * 
   * @param key name to be associated with the logged test result
   * @param value value to be logged as a test result
   */
  public void addResult(final String key, final ToucaType value) {
    this.results.put(key, new ResultEntry(value, ResultCategory.Check));
  }

  /**
   * Logs a given value as an assertion for the declared test case and
   * associates it with the specified key.
   * 
   * @param key name to be associated with the logged test result
   * @param value value to be logged as a test result
   */
  public void addAssertion(final String key, final ToucaType value) {
    this.results.put(key, new ResultEntry(value, ResultCategory.Assert));
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
      this.results.put(key, new ResultEntry(value, ResultCategory.Check));
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
      this.results.put(key, new ResultEntry(value, ResultCategory.Check));
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
    final JsonObject jsonMetadata = new JsonObject();
    jsonMetadata.addProperty("teamslug", teamSlug);
    jsonMetadata.addProperty("testsuite", testSuite);
    jsonMetadata.addProperty("version", version);
    jsonMetadata.addProperty("testcase", testCase);
    jsonMetadata.addProperty("builtAt", builtAt);

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
    output.add("metadata", jsonMetadata);
    output.add("results", jsonResults);
    output.add("assertions", jsonAssertions);
    output.add("metrics", jsonMetrics);
    return output;
  }

  /**
   * Serialize this instance using Touca's FlatBuffers schema
   * 
   * @return binary representation of this test case
   */
  public byte[] serialize() {
    final FlatBufferBuilder builder = new FlatBufferBuilder(1024);

    final Map<String, Integer> metadata = new HashMap<String, Integer>() {
      {
        put("teamslug", builder.createString(teamSlug));
        put("testsuite", builder.createString(testSuite));
        put("version", builder.createString(version));
        put("testcase", builder.createString(testCase));
        put("builtAt", builder.createString(builtAt));
      }
    };

    Schema.Metadata.startMetadata(builder);
    Schema.Metadata.addTeamslug(builder, metadata.get("teamslug"));
    Schema.Metadata.addTestsuite(builder, metadata.get("testsuite"));
    Schema.Metadata.addVersion(builder, metadata.get("version"));
    Schema.Metadata.addTestcase(builder, metadata.get("testcase"));
    Schema.Metadata.addBuiltAt(builder, metadata.get("builtAt"));
    final int fbsMetadata = Schema.Metadata.endMetadata(builder);

    final List<Integer> resultEntries = new ArrayList<Integer>(results.size());
    for (final Map.Entry<String, ResultEntry> entry : results.entrySet()) {
      final int fbsKey = builder.createString(entry.getKey());
      final int fbsValue = entry.getValue().value.serialize(builder);
      Schema.Result.startResult(builder);
      Schema.Result.addKey(builder, fbsKey);
      Schema.Result.addValue(builder, fbsValue);
      Schema.Result.addTyp(builder, resultTypes.get(entry.getValue().type));
      resultEntries.add(Schema.Result.endResult(builder));
    }
    final int fbsResultEntries = Schema.Results.createEntriesVector(builder,
        resultEntries.stream().mapToInt(x -> x).toArray());
    Schema.Results.startResults(builder);
    Schema.Results.addEntries(builder, fbsResultEntries);
    final int fbsResults = Schema.Results.endResults(builder);

    final List<SimpleEntry<String, ToucaType>> rMetrics = metrics();
    final List<Integer> metricEntries = new ArrayList<Integer>(rMetrics.size());
    for (final SimpleEntry<String, ToucaType> entry : rMetrics) {
      final int fbsKey = builder.createString(entry.getKey());
      final int fbsValue = entry.getValue().serialize(builder);
      Schema.Metric.startMetric(builder);
      Schema.Metric.addKey(builder, fbsKey);
      Schema.Metric.addValue(builder, fbsValue);
      metricEntries.add(Schema.Metric.endMetric(builder));
    }
    final int fbsMetricEntries = Schema.Metrics.createEntriesVector(builder,
        metricEntries.stream().mapToInt(x -> x).toArray());
    Schema.Metrics.startMetrics(builder);
    Schema.Metrics.addEntries(builder, fbsMetricEntries);
    final int fbsMetrics = Schema.Metrics.endMetrics(builder);

    Schema.Message.startMessage(builder);
    Schema.Message.addMetadata(builder, fbsMetadata);
    Schema.Message.addResults(builder, fbsResults);
    Schema.Message.addMetrics(builder, fbsMetrics);
    final int fbsMessage = Schema.Message.endMessage(builder);

    builder.finish(fbsMessage);
    return builder.sizedByteArray();
  }

  /**
   *
   */
  private List<SimpleEntry<String, ToucaType>> metrics() {
    final List<SimpleEntry<String, ToucaType>> metrics =
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
