// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.examples.core;

import java.time.LocalDate;

public class Student {
    public String username;
    public String fullname;
    public LocalDate dob;
    public Course[] courses;

    public Student(final String username, final String fullname, final LocalDate dob, final Course[] courses) {
        this.username = username;
        this.fullname = fullname;
        this.dob = dob;
        this.courses = courses;
    }
}
