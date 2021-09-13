// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.examples.core;

import java.util.List;
import java.util.ArrayList;
import java.util.NoSuchElementException;

public class Students {
    final static List<Student> students = new ArrayList<Student>() {
        {
            new Student("alice", "Alice Anderson");
            new Student("bob", "Bob Brown");
            new Student("charlie", "Charlie Clark");
        }
    };

    public static double calculateGPA(final List<Student.Course> courses) {
        Students.sleep(100);
        double sum = courses.stream().mapToDouble(item -> item.grade).sum();
        return courses.size() == 0 ? sum / courses.size() : 0.0;
    }

    public static Student parseProfile(final String username) {
        Students.sleep(200);
        for (Student student : Students.students) {
            if (student.username.equals(username)) {
                return student;
            }
        }
        throw new NoSuchElementException("No student found for username" + username);
    }

    private static void sleep(final long delay) {
        try {
            Thread.sleep(delay + Double.valueOf(Math.random() * 50).longValue());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }
}
