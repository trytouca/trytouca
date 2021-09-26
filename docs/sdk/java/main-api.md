# Main API of Java SDK

[So far](./quickstart.md), we learned how to write and run a simple Touca test
using the Touca SDK for Java. But our previous `isPrime` example was too minimal
to show how Touca can help us describe the behavior and performance of
real-world software workflows. Let us use a Profile Lookup software as another
example that takes the username of a student and returns basic information about
them, such as their name, date of birth, and GPA.

```java
public static Student parseProfile(final String username);
```

where `Student` has the following members:

```java
import java.time.LocalDate;

public class Student {
    public String username;
    public String fullname;
    public LocalDate dob;
    public double gpa;
}
```

Here's a Touca test we can write for our code under test:

```java
import io.touca.Touca;

public final class StudentsTest {

  @Touca.Workflow
  public void parseProfile(final String username) {
    Touca.startTimer("parse_profile");
    Student student = Students.parseProfile(username);
    Touca.stopTimer("parse_profile");
    Touca.addAssertion("username", student.username);
    Touca.addResult("fullname", student.fullname);
    Touca.addResult("birth_date", student.dob);
    Touca.addResult("gpa", student.gpa);
    Touca.addMetric("external_source", 1500);
  }

  public static void main(String[] args) {
    Touca.run(StudentsTest.class, args);
  }

}
```

While we are using the same test framework as before, we are tracking more data
about the behavior and performance of our software using various data capturing
functions. In this tutorial, we will learn how these functions work and how they
can help us detect regressions in future versions of our software.

## Describing Behavior

For any given username, we can call our `parseProfile` function and capture the
properties of its output that are expected to remain the same in future versions
of our software.

We can start small and capture the entire returned object as a Touca result:

```java
Touca.addResult("student", student);
```

Adding the output object as a single entity works. But what if we decided to add
a field to the return value of `parseProfile` that reported whether the profile
was fetched from the cache?

Since this information may change every time we run our tests, we can choose to
capture different fields as separate entities.

```java
Touca.addAssertion("username", student.username);
Touca.addResult("fullname", student.fullname);
Touca.addResult("birth_date", student.dob);
Touca.addResult("gpa", student.gpa);
```

This approach allows Touca to report differences in a more helpful format,
providing analytics for different fields. If we changed our `parseProfile`
implementation to always capitalize student names, we could better visualize the
differences to make sure that only the value associated with key `fullname`
changes across our test cases.

Note that we used Touca function `addAssertion` to track the `username`. Touca
does not visualize the values captured as assertion unless they are different.

We can capture the value of any number of variables, including the ones that are
not exposed by the interface of our code under test. In our example, let us
imagine that our software calculates GPA of students based on their courses.

If we are just relying on the output of our function, it may be difficult to
trace a reported difference in GPA to its root cause. Assuming that the courses
enrolled by a student are not expected to change, we can track them without
redesigning our API:

```java
private static double calculateGPA(final Course[] courses) {
    Touca.addResult("courses", courses);
    double sum = Arrays.asList(courses).stream().mapToDouble(item -> item.grade).sum();
    return courses.length == 0 ? sum / courses.length : 0.0;
}
```

Touca data capturing functions remain no-op in production environments. They are
only activated when running in the context of a `Touca.run` function call.

## Describing Performance

Just as we can capture values of variables to describe the behavior of different
parts of our software, we can capture the runtime of different functions to
describe their performance.

Touca can notify us when future changes to our implementation result in
significantly changes in the measured runtime values.

```java
Touca.startTimer("parse_profile");
Student student = parse_profile(username);
Touca.stopTimer("parse_profile");
```

The two functions `startTimer` and `stopTimer` provide fine-grained control for
runtime measurement. If they feel too verbose, we can opt to use `scopedTimer`
as an alternatives:

```java
Touca.scopedTimer("parse_profile", () -> {
    student = Students.parseProfile(username);
});
```

Alternatively, we could use `io.touca.ScopedTimer` in a `try-with-resources`
statement:

```java
try (ScopedTimer timer = ScopedTimer("parse_profile")) {
    Student student = Students.parseProfile(username);
}
```

It is also possible to add measurements obtained by other performance
benchmarking tools.

```java
Touca.addMetric("external_source", 1500);
```

In addition to these data capturing functions, Touca test framework
automatically tracks the wall-clock runtime of every test case and reports it to
the Touca server.

Like other data capturing functions, we can use Touca performance logging
functions in production code, to track runtime of internal functions for
different test cases. The functions introduced above remain no-op in production
environments.
