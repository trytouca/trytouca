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
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
import org.fusesource.jansi.Ansi;

/**
 * Entry-point to the Touca test framework.
 */
public class Runner {

  private final List<ClassMethod> workflows = new ArrayList<>();
  private final RunnerOptions options = new RunnerOptions();
  private final Statistics stats = new Statistics();
  private final Timer timer = new Timer();

  private enum Status {
    Pass, Skip, Fail
  }

  private static final class Timer {
    private final Map<String, Long> tics = new HashMap<>();
    private final Map<String, Long> times = new HashMap<>();

    public void tic(final String key) {
      tics.put(key, System.currentTimeMillis());
    }

    public void toc(final String key) {
      final Long tic = tics.get(key);
      if (tic != null) {
        times.put(key, System.currentTimeMillis() - tic);
      }
    }

    public Long count(final String key) {
      return times.getOrDefault(key, 0L);
    }
  }

  private static final class Printer {
    private int testcaseWidth;
    private int testcaseCount;
    private boolean coloredOutput;
    private Path consoleLogFile;
    private Set<String> errors = new HashSet<String>();

    public Printer(RunnerOptions options) {
      this.testcaseWidth =
          Arrays.stream(options.testcases).map(item -> item.length()).reduce(0,
              (sum, item) -> Math.max(sum, item));
      this.testcaseCount = options.testcases.length;
      this.coloredOutput = options.coloredOutput;
      this.consoleLogFile =
          Paths.get(options.outputDirectory).resolve(options.suite)
              .resolve(options.version).resolve("Console.log");
      try {
        Files.createDirectories(this.consoleLogFile.getParent());
        Files.write(this.consoleLogFile, new byte[0], StandardOpenOption.CREATE,
            StandardOpenOption.TRUNCATE_EXISTING);
      } catch (final IOException ex) {
        this.errors.add("Failed to create Console.log");
      }
    }

    private void printToFile(final String text) {
      try {
        Files.write(this.consoleLogFile, text.getBytes(),
            StandardOpenOption.CREATE, StandardOpenOption.APPEND);
      } catch (final IOException ex) {
        this.errors.add("Failed to write into Console.log");
      }
    }

    private void print(final String fmt, Object... args) {
      final String text = String.format(fmt, args);
      this.printToFile(text);
      System.out.print(text);
    }

    private void print(final Ansi ansi, final String fmt, Object... args) {
      final String text = String.format(fmt, args);
      this.printToFile(text);
      System.out
          .print(this.coloredOutput ? ansi.a(text).reset().toString() : text);
    }

    public void printHeader(final String suite, final String version) {
      this.print("%nTouca Test Framework%nSuite: %s/%s%n%n", suite, version);
    }

    public void printProgress(int index, Status status, String testcase,
        Timer timer, List<String> errors) {
      final int pad = (int) Math.floor(Math.log10(this.testcaseCount)) + 1;
      this.print(" %" + pad + "s", index + 1);
      this.print(Ansi.ansi().fgBrightBlack(), ". ");
      if (status == Status.Skip) {
        this.print(Ansi.ansi().bg(Ansi.Color.YELLOW), " SKIP ");
      } else if (status == Status.Pass) {
        this.print(Ansi.ansi().bg(Ansi.Color.GREEN), " PASS ");
      } else if (status == Status.Fail) {
        this.print(Ansi.ansi().bg(Ansi.Color.RED), " FAIL ");
      }
      this.print(" %-" + Integer.toString(this.testcaseWidth) + "s", testcase);
      this.print(Ansi.ansi().fgBrightBlack(), "   (%d ms)%n",
          timer.count(testcase));
      if (!errors.isEmpty()) {
        this.print(Ansi.ansi().fgBrightBlack(), "%n   Exception Thrown:%n");
        for (final String error : errors) {
          this.print("      - %s", error);
        }
      }
    }

    private void printFooterSegment(Statistics stats, Status status,
        String text, Ansi.Color color) {
      if (stats.count(status) != 0) {
        this.print(Ansi.ansi().fg(color), "%d %s", stats.count(status), text);
        this.print(", ");
      }
    }

    public void printFooter(Statistics stats, Timer timer) {
      this.print("%nTests:      ");
      printFooterSegment(stats, Status.Pass, "passed", Ansi.Color.GREEN);
      printFooterSegment(stats, Status.Skip, "skipped", Ansi.Color.YELLOW);
      printFooterSegment(stats, Status.Fail, "failed", Ansi.Color.RED);
      this.print("%d total%n", this.testcaseCount);
      this.print("Time:       %.2f s%n", timer.count("__workflow__") / 1000.0);
      this.print("%n✨   Ran all test suites.%n%n");

      if (!this.errors.isEmpty()) {
        this.print("Warnings:\n");
      }
      for (final String error : this.errors) {
        this.print(Ansi.ansi().fg(Ansi.Color.YELLOW), "   - %s\n", error);
      }
    }

  }

  private static final class Statistics {
    private final Map<Status, Long> values = new HashMap<>();

    public void increment(final Status key) {
      if (values.computeIfPresent(key, (k, v) -> v + 1) == null) {
        values.put(key, 1L);
      }
    }

    public Long count(final Status key) {
      return values.getOrDefault(key, 0L);
    }
  }

  private static final class ClassMethod {
    public Class<?> clazz;
    public Method method;

    ClassMethod(final Class<?> clazz, final Method method) {
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
    final CommandLineParser parser = new DefaultParser();
    try {
      final CommandLine cmd = parser.parse(buildOptions(), mainArgs);

      final BiFunction<String, Boolean, Boolean> parseBoolean =
          (String a, Boolean b) -> {
            return (cmd.hasOption(a) && cmd.getOptionValue(a) == null)
                || Boolean.parseBoolean(cmd.getOptionValue(a, b.toString()));
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
        x.coloredOutput = parseBoolean.apply("colored-output", true);
      }));

    } catch (final ParseException ex) {
      throw new ConfigException(ex.getMessage());
    }
    return this;
  }

  /**
   * Discovers all methods annotated with `Touca.Workflow` to be later executed
   * via the {@link #run(Client)} run} function.
   *
   * @param mainClass class that includes the main method of test application
   * @return this instance
   */
  public Runner findWorkflows(final Class<?> mainClass) {
    final String className = mainClass.getCanonicalName();
    final String packageName =
        className.substring(0, className.lastIndexOf('.'));
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
    if (!Paths.get(options.outputDirectory).toFile().exists()
        && !Paths.get(options.outputDirectory).toFile().mkdirs()) {
      throw new ConfigException(String
          .format("failed to create directory: %s%n", options.outputDirectory));
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
      final Path file = Paths.get(options.testcaseFile);
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
    final boolean isOffline = (options.offline != null && options.offline)
        || options.apiKey == null || options.apiUrl == null;

    Printer printer = new Printer(options);
    printer.printHeader(options.suite, options.version);
    timer.tic("__workflow__");

    for (int index = 0; index < options.testcases.length; index++) {
      final List<String> errors = new ArrayList<String>();
      final String testcase = options.testcases[index];

      final Path testcaseDirectory = Paths.get(options.outputDirectory)
          .resolve(options.suite).resolve(options.version).resolve(testcase);

      if (!options.overwrite && this.shouldSkip(testcase)) {
        printer.printProgress(index, Status.Skip, testcase, timer, errors);
        stats.increment(Status.Skip);
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
        errors.add(String.format("%s: %s%n",
            targetException.getClass().getSimpleName(),
            targetException.getMessage()));
      } catch (ReflectiveOperationException ex) {
        System.err.printf("Exception: %s%n", ex.getMessage());
        continue;
      }

      timer.toc(testcase);
      stats.increment(errors.isEmpty() ? Status.Pass : Status.Fail);

      if (errors.isEmpty() && options.saveAsBinary) {
        final Path path = testcaseDirectory.resolve("touca.bin");
        try {
          client.saveBinary(path, new String[] {testcase});
        } catch (final IOException ex) {
          errors.add(String.format("failed to create file %s: %s%n",
              path.toString(), ex.getMessage()));
        }
      }
      if (errors.isEmpty() && options.saveAsJson) {
        final Path path = testcaseDirectory.resolve("touca.json");
        try {
          client.saveJson(path, new String[] {testcase});
        } catch (final IOException ex) {
          errors.add(String.format("failed to create file %s: %s%n",
              path.toString(), ex.getMessage()));
        }
      }
      if (errors.isEmpty() && !isOffline) {
        client.post();
      }

      printer.printProgress(index, errors.isEmpty() ? Status.Pass : Status.Skip,
          testcase, timer, errors);

      client.forgetTestcase(testcase);
    }

    timer.toc("__workflow__");
    printer.printFooter(stats, timer);

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

  private Options buildOptions() {
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
    options.addOption(Option.builder().longOpt("colored-output")
        .type(Boolean.class).optionalArg(true).numberOfArgs(1)
        .desc("Use color in standard output").build());
    return options;
  }

  /**
   * Finds all classes belonging to a given package or its subpackages.
   *
   * @param packageName The base package
   * @return List of classes in a given package name
   */
  private static List<Class<?>> findClasses(final String packageName) {
    final List<Class<?>> classes = new ArrayList<>();
    final ClassLoader classLoader =
        Thread.currentThread().getContextClassLoader();
    final String path = packageName.replace('.', '/');
    try {
      final Enumeration<URL> resources = classLoader.getResources(path);
      final List<File> dirs = new ArrayList<>();
      while (resources.hasMoreElements()) {
        final URL resource = resources.nextElement();
        final URI uri = new URI(resource.toString());
        dirs.add(new File(uri.getPath()));
      }
      for (final File directory : dirs) {
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
    final List<Class<?>> classes = new ArrayList<>();
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
