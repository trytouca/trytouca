// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.examples.main;

import java.time.LocalDate;

public final class Student {
  public String username;
  public String fullname;
  public LocalDate dob;
  public double gpa;

  public Student(final String username, final String fullname,
      final LocalDate dob, final double gpa) {
    this.username = username;
    this.fullname = fullname;
    this.dob = dob;
    this.gpa = gpa;
  }
}
