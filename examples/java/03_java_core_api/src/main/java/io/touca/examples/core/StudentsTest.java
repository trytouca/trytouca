// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.examples.core;

import io.touca.Touca;
import java.io.IOException;

public final class StudentsTest {
  public static void main(String[] args) throws IOException {
    Touca.configure(options -> {
      options.offline = true;
    });
    if (!Touca.isConfigured()) {
      System.err.print(Touca.configurationError());
      System.exit(1);
    }
    for (String username : new String[] { "alice", "bob", "charlie" }) {
      Touca.declareTestcase(username);
      Touca.startTimer("find_student");
      Student student = Students.findStudent(username);
      Touca.stopTimer("find_student");

      Touca.addTypeAdapter(Course.class, course -> {
        return course.name;
      });
      Touca.assume("username", student.username);
      Touca.check("fullname", student.fullname);
      Touca.check("birth_date", student.dob);

      Touca.scopedTimer("calculate_gpa", () -> {
        Touca.check("gpa", Students.calculateGPA(student.courses));
      });
      Touca.addMetric("external_source", 1500);

      Touca.post();
      Touca.saveJson(String.format("touca_%s.json", username), null);
      Touca.saveBinary(String.format("touca_%s.bin", username), null);
      Touca.forgetTestcase(username);
    }
    Touca.seal();
  }
}
