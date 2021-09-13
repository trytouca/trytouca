// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.examples.core;

import io.touca.Touca;

public final class StudentsTest {
    public static void main(String[] args) {
        Touca.configure(options -> {
            options.offline = true;
        });
        if (!Touca.isConfigured()) {
            System.err.print(Touca.configurationError());
            System.exit(1);
        }
        for (String username : Touca.getTestCases()) {
            Touca.declareTestcase(username);
            Touca.startTimer("parse_profile");
            Student student = Students.parseProfile(username);
            Touca.stopTimer("parse_profile");

            Touca.addSerializer(Course.class, course -> {
                return course.name;
            });
            Touca.addAssertion("username", student.username);
            Touca.addResult("fullname", student.fullname);
            Touca.addResult("birth_date", student.dob);

            Touca.scopedTimer("calculate_gpa", () -> {
                Touca.addResult("gpa", Students.calculateGPA(student.courses));
            });
            Touca.addMetric("external_source", 1500);

            Touca.post();
            Touca.saveJson(String.format("touca_%s.json", username));
            Touca.saveBinary(String.format("touca_%s.bin", username));
            Touca.forgetTestcase(username);
        }
        Touca.seal();
    }
}
