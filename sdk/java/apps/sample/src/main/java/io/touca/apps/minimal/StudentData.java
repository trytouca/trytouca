// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.apps.sample;

import java.time.LocalDate;
import java.util.NoSuchElementException;

public final class StudentData {
  public String username;
  public String fullname;
  public LocalDate dob;
  public Course[] courses;

  private static final StudentData[] students =
      new StudentData[] {
          new StudentData("alice", "Alice Anderson", LocalDate.of(2006, 3, 1),
              new Course[] {new Course("math", 4.0),
                  new Course("computers", 3.8)}),
          new StudentData("bob", "Bob Brown", LocalDate.of(1996, 6, 30),
              new Course[] {new Course("english", 3.7),
                  new Course("history", 3.9)}),
          new StudentData("charlie", "Charlie Clark", LocalDate.of(2003, 9, 19),
              new Course[] {new Course("math", 2.9),
                  new Course("computers", 3.7)})};

  private StudentData(final String username, final String fullname,
      final LocalDate dob, final Course[] courses) {
    this.username = username;
    this.fullname = fullname;
    this.dob = dob;
    this.courses = courses;
  }

  public static StudentData of(final String username) {
    for (StudentData item : StudentData.students) {
      if (item.username.equals(username)) {
        return item;
      }
    }
    throw new NoSuchElementException(
        String.format("No student found for username: %s", username));
  }
}
