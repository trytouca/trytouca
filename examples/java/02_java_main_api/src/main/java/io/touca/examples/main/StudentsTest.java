// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.examples.main;

import io.touca.Touca;
import io.touca.TypeAdapterContext;
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
    Touca.check("pass", student.gpa < 3.9);
    Touca.addMetric("external_source", 1500);
  }

  public static void main(String[] args) {
    Touca.addTypeAdapter(LocalDate.class, (x) -> {
      TypeAdapterContext object = new TypeAdapterContext();
      object.add("day", x.getDayOfMonth());
      object.add("month", x.getMonthValue());
      object.add("year", x.getYear());
      return object;
    });
    Touca.run(StudentsTest.class, args);
  }

}
