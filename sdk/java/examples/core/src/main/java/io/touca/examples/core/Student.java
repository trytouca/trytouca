// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.examples.core;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class Student {
    public class Course {
        public String name;
        public double grade;

        public Course(final String name, final Double grade) {
            this.name = name;
            this.grade = grade;
        }
    }

    public String username;
    public String fullname;
    public LocalDate dob;
    public List<Course> courses;

    public Student(final String username, final String fullname) {
        this.username = username;
        this.fullname = fullname;
        this.dob = LocalDate.of(2006, 3, 1);
        this.courses = new ArrayList<Course>() {
            {
                new Course("math", 4.0);
                new Course("computers", 3.8);
            }
        };
    }
}
