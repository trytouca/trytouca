// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import io.touca.exceptions.ConfigException;
import java.io.File;
import java.io.IOException;
import java.lang.reflect.Type;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

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
  public Boolean offline;

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
  public Boolean concurrency;

  public String file;
  public Boolean noReflection;

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

  /**
   * Applies configuration options of a given instance to this instance.
   *
   * @param incoming configuration options to apply to this instance
   */
  public void apply(final ClientOptions incoming) {
    incoming.applyConfigFile();
    this.merge(incoming);
    this.applyEnvironmentVariables();
    this.reformatParameters();
    this.validateOptions();
  }

  /**
   * Provides a copy of the configuration options specified for this instance in
   * form of map.
   *
   * @return a map that contains a copy of all configuration options specified
   *         for this instance.
   */
  public final Map<String, String> entrySet() {
    final Map<String, String> entries = new HashMap<>();
    final BiConsumer<String, String> insertString = (name, value) -> {
      if (value != null) {
        entries.put(name, value);
      }
    };
    final BiConsumer<String, Boolean> insertBoolean = (name, value) -> {
      if (value != null) {
        entries.put(name, value.toString());
      }
    };
    insertString.accept("apiKey", this.apiKey);
    insertString.accept("apiUrl", this.apiUrl);
    insertString.accept("team", this.team);
    insertString.accept("suite", this.suite);
    insertString.accept("version", this.version);
    insertString.accept("file", this.file);
    insertBoolean.accept("concurrency", this.concurrency);
    insertBoolean.accept("offline", this.offline);
    insertBoolean.accept("noReflection", this.noReflection);
    return entries;
  }

  /**
   * Compares the set of configuration options stored in a given instance with
   * the set of configuration options stored in this instance.
   *
   * @param incoming configuration options to compare
   * @return list of configuration options that are available in the given
   *         instance but are not set in this instance.
   */
  public final Map<String, String> diff(final ClientOptions incoming) {
    final Map<String, String> output = new HashMap<>();
    final Map<String, String> base = this.entrySet();
    final Map<String, String> head = incoming.entrySet();
    final String[] fields = { "apiUrl", "apiKey", "team", "suite", "version",
        "file", "concurrency", "offline" };
    for (final String field : fields) {
      if (!head.containsKey(field)) {
        continue;
      }
      if (!base.containsKey(field)
          || !base.get(field).equals(head.get(field))) {
        output.put(field, head.get(field));
      }
    }
    return output;
  }

  private void merge(final ClientOptions incoming) {
    if (incoming.apiKey != null) {
      this.apiKey = incoming.apiKey;
    }
    if (incoming.apiUrl != null) {
      this.apiUrl = incoming.apiUrl;
    }
    if (incoming.team != null) {
      this.team = incoming.team;
    }
    if (incoming.suite != null) {
      this.suite = incoming.suite;
    }
    if (incoming.version != null) {
      this.version = incoming.version;
    }
    if (incoming.file != null) {
      this.file = incoming.file;
    }
    if (incoming.offline != null) {
      this.offline = incoming.offline;
    }
    if (incoming.concurrency != null) {
      this.concurrency = incoming.concurrency;
    }
    if (incoming.noReflection != null) {
      this.noReflection = incoming.noReflection;
    }
  }

  /**
   * Applies the configuration options specified in a given map to this
   * instance.
   *
   * @param incoming configuration options to apply to this instance
   */
  public void mergeMap(final Map<String, String> incoming) {
    if (incoming.containsKey("apiKey")) {
      this.apiKey = incoming.get("apiKey");
    }
    if (incoming.containsKey("apiUrl")) {
      this.apiUrl = incoming.get("apiUrl");
    }
    if (incoming.containsKey("team")) {
      this.team = incoming.get("team");
    }
    if (incoming.containsKey("suite")) {
      this.suite = incoming.get("suite");
    }
    if (incoming.containsKey("version")) {
      this.version = incoming.get("version");
    }
    if (incoming.containsKey("offline")) {
      this.offline = Boolean.parseBoolean(incoming.get("offline"));
    }
    if (incoming.containsKey("concurrency")) {
      this.concurrency = Boolean.parseBoolean(incoming.get("concurrency"));
    }
    if (incoming.containsKey("noReflection")) {
      this.noReflection = Boolean.parseBoolean(incoming.get("noReflection"));
    }
  }

  private void applyConfigFile() {
    final ClientOptions incoming = this;
    if (incoming.file == null) {
      return;
    }
    final File configFile = new File(incoming.file);
    if (!configFile.exists() || !configFile.isFile()) {
      throw new ConfigException("config file not found");
    }
    final Gson gson = new GsonBuilder()
        .registerTypeAdapter(ClientOptions.class, new ClientOptions.Deserializer())
        .create();
    final String content;
    try {
      final byte[] encoded = Files.readAllBytes(configFile.toPath());
      content = new String(encoded, StandardCharsets.UTF_8);
      incoming.merge(gson.fromJson(content, ClientOptions.class));
    } catch (IOException ex) {
      throw new ConfigException("failed to read config file");
    } catch (JsonParseException ex) {
      throw new ConfigException("failed to parse config file");
    }
  }

  private void applyEnvironmentVariables() {
    final ClientOptions existing = this;
    final Map<String, Consumer<String>> options = new HashMap<>();
    options.put("TOUCA_API_KEY", k -> existing.apiKey = k);
    options.put("TOUCA_API_URL", k -> existing.apiUrl = k);
    options.put("TOUCA_TEST_VERSION", k -> existing.version = k);
    for (final Map.Entry<String, Consumer<String>> entry : options.entrySet()) {
      final String env = System.getenv(entry.getKey());
      if (env == null || env.isEmpty()) {
        continue;
      }
      entry.getValue().accept(env);
    }
  }

  private void reformatParameters() {
    final ClientOptions existing = this;
    if (existing.concurrency == null) {
      existing.concurrency = true;
    }
    if (existing.noReflection == null) {
      existing.noReflection = false;
    }
    if (existing.apiUrl == null) {
      return;
    }
    final String[] segments;
    try {
      if (!existing.apiUrl.startsWith("http://")
          && !existing.apiUrl.startsWith("https://")) {
        existing.apiUrl = "https://" + existing.apiUrl;
      }
      final URL url = new URL(existing.apiUrl);
      segments = url.getPath().split("/@/");
      final String urlPath = Arrays.stream(segments[0].split("/"))
          .filter(x -> !x.isEmpty()).collect(Collectors.joining("/"));
      final URI uri = new URI(url.getProtocol(), url.getAuthority(),
          urlPath.isEmpty() ? urlPath : "/" + urlPath, null, null);
      existing.apiUrl = uri.toURL().toString();
    } catch (MalformedURLException | URISyntaxException ex) {
      throw new ConfigException(
          String.format("api url is invalid: %s", ex.getMessage()));
    }
    if (1 == segments.length) {
      return;
    }
    reformatSlugs(existing, segments[1]);
  }

  private static void reformatSlugs(final ClientOptions existing, final String path) {
    final String[] givenSlugs = Arrays.stream(path.split("/"))
        .filter(x -> !x.isEmpty()).toArray(String[]::new);
    final SlugEntry[] slugs = { new SlugEntry("team", o -> o.team, (o, k) -> o.team = k),
        new SlugEntry("suite", o -> o.suite, (o, k) -> o.suite = k),
        new SlugEntry("version", o -> o.version, (o, k) -> o.version = k) };
    for (int i = 0; i < givenSlugs.length; i++) {
      final String actual = slugs[i].getter.apply(existing);
      if (actual != null && !actual.equals(givenSlugs[i])) {
        throw new ConfigException(
            String.format("option \"%s\" is in conflict with provided api url",
                slugs[i].name));
      }
      slugs[i].setter.accept(existing, givenSlugs[i]);
    }
  }

  private static final class SlugEntry {
    public String name;
    public Function<ClientOptions, String> getter;
    public BiConsumer<ClientOptions, String> setter;

    public SlugEntry(final String name, final Function<ClientOptions, String> getter,
        final BiConsumer<ClientOptions, String> setter) {
      this.name = name;
      this.getter = getter;
      this.setter = setter;
    }
  }

  private void validateOptions() {
    final ClientOptions existing = this;
    final Map<String, Boolean> expectedKeys = new HashMap<>();
    expectedKeys.put("team", existing.team != null);
    expectedKeys.put("suite", existing.suite != null);
    expectedKeys.put("version", existing.version != null);
    final boolean hasHandshake = existing.offline == null || existing.offline;
    if (hasHandshake && (existing.apiKey != null || existing.apiUrl != null)) {
      expectedKeys.put("apiKey", existing.apiKey != null);
      expectedKeys.put("apiUrl", existing.apiUrl != null);
    }
    final List<String> setKeys = filterKeys(expectedKeys, true);
    final List<String> missingKeys = filterKeys(expectedKeys, false);
    if (setKeys.isEmpty() || missingKeys.isEmpty()) {
      return;
    }
    throw new ConfigException(String.format("missing required options: %s",
        String.join(", ", missingKeys)));
  }

  private static List<String> filterKeys(final Map<String, Boolean> keys,
      final boolean status) {
    return keys.entrySet().stream().filter(entry -> {
      return entry.getValue() == status;
    }).map(entry -> {
      return entry.getKey();
    }).collect(Collectors.toList());
  }

  /**
   * Parser for configuration file.
   */
  public static class Deserializer implements JsonDeserializer<ClientOptions> {

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
    public ClientOptions deserialize(final JsonElement json, final Type type,
        final JsonDeserializationContext context) throws JsonParseException {
      final JsonObject root = json.getAsJsonObject();
      if (!root.has("touca")) {
        return new ClientOptions();
      }
      final JsonObject fileOptions = root.get("touca").getAsJsonObject();
      return new ClientOptions(options -> {
        updateStringField(fileOptions, "api_key", k -> options.apiKey = k);
        updateStringField(fileOptions, "api_url", k -> options.apiUrl = k);
        updateStringField(fileOptions, "team", k -> options.team = k);
        updateStringField(fileOptions, "suite", k -> options.suite = k);
        updateStringField(fileOptions, "version", k -> options.version = k);
        updateBooleanField(fileOptions, "offline", k -> options.offline = k);
        updateBooleanField(fileOptions, "concurrency",
            k -> options.concurrency = k);
        updateBooleanField(fileOptions, "noReflection",
            k -> options.noReflection = k);
      });
    }

    private void updateStringField(final JsonObject obj, final String key,
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

    private void updateBooleanField(final JsonObject obj, final String key,
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
