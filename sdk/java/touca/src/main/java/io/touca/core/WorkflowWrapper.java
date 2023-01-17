// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.function.Consumer;

/**
 * Workflow under test with any options exclusively set for it.
 */
public class WorkflowWrapper extends WorkflowOptions {

  /**
   * Callback function representing the workflow under test.
   */
  public interface Callback {
    void accept(final String testcase) throws IllegalAccessException, InvocationTargetException;
  }

  /**
   * Name of the suite to be used that overrides the name of the workflow
   * specified as the first parameter to `touca::workflow()`.
   */
  public String suite;

  /** Workflow under test. */
  public Callback callback;

  public WorkflowWrapper(final Consumer<WorkflowWrapper> callback) {
    super();
    callback.accept(this);
  }

  /**
   * Finds all classes belonging to a given package or its subpackages.
   *
   * @param packageName The base package
   * @return List of classes in a given package name
   */
  private static List<Class<?>> findClasses(final String packageName) {
    final List<Class<?>> classes = new ArrayList<>();
    final ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
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
   * @param directory   The base directory
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

  /**
   * Finds all Touca workflows declared within the package of a given class.
   *
   * @param mainClass class that includes the main function of the test tool.
   * @return list of classes found within the package of a given class
   */
  public static WorkflowWrapper[] findWorkflows(Class<?> mainClass) {
    List<WorkflowWrapper> entries = new ArrayList<WorkflowWrapper>();
    final String className = mainClass.getCanonicalName();
    final String packageName = className.substring(0, className.lastIndexOf('.'));
    final Iterable<Class<?>> classes = findClasses(packageName);
    for (final Class<?> clazz : classes) {
      for (final Method method : clazz.getMethods()) {
        if (method.isAnnotationPresent(io.touca.Touca.Workflow.class)) {
          try {
            final Object obj = clazz.getConstructors()[0].newInstance();
            entries.add(new WorkflowWrapper(x -> {
              x.suite = method.getName();
              x.callback = testcase -> method.invoke(obj, testcase);
            }));
          } catch (ReflectiveOperationException ex) {
            System.err.printf("Exception: %s%n", ex.getMessage());
          }
        }
      }
    }
    return entries.toArray(new WorkflowWrapper[entries.size()]);
  }
}
