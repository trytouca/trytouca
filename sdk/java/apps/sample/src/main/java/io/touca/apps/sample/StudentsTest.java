// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.apps.sample;

import io.touca.Touca;
import java.time.LocalDate;

public final class StudentsTest {

  @Touca.Workflow
  public void findStudent(final String username) {
    Touca.startTimer("find_student");
    Student student = Students.findStudent(username);
    Touca.stopTimer("find_student");
    Touca.assume("username", student.username);
    Touca.check("fullname", student.fullname);
    Touca.check("birth_date", student.dob);
    Touca.check("gpa", student.gpa);
    Touca.addMetric("external_source", 1500);
  }

  public static void main(String[] args) {
    Touca.addTypeAdapter(LocalDate.class, x -> x.toString());
    Touca.setWorkflowOptions("findStudent", x -> {
      x.testcases = new String[] { "alice", "bob", "charlie" };
    });
    Touca.run(StudentsTest.class, args);
  }
}
