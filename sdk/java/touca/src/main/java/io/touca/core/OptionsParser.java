// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.HelpFormatter;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.ParseException;
import org.apache.commons.configuration2.INIConfiguration;
import org.apache.commons.configuration2.SubnodeConfiguration;
import org.apache.commons.configuration2.ex.ConfigurationException;

public class OptionsParser {

  private static void applyEnvironmentVariables(final ClientOptions options) {
    final Map<String, Consumer<String>> variables = new HashMap<>();
    variables.put("TOUCA_API_KEY", k -> options.apiKey = k);
    variables.put("TOUCA_API_URL", k -> options.apiUrl = k);
    variables.put("TOUCA_TEST_VERSION", k -> options.version = k);
    for (final Map.Entry<String, Consumer<String>> entry : variables.entrySet()) {
      final String env = System.getenv(entry.getKey());
      if (env != null && !env.isEmpty()) {
        entry.getValue().accept(env);
      }
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

  private static void applyApiUrl(final ClientOptions options) {
    if (options.apiUrl == null) {
      return;
    }
    final String[] segments;
    try {
      if (!options.apiUrl.startsWith("http://")
          && !options.apiUrl.startsWith("https://")) {
        options.apiUrl = "https://" + options.apiUrl;
      }
      final URL url = new URL(options.apiUrl);
      segments = url.getPath().split("/@/");
      final String urlPath = Arrays.stream(segments[0].split("/"))
          .filter(x -> !x.isEmpty()).collect(Collectors.joining("/"));
      final URI uri = new URI(url.getProtocol(), url.getAuthority(),
          urlPath.isEmpty() ? urlPath : "/" + urlPath, null, null);
      options.apiUrl = uri.toURL().toString();
    } catch (MalformedURLException | URISyntaxException ex) {
      throw new ToucaException("api url is invalid: %s", ex.getMessage());
    }
    if (1 == segments.length) {
      return;
    }
    final String[] givenSlugs = Arrays.stream(segments[1].split("/"))
        .filter(x -> !x.isEmpty()).toArray(String[]::new);
    final SlugEntry[] slugs = { new SlugEntry("team", o -> o.team, (o, k) -> o.team = k),
        new SlugEntry("suite", o -> o.suite, (o, k) -> o.suite = k),
        new SlugEntry("version", o -> o.version, (o, k) -> o.version = k) };
    for (int i = 0; i < givenSlugs.length; i++) {
      final String actual = slugs[i].getter.apply(options);
      if (actual != null && !actual.equals(givenSlugs[i])) {
        throw new ToucaException(
            "option \"%s\" is in conflict with provided api url", slugs[i].name);
      }
      slugs[i].setter.accept(options, givenSlugs[i]);
    }
  }

  private static void applyCoreOptions(final ClientOptions options) {
    if (options.offline == false) {
      options.offline = options.apiKey == null && options.apiUrl == null;
    }
    if (options.apiKey != null && options.apiUrl == null) {
      options.apiUrl = "https://api.touca.io";
    }
  }

  /**
   * Performs handshake with the server and validates API Key if configured to do
   * so.
   *
   * @param options   application configuration options
   * @param transport transport for making http requests
   */
  private static void authenticate(final ClientOptions options, final Transport transport) {
    if (options.apiKey != null && options.apiUrl != null
        && !options.offline && !options.apiKey.isEmpty() && !options.apiUrl.isEmpty()) {
      transport.configure(options.apiUrl, options.apiKey);
    }
  }

  private static boolean validateCoreOptions(final ClientOptions options) {
    return false;
  }

  public static boolean updateCoreOptions(
      final ClientOptions options, final Transport transport) {
    OptionsParser.applyEnvironmentVariables(options);
    OptionsParser.applyApiUrl(options);
    OptionsParser.applyCoreOptions(options);
    OptionsParser.authenticate(options, transport);
    return OptionsParser.validateCoreOptions(options);
  }

  private static Options buildOptions() {
    final Options options = new Options();
    options.addOption(null, "api-key", true,
        "API Key issued by the Touca server");
    options.addOption(null, "api-url", true,
        "API URL issued by the Touca server");
    options.addOption(null, "revision", true, "Version of the code under test");
    options.addOption(null, "suite", true,
        "Slug of team to which test results belong");
    options.addOption(null, "team", true,
        "Slug of team to which test results belong");
    options.addOption(null, "config-file", true,
        "Path to a configuration file");
    options.addOption(Option.builder().longOpt("testcase").type(String[].class)
        .hasArg(true).numberOfArgs(Option.UNLIMITED_VALUES)
        .desc("Single testcase to feed to the workflow").build());
    options.addOption(Option.builder().longOpt("save-as-binary")
        .type(Boolean.class).optionalArg(true).numberOfArgs(1)
        .desc("Save a copy of test results on the filesystem in binary format")
        .build());
    options.addOption(Option.builder().longOpt("save-as-json")
        .type(Boolean.class).optionalArg(true).numberOfArgs(1)
        .desc("Save a copy of test results on the filesystem in JSON format")
        .build());
    options.addOption(Option.builder().longOpt("overwrite").type(Boolean.class)
        .optionalArg(true).numberOfArgs(1)
        .desc("Overwrite result directory for testcase if it already exists")
        .build());
    options.addOption(null, "output-directory", true,
        "Path to a local directory to store result files");
    options.addOption(Option.builder().longOpt("offline").type(Boolean.class)
        .optionalArg(true).numberOfArgs(1)
        .desc("Disables all communications with the Touca server").build());
    options.addOption(Option.builder().longOpt("colored-output")
        .type(Boolean.class).optionalArg(true).numberOfArgs(1)
        .desc("Use color in standard output").build());
    options.addOption(Option.builder().longOpt("no-reflection")
        .type(Boolean.class).optionalArg(true).numberOfArgs(1)
        .desc("Requires custom serializers for custom data types").build());
    options.addOption(Option.builder().longOpt("version")
        .desc("Print Touca SDK version").build());
    options.addOption(Option.builder().longOpt("help")
        .desc("Print this help message").build());
    return options;
  }

  /**
   * Parses command line arguments for configuration parameters for the built-in
   * test runner.
   *
   * @param mainArgs command-line arguments provided to the application
   * @param options  application configuration options to be updated
   */
  private static void applyCliArguments(final String[] mainArgs, final RunnerOptions options) {
    final CommandLineParser parser = new DefaultParser();
    try {
      final CommandLine cmd = parser.parse(buildOptions(), mainArgs);

      final BiConsumer<Consumer<Boolean>, String> parseBoolean = (final Consumer<Boolean> consumer,
          final String key) -> {
        if (cmd.hasOption(key)) {
          consumer.accept(Boolean.parseBoolean(
              cmd.getOptionValue(key, "true")));
        }
      };
      final BiConsumer<Consumer<String>, String> parseString = (final Consumer<String> consumer,
          final String key) -> {
        if (cmd.hasOption(key)) {
          consumer.accept(cmd.getOptionValue(key));
        }
      };

      parseString.accept(x -> options.apiKey = x, "api-key");
      parseString.accept(x -> options.apiUrl = x, "api-url");
      parseString.accept(x -> options.team = x, "team");
      parseString.accept(x -> options.suite = x, "suite");
      parseString.accept(x -> options.version = x, "revision");
      parseBoolean.accept(x -> options.offline = x, "offline");
      parseBoolean.accept(x -> options.concurrency = x, "concurrency");
      parseBoolean.accept(x -> options.reflection = !x, "no-reflection");
      parseBoolean.accept(x -> options.saveBinary = x, "save-as-binary");
      parseBoolean.accept(x -> options.saveJson = x, "save-as-json");
      parseBoolean.accept(x -> options.overwriteResults = x, "overwrite");
      parseBoolean.accept(x -> options.coloredOutput = x, "colored-output");
      parseString.accept(x -> options.configFile = x, "config-file");
      parseString.accept(x -> options.outputDirectory = x, "output-directory");
      if (cmd.hasOption("testcase")) {
        options.testcases = cmd.getOptionValues("testcase");
      }
      if (cmd.hasOption("version")) {
        throw new GracefulExitException("Touca Java SDK - v1.6.1");
      }
      if (cmd.hasOption("help")) {
        HelpFormatter formatter = new HelpFormatter();
        StringWriter output = new StringWriter();
        PrintWriter writer = new PrintWriter(output);
        formatter.printHelp(
            writer, HelpFormatter.DEFAULT_WIDTH, mainArgs[0], "\nTouca Test Runner\n\n",
            buildOptions(), HelpFormatter.DEFAULT_LEFT_PAD, HelpFormatter.DEFAULT_DESC_PAD,
            "\nSee https://touca.io/docs for more information\n", true);
        writer.flush();
        throw new GracefulExitException(output.toString());
      }
    } catch (final ParseException ex) {
      throw new ToucaException(ex.getMessage());
    }
  }

  private static void applyConfigFile(final RunnerOptions options) {
    if (options.configFile == null || options.configFile.isEmpty()) {
      return;
    }
    final File configFile = Paths.get(options.configFile).toFile();
    if (!configFile.exists() || !configFile.isFile()) {
      throw new ToucaException("config file not found");
    }
    try {
      final byte[] encoded = Files.readAllBytes(configFile.toPath());
      final String content = new String(encoded, StandardCharsets.UTF_8);
      final Gson gson = new GsonBuilder()
          .registerTypeAdapter(RunnerOptions.class, new RunnerOptions.Deserializer())
          .create();
      options.merge(gson.fromJson(content, RunnerOptions.class));
    } catch (IOException ex) {
      throw new ToucaException("failed to read config file");
    } catch (JsonParseException ex) {
      throw new ToucaException("failed to parse config file");
    }
  }

  private static final Path findHomeDirectory() {
    final Path cwd = Paths.get("").resolve(".touca");
    final Path home = Paths.get(System.getProperty("user.home")).resolve(".touca");
    return cwd.toFile().exists() ? cwd : home;
  }

  private static final Map<String, String> readIniFile(final File file) {
    INIConfiguration config = new INIConfiguration();
    Map<String, String> content = new HashMap<>();
    try (FileReader reader = new FileReader(file)) {
      config.read(reader);
      SubnodeConfiguration section = config.getSection("settings");
      Iterator<String> it = section.getKeys();
      while (it.hasNext()) {
        String key = it.next();
        content.put(key, section.getProperty(key).toString());
      }
    } catch (IOException | ConfigurationException ex) {
      throw new ToucaException("failed to read ini file");
    }
    return content;
  }

  private static void applyConfigProfile(final RunnerOptions options) {
    String name = "default";
    final Path home = findHomeDirectory();
    final File settingsFile = home.resolve("settings").toFile();
    if (settingsFile.exists()) {
      final Map<String, String> content = readIniFile(settingsFile);
      if (content.containsKey("profile")) {
        name = content.get("profile");
      }
    }
    final File profile = home.resolve("profiles").resolve(name).toFile();
    if (!profile.exists()) {
      return;
    }
    final Map<String, String> content = readIniFile(profile);
    final BiConsumer<String, Consumer<String>> parseString = (final String key,
        final Consumer<String> consumer) -> {
      if (content.containsKey(key)) {
        consumer.accept(content.get(key));
      }
    };
    final BiConsumer<String, Consumer<Boolean>> parseBoolean = (final String key,
        final Consumer<Boolean> consumer) -> {
      if (content.containsKey(key)) {
        consumer.accept(Boolean.getBoolean(content.get(key)));
      }
    };
    parseString.accept("api-key", x -> options.apiKey = x);
    parseString.accept("api-url", x -> options.apiUrl = x);
    parseString.accept("team", x -> options.team = x);
    parseString.accept("suite", x -> options.suite = x);
    parseString.accept("version", x -> options.version = x);
    parseBoolean.accept("offline", x -> options.offline = x);
    parseBoolean.accept("concurrency", x -> options.concurrency = x);
    parseBoolean.accept("no-reflection", x -> options.reflection = !x);
    parseBoolean.accept("save-as-binary", x -> options.saveBinary = x);
    parseBoolean.accept("save-as-json", x -> options.saveJson = x);
    parseBoolean.accept("overwrite-results", x -> options.overwriteResults = x);
    parseBoolean.accept("colored-output", x -> options.coloredOutput = x);
    parseString.accept("output-directory", x -> options.outputDirectory = x);
    parseBoolean.accept("submit_async", x -> options.submitAsync = x);
  }

  private static void applyServerOptions(final RunnerOptions options, final Transport transport) {
    if (options.offline || options.apiUrl.isEmpty()) {
      return;
    }
    final Transport.Response response = transport.getRequest("/platform");
    if (response.code != HttpURLConnection.HTTP_OK) {
      throw new ToucaException(": %d", response.code);
    }
    final Gson gson = new GsonBuilder().create();
    JsonObject jsonObject = gson.fromJson(response.content, JsonObject.class);
    if (jsonObject.has("webapp")) {
      options.webUrl = jsonObject.get("webapp").getAsString();
    }
  }

  private static void applyRunnerOptions(final RunnerOptions options) {
    if (options.outputDirectory == null) {
      options.outputDirectory = findHomeDirectory().resolve("results").toString();
    }
    if (options.workflowFilter != null) {
      options.workflows = Arrays.stream(options.workflows)
          .filter(w -> w.suite == options.workflowFilter)
          .toArray(WorkflowWrapper[]::new);
      options.workflowFilter = null;
    }
    for (WorkflowWrapper workflow : options.workflows) {
      if (options.testcases != null && options.testcases.length != 0) {
        workflow.testcases = options.testcases;
      }
      if (options.suite != null) {
        workflow.suite = options.suite;
      }
      if (options.version != null) {
        workflow.version = options.version;
      }
    }
    options.suite = null;
    options.version = null;
    options.testcases = null;
  }

  private static String makeRemoteOptionsPayload(final RunnerOptions options) {
    final JsonArray doc = new JsonArray(options.workflows.length);
    for (final WorkflowWrapper ww : options.workflows) {
      if (options.team.isEmpty() || ww.suite == null || ww.suite.isEmpty()) {
        continue;
      }
      final JsonObject item = new JsonObject();
      item.addProperty("team", options.team);
      item.addProperty("suite", ww.suite);
      if (ww.version != null && !ww.version.isEmpty()) {
        item.addProperty("version", ww.version);
      }
      if (ww.testcases == null || ww.testcases.length == 0) {
        item.add("testcases", new JsonArray(0));
      }
      doc.add(item);
    }
    return new Gson().toJson(doc);
  }

  private static void applyRemoteOptions(final RunnerOptions options, final Transport transport) {
    if (options.offline || options.apiKey.isEmpty() || options.apiUrl.isEmpty() ||
        options.workflows.length == 0) {
      return;
    }
    final String payload = makeRemoteOptionsPayload(options);
    final Transport.Response response = transport.postRequest(
        "/client/options", "application/json", payload.getBytes());
    if (response.code == HttpURLConnection.HTTP_FORBIDDEN) {
      throw new ToucaException("client is not authenticated");
    }
    if (response.code == HttpURLConnection.HTTP_CONFLICT) {
      throw new ToucaException("The specified version is already submitted.");
    }
    if (response.code != HttpURLConnection.HTTP_OK) {
      throw new ToucaException("failed to fetch options from the remote server: %d",
          response.code);
    }
    for (final WorkflowWrapper w : new Gson().fromJson(response.content, WorkflowWrapper[].class)) {
      WorkflowWrapper ww = Arrays.stream(options.workflows)
          .filter(x -> x.suite.compareTo(w.suite) == 0).findAny().orElse(null);
      ww.version = w.version;
      if (ww.testcases == null || ww.testcases.length == 0) {
        ww.testcases = w.testcases;
      }
    }
  }

  private static void validateRunnerOptions(final RunnerOptions options) {
    List<String> missingKeys = new ArrayList<>();
    if (!options.offline) {
      if (options.apiKey == null || options.apiKey.isEmpty()) {
        missingKeys.add("apiKey");
      }
      if (options.apiUrl == null || options.apiUrl.isEmpty()) {
        missingKeys.add("apiUrl");
      }
    }
    if (!missingKeys.isEmpty()) {
      throw new ToucaException("required configuration options %s are missing",
          String.join(",", missingKeys));
    }
    if (Arrays.stream(options.workflows)
        .anyMatch(x -> x.version == null || x.version.isEmpty())) {
      throw new ToucaException(
          "Configuration option \"revision\" is missing for one or more workflows.");
    }
    if (Arrays.stream(options.workflows)
        .anyMatch(x -> x.testcases == null || x.testcases.length == 0)) {
      throw new ToucaException(
          "Configuration option \"testcases\" is missing for one or more workflows.");
    }
  }

  public static void updateRunnerOptions(final String[] args,
      final RunnerOptions options, final Transport transport) {
    OptionsParser.applyCliArguments(args, options);
    OptionsParser.applyConfigFile(options);
    OptionsParser.applyConfigProfile(options);
    OptionsParser.applyEnvironmentVariables(options);
    OptionsParser.applyApiUrl(options);
    OptionsParser.applyCoreOptions(options);
    OptionsParser.authenticate(options, transport);
    OptionsParser.applyServerOptions(options, transport);
    OptionsParser.applyRunnerOptions(options);
    OptionsParser.applyRemoteOptions(options, transport);
    OptionsParser.validateRunnerOptions(options);
  }
}
