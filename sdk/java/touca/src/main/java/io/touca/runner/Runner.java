// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.runner;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiFunction;
import io.touca.Touca.Workflow;
import io.touca.core.Client;
import io.touca.exceptions.ConfigException;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.ParseException;

/**
 * Entry-point to the Touca test framework.
 */
public class Runner {

  private final List<ClassMethod> workflows = new ArrayList<ClassMethod>();
  private final RunnerOptions options = new RunnerOptions();
  private final Statistics stats = new Statistics();
  private final Timer timer = new Timer();

  /**
   *
   */
  private static final class Timer {
    private final Map<String, Long> tics = new HashMap<String, Long>();
    private final Map<String, Long> times = new HashMap<String, Long>();

    /**
     *
     */
    public void tic(final String key) {
      tics.put(key, System.currentTimeMillis());
    }

    /**
     *
     */
    public void toc(final String key) {
      Long tic = tics.get(key);
      if (tic != null) {
        times.put(key, System.currentTimeMillis() - tic);
      }
    }

    /**
     *
     */
    public Long count(final String key) {
      return times.getOrDefault(key, 0L);
    }
  }

  /**
   *
   */
  private static final class Statistics {
    private final Map<String, Long> values = new HashMap<String, Long>();

    /**
     *
     */
    public void increment(final String key) {
      if (values.computeIfPresent(key, (k, v) -> v + 1) == null) {
        values.put(key, 1L);
      }
    }

    /**
     *
     */
    public Long count(final String key) {
      return values.getOrDefault(key, 0L);
    }
  }

  /**
   *
   */
  private static final class ClassMethod {
    public Class<?> clazz;
    public Method method;

    /**
     *
     */
    ClassMethod(Class<?> clazz, Method method) {
      this.clazz = clazz;
      this.method = method;
    }
  }

  /**
   * Parses command line arguments to retrieve the configuration options for the
   * Touca test framework.
   *
   * @param mainArgs command-line arguments provided to the application
   * @return this instance
   */
  public Runner parse(final String[] mainArgs) {
    CommandLineParser parser = new DefaultParser();
    try {
      CommandLine cmd = parser.parse(buildOptions(), mainArgs);

      BiFunction<String, Boolean, Boolean> parseBoolean =
          (String a, Boolean b) -> {
            return Boolean.parseBoolean(cmd.getOptionValue(a, b.toString()));
          };

      options.apply(new RunnerOptions(x -> {
        x.apiKey = cmd.getOptionValue("api-key");
        x.apiUrl = cmd.getOptionValue("api-url");
        x.team = cmd.getOptionValue("team");
        x.suite = cmd.getOptionValue("suite");
        x.version = cmd.getOptionValue("revision");
        x.file = cmd.getOptionValue("config-file");
        x.offline = parseBoolean.apply("offline", false);
        x.concurrency = parseBoolean.apply("concurrency", true);
        x.testcases = cmd.getOptionValues("testcase");
        x.testcaseFile = cmd.getOptionValue("testcase-file");
        x.saveAsBinary = parseBoolean.apply("save-as-binary", true);
        x.saveAsJson = parseBoolean.apply("save-as-json", false);
        x.overwrite = parseBoolean.apply("overwrite", false);
        x.outputDirectory = cmd.getOptionValue("outputDirectory", "./results");
      }));

    } catch (final ParseException ex) {
      throw new ConfigException(ex.getMessage());
    }
    return this;
  }

  /**
   * Discovers all methods annotated with `Touca.Workflow` to be later executed
   * via the {@link run} function.
   *
   * @param mainClass class that includes the main method of test application
   * @return this instance
   */
  public Runner findWorkflows(final Class<?> mainClass) {
    final String className = mainClass.getCanonicalName();
    final String packageName =
        className.substring(0, className.lastIndexOf("."));
    final Iterable<Class<?>> classes = findClasses(packageName);
    for (final Class<?> clazz : classes) {
      for (final Method method : clazz.getMethods()) {
        if (method.isAnnotationPresent(Workflow.class)) {
          workflows.add(new ClassMethod(clazz, method));
        }
      }
    }
    return this;
  }

  /**
   * Executes workflow functions one by one with the set of test cases specified
   * via command line arguments or obtained from the Touca server.
   *
   * @param client Touca client instance to use when running workflows.
   */
  public void run(final Client client) {
    initialize(client);
    for (final ClassMethod workflow : workflows) {
      try {
        runWorkflow(client, workflow);
      } catch (final Exception ex) {
        System.err.printf("failed to complete workflow: %s: %s%n",
            ex.getClass().getSimpleName(), ex.getMessage());
      }
    }
  }

  /**
   * Prepare the test framework for execution of test workflows.
   *
   * @param client Touca client instance to use when running workflows.
   */
  private void initialize(final Client client) throws ConfigException {
    if (!client.configure(options)) {
      throw new ConfigException(client.configurationError());
    }
    if (!Paths.get(options.outputDirectory).toFile().exists()) {
      if (!Paths.get(options.outputDirectory).toFile().mkdirs()) {
        throw new ConfigException(String.format(
            "failed to create directory: %s%n", options.outputDirectory));
      }
    }
    updateTestcases(client);
  }

  /**
   * Use provided config options to find the final list of test cases to use for
   * running the workflows.
   *
   * @param client Touca client instance to use when running workflows.
   */
  private void updateTestcases(final Client client) throws ConfigException {
    if (options.testcases != null) {
      if (options.testcaseFile != null) {
        throw new ConfigException(
            "Expected one of `testcase` or `testcase-file` options");
      }
      if (options.testcases.length != 0) {
        return;
      }
    }
    if (options.testcaseFile != null) {
      Path file = Paths.get(options.testcaseFile);
      if (!file.toFile().exists() || !file.toFile().isFile()) {
        throw new ConfigException(String.format(
            "Specified testcase file \"%s\" does not exist", file.toString()));
      }
      try {
        options.testcases = Files.readAllLines(file, StandardCharsets.UTF_8)
            .stream().filter(x -> !x.isEmpty() && !x.startsWith("##"))
            .map(x -> x.trim()).toArray(String[]::new);
        return;
      } catch (final IOException ex) {
        throw new ConfigException(ex.getMessage());
      }
    }
    if (options.offline || options.apiKey == null || options.apiUrl == null) {
      throw new ConfigException(
          String.join("%n", "Cannot proceed without a test case.",
              "Either use '--testcase' or '--testcase-file' to pass test cases",
              "or use '--api-key' and '--api-url' to let the library query",
              "the Touca Server to obtain and reuse the list of test cases",
              "submitted to the baseline version of this suite."));
    }
    options.testcases = client.getTestcases().stream().toArray(String[]::new);
    if (options.testcases.length == 0) {
      throw new ConfigException(
          String.join("%n", "Cannot proceed without a test case.",
              "Neither '--testcase' nor '--testcase-file' were provided.",
              "Attempted to query the Touca Server to obtain and reuse the",
              "list of test cases submitted to the baseline version of this",
              "suite but this suite has no previous version."));
    }
  }

  /**
   * Runs a given workflow with multiple test cases.
   *
   * @param client Touca client instance to use when running workflows.
   * @param workflow workflow to be executed
   */
  private void runWorkflow(final Client client, final ClassMethod workflow) {
    boolean isOffline = (options.offline != null && options.offline == true)
        || options.apiKey == null || options.apiUrl == null;

    System.out.printf("%nTouca Test Framework%nSuite: %s%nRevision: %s%n%n",
        options.suite, options.version);
    timer.tic("__workflow__");

    for (int index = 0; index < options.testcases.length; index++) {
      final List<String> errors = new ArrayList<String>();
      final String testcase = options.testcases[index];

      final Path testcaseDirectory = Paths.get(options.outputDirectory)
          .resolve(options.suite).resolve(options.version).resolve(testcase);

      if (!options.overwrite && this.shouldSkip(testcase)) {
        System.out.printf(" (%d of %d) %s (skip)%n", index + 1,
            options.testcases.length, testcase);
        stats.increment("skip");
        continue;
      }

      if (testcaseDirectory.toFile().exists()) {
        try {
          Files.walk(testcaseDirectory).map(Path::toFile).forEach(File::delete);
        } catch (final IOException ex) {
          System.err.printf("failed to remove directory: %s%n",
              testcaseDirectory);
        }
      }

      client.declareTestcase(testcase);
      timer.tic(testcase);

      try {
        final Object obj = workflow.clazz.getConstructors()[0].newInstance();
        workflow.method.invoke(obj, testcase);
      } catch (InvocationTargetException ex) {
        final Throwable targetException = ex.getTargetException();
        System.err.printf("%s: %s%n", targetException.getClass().getName(),
            targetException.getMessage());
        continue;
      } catch (ReflectiveOperationException ex) {
        System.err.printf("Exception: %s%n", ex.getMessage());
        continue;
      }

      timer.toc(testcase);
      stats.increment(errors.size() == 0 ? "pass" : "fail");

      if (errors.size() == 0 && options.saveAsBinary) {
        final Path path = testcaseDirectory.resolve("touca.bin");
        try {
          client.saveBinary(path, new String[] {testcase});
        } catch (final IOException ex) {
          errors.add(String.format("failed to create file %s: %s%n",
              path.toString(), ex.getMessage()));
        }
      }
      if (errors.size() == 0 && options.saveAsJson) {
        final Path path = testcaseDirectory.resolve("touca.json");
        try {
          client.saveJson(path, new String[] {testcase});
        } catch (final IOException ex) {
          errors.add(String.format("failed to create file %s: %s%n",
              path.toString(), ex.getMessage()));
        }
      }
      if (errors.size() == 0 && !isOffline) {
        client.post();
      }

      System.out.printf(" (%d of %d) %s (%s, %d ms)%n", index + 1,
          options.testcases.length, testcase, "pass", timer.count(testcase));

      client.forgetTestcase(testcase);
    }

    timer.toc("__workflow__");
    System.out.printf(
        "%nProcessed %d of %d testcases%nTest completed in %d ms%n%n",
        stats.count("pass"), options.testcases.length,
        timer.count("__workflow__"));

    if (!isOffline) {
      client.seal();
    }
  }

  /**
   * Checks whether the test framework should skip running a given test case.
   * 
   * @param testcase name of the test case
   * @return true if running the specified test case should be skipped.
   */
  private boolean shouldSkip(final String testcase) {
    final Path testcaseDirectory = Paths.get(options.outputDirectory)
        .resolve(options.suite).resolve(options.version).resolve(testcase);
    if (options.saveAsBinary) {
      return testcaseDirectory.resolve("touca.bin").toFile().isFile();
    }
    if (options.saveAsJson) {
      return testcaseDirectory.resolve("touca.json").toFile().isFile();
    }
    return false;
  }

  /**
   *
   */
  private Options buildOptions() {
    Options options = new Options();
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
    options.addOption(null, "testcase-file", true,
        "Single file listing testcases to feed to the workflows");
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
    return options;
  }

  /**
   * Finds all classes belonging to a given package or its subpackages.
   *
   * @param packageName The base package
   * @return List of classes in a given package name
   */
  private static List<Class<?>> findClasses(String packageName) {
    List<Class<?>> classes = new ArrayList<Class<?>>();
    ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
    String path = packageName.replace('.', '/');
    try {
      Enumeration<URL> resources = classLoader.getResources(path);
      List<File> dirs = new ArrayList<File>();
      while (resources.hasMoreElements()) {
        URL resource = resources.nextElement();
        URI uri = new URI(resource.toString());
        dirs.add(new File(uri.getPath()));
      }
      for (File directory : dirs) {
        classes.addAll(findClasses(directory, packageName));
      }
    } catch (URISyntaxException | IOException ex) {
      System.err.printf("Exception: %s%n", ex.getMessage());
    }
    return classes;
  }

  /**
   * Finds all classes in a given directory and its subdirectories.
   * 
   * @param directory The base directory
   * @param packageName The package name for classes found in the base directory
   * @return list of classes found in the given directory
   */
  private static List<Class<?>> findClasses(final File directory,
      final String packageName) {
    final List<Class<?>> classes = new ArrayList<Class<?>>();
    if (!directory.exists()) {
      return classes;
    }
    final File[] files = directory.listFiles();
    if (files == null) {
      return classes;
    }
    for (final File file : files) {
      if (file.isDirectory()) {
        classes.addAll(findClasses(file, packageName + "." + file.getName()));
      } else if (file.getName().endsWith(".class")) {
        try {
          classes.add(Class.forName(packageName + '.'
              + file.getName().substring(0, file.getName().length() - 6)));
        } catch (final ClassNotFoundException ex) {
          System.out.println(ex.getMessage());
        }
      }
    }
    return classes;
  }

}
