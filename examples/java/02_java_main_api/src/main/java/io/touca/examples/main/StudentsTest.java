// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.examples.main;

import io.touca.Touca;

public final class StudentsTest {
  public static void main(String[] args) {
    Touca.workflow("students_test", (final String username) -> {
      Touca.startTimer("parse_profile");
      Student student = Students.parseProfile(username);
      Touca.stopTimer("parse_profile");
      Touca.addAssertion("username", student.username);
      Touca.addResult("fullname", student.fullname);
      Touca.addResult("birth_date", student.dob);
      Touca.addResult("gpa", student.gpa);
      Touca.addMetric("external_source", 1500);
    });
    Touca.run(args);
  }
}
