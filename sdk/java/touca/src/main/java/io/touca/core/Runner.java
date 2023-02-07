// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.fusesource.jansi.Ansi;

/**
 * Entry-point to the Touca test runner.
 */
public class Runner {

  private final RunnerOptions options = new RunnerOptions();
  private final Statistics stats = new Statistics();
  private final Timer timer = new Timer();
  private final Client client;
  private Printer printer = new Printer();

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
    private Set<String> errorsApp = new HashSet<String>();

    public void configure(final RunnerOptions options) {
      consoleLogFile = Paths.get(options.outputDirectory).resolve(options.suite)
          .resolve(options.version).resolve("Console.log");
      coloredOutput = options.coloredOutput;
      testcaseCount = options.testcases.length;
      testcaseWidth = Arrays.stream(options.testcases).map(item -> item.length()).reduce(0,
          (sum, item) -> Math.max(sum, item));
      try {
        Files.createDirectories(consoleLogFile.getParent());
        Files.write(consoleLogFile, new byte[0], StandardOpenOption.CREATE,
            StandardOpenOption.TRUNCATE_EXISTING);
      } catch (final IOException ex) {
        errorsApp.add("Failed to create Console.log");
      }
    }

    private void printToFile(final String text) {
      if (consoleLogFile == null) {
        return;
      }
      try {
        Files.write(consoleLogFile, text.getBytes(),
            StandardOpenOption.CREATE, StandardOpenOption.APPEND);
      } catch (final IOException ex) {
        errorsApp.add("Failed to write into Console.log");
      }
    }

    private void print(final String fmt, Object... args) {
      final String text = String.format(fmt, args);
      printToFile(text);
      System.out.print(text);
    }

    private void print(final Ansi ansi, final String fmt, Object... args) {
      final String text = String.format(fmt, args);
      printToFile(text);
      System.out
          .print(coloredOutput ? ansi.a(text).reset().toString() : text);
    }

    public void printHeader(final String suite, final String version) {
      print("%nSuite: %s/%s%n%n", suite, version);
    }

    public void printProgress(int index, Status status, String testcase,
        Timer timer, List<String> errorsCase) {
      final int pad = (int) Math.floor(Math.log10(testcaseCount)) + 1;
      print(" %" + pad + "s", index + 1);
      print(Ansi.ansi().fgBrightBlack(), ". ");
      if (status == Status.Skip) {
        print(Ansi.ansi().bg(Ansi.Color.YELLOW), " SKIP ");
      } else if (status == Status.Pass) {
        print(Ansi.ansi().bg(Ansi.Color.GREEN), " PASS ");
      } else if (status == Status.Fail) {
        print(Ansi.ansi().bg(Ansi.Color.RED), " FAIL ");
      }
      print(" %-" + Integer.toString(testcaseWidth) + "s", testcase);
      print(Ansi.ansi().fgBrightBlack(), "   (%d ms)%n",
          timer.count(testcase));
      if (!errorsCase.isEmpty()) {
        print(Ansi.ansi().fgBrightBlack(), "%n   Exception Thrown:%n");
        for (final String error : errorsCase) {
          print("      - %s", error);
        }
        print("\n");
      }
    }

    private void printFooterSegment(Statistics stats, Status status,
        String text, Ansi.Color color) {
      if (stats.count(status) != 0) {
        print(Ansi.ansi().fg(color), "%d %s", stats.count(status), text);
        print(", ");
      }
    }

    public void printFooter(Statistics stats, Timer timer, RunnerOptions options, String webLink) {
      print("%nTests:      ");
      printFooterSegment(stats, Status.Pass, "passed", Ansi.Color.GREEN);
      printFooterSegment(stats, Status.Skip, "skipped", Ansi.Color.YELLOW);
      printFooterSegment(stats, Status.Fail, "failed", Ansi.Color.RED);
      print("%d total%n", options.testcases.length);
      print("Time:       %.2f s%n", timer.count("__workflow__") / 1000.0);
      if (!webLink.isEmpty()) {
        print("Link:       %s%n", webLink);
      }
      if (options.saveBinary || options.saveJson) {
        print("Results:    %s%n", Paths.get(options.outputDirectory)
            .resolve(options.suite).resolve(options.version));
      }

      if (!errorsApp.isEmpty()) {
        print("Warnings:%n");
      }
      for (final String error : errorsApp) {
        print(Ansi.ansi().fg(Ansi.Color.YELLOW), "   - %s%n", error);
      }
    }

    public void printAppHeader() {
      print("%nTouca Test Runner%n");
    }

    public void printAppFooter() {
      print("%n✨   Ran all test suites.%n%n");
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

  /**
   * Creates an instance of the built-in runner for running the test functions
   * within a given package.
   *
   * @param client Touca client instance to use when running workflows.
   */
  public Runner(final Client client) {
    this.client = client;
  }

  /**
   * Parses the test runner configuration parameters from various sources and
   * executes workflow functions one by one with the set of test cases specified
   * via command line arguments or obtained from the Touca server.
   *
   * @param mainClass Class that includes the main application function
   * @param mainArgs  command-line arguments given to the test application
   */
  public void run(final Class<?> mainClass, final String[] mainArgs,
      Map<String, WorkflowOptions> extraWorkflowOptions) {
    options.workflows = WorkflowWrapper.findWorkflows(mainClass);
    Arrays.stream(options.workflows).forEach(x -> {
      if (extraWorkflowOptions.containsKey(x.suite)) {
        final WorkflowOptions options = extraWorkflowOptions.get(x.suite);
        x.testcases = options.testcases;
        x.version = options.version;
      }
    });
    OptionsParser.updateRunnerOptions(mainArgs, options, client.getTransport());
    runWorkflows();
  }

  private void runWorkflows() {
    if (options.saveBinary || options.saveJson) {
      try {
        Files.createDirectories(Paths.get(options.outputDirectory));
      } catch (Exception ex) {
        throw new ToucaException("Failed to create directory: %s", options.outputDirectory);
      }
    }
    printer.printAppHeader();
    for (final WorkflowWrapper workflow : options.workflows) {
      options.suite = workflow.suite;
      options.version = workflow.version;
      options.testcases = workflow.testcases;
      try {
        runWorkflow(workflow.callback);
      } catch (Exception ex) {
        printer.print(String.format(
            "\nError when running suite \"%s\":\n%s\n",
            workflow.suite, ex.getMessage()));
      }
    }
    printer.printAppFooter();
  }

  /**
   * Runs a given workflow with multiple test cases.
   *
   * @param callback code under test to be executed
   */
  private void runWorkflow(final WorkflowWrapper.Callback callback) {
    client.configure(x -> {
      x.apiKey = options.apiKey;
      x.apiUrl = options.apiUrl;
      x.team = options.team;
      x.suite = options.suite;
      x.version = options.version;
      x.offline = options.offline;
    });
    printer.configure(options);
    printer.printHeader(options.suite, options.version);
    timer.tic("__workflow__");

    for (int index = 0; index < options.testcases.length; index++) {
      final List<String> errors = new ArrayList<String>();
      final String testcase = options.testcases[index];

      final Path caseDirectory = Paths.get(options.outputDirectory)
          .resolve(options.suite).resolve(options.version).resolve(testcase);
      if (options.overwriteResults ? false
          : options.saveBinary ? caseDirectory.resolve("touca.bin").toFile().isFile()
              : options.saveJson ? caseDirectory.resolve("touca.json").toFile().isFile()
                  : false) {
        printer.printProgress(index, Status.Skip, testcase, timer, errors);
        stats.increment(Status.Skip);
        continue;
      }

      if (caseDirectory.toFile().exists()) {
        try {
          Files.walk(caseDirectory).map(Path::toFile).forEach(File::delete);
        } catch (final IOException ex) {
          System.err.printf("failed to remove directory: %s%n",
              caseDirectory);
        }
      }

      client.declareTestcase(testcase);
      timer.tic(testcase);

      try {
        callback.accept(testcase);
      } catch (InvocationTargetException ex) {
        final Throwable targetException = ex.getTargetException();
        errors.add(String.format("%s: %s%n",
            targetException.getClass().getSimpleName(),
            targetException.getMessage()));
      } catch (Exception ex) {
        errors.add(String.format("Exception: %s%n", ex.getMessage()));
      }

      timer.toc(testcase);
      stats.increment(errors.isEmpty() ? Status.Pass : Status.Fail);

      if (errors.isEmpty() && options.saveBinary) {
        client.saveBinary(caseDirectory.resolve("touca.bin"), new String[] { testcase });
      }
      if (errors.isEmpty() && options.saveJson) {
        client.saveJson(caseDirectory.resolve("touca.json"), new String[] { testcase });
      }
      if (errors.isEmpty() && !options.offline) {
        client.post();
      }

      Status status = errors.isEmpty() ? Status.Pass : Status.Fail;
      printer.printProgress(index, status, testcase, timer, errors);
      client.forgetTestcase(testcase);
    }

    timer.toc("__workflow__");
    String webLink = options.offline || stats.count(Status.Pass) == 0 ? "" : client.seal();
    printer.printFooter(stats, timer, options, webLink);
  }

}
