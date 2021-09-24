// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.examples.core;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.NoSuchElementException;

public final class Students {
  final static Student[] students =
      new Student[] {
          new Student("alice", "Alice Anderson", LocalDate.of(2006, 3, 1),
              new Course[] {new Course("math", 4.0),
                  new Course("computers", 3.8)}),
          new Student("bob", "Bob Brown", LocalDate.of(1996, 6, 30),
              new Course[] {new Course("english", 3.7),
                  new Course("history", 3.9)}),
          new Student("charlie", "Charlie Clark", LocalDate.of(2003, 9, 19),
              new Course[] {new Course("math", 2.9),
                  new Course("computers", 3.7)})};

  public static Student parseProfile(final String username) {
    Students.sleep(200);
    for (Student student : Students.students) {
      if (student.username.equals(username)) {
        return student;
      }
    }
    throw new NoSuchElementException(
        String.format("No student found for username: %s", username));
  }

  public static double calculateGPA(final Course[] courses) {
    Students.sleep(100);
    double sum =
        Arrays.asList(courses).stream().mapToDouble(item -> item.grade).sum();
    return courses.length == 0 ? 0.0 : sum / courses.length;
  }

  private static void sleep(final long delay) {
    try {
      Thread.sleep(delay + Double.valueOf(Math.random() * 50).longValue());
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
    }
  }
}
