# Touca Java SDK

In the [previous tutorial](../01_java_minimal), we showed how to write and run a
simple Touca test using our Java SDK. But our `isPrime` example was too minimal
to show how Touca can help us describe the behavior and performance of
real-world software workflows.

In this tutorial, we will test a Profile Lookup application that takes the
username of a student and returns basic information about them, such as their
name, date of birth, and GPA.

Let us imagine that our code under test has the following entry-point. See
[`Students.java`](./src/main/java/io/touca/examples/main/Students.java) for a
possible implementation.

```java
public static Student findStudent(final String username);
```

where `Student` has the following properties:

```java
import java.time.LocalDate;

public class Student {
    public String username;
    public String fullname;
    public LocalDate dob;
    public double gpa;

    // constructor
}
```

Here's a Touca test we can write for our code under test:

```java
import io.touca.Touca;

public final class StudentsTest {

  @Touca.Workflow
  public void findStudent(final String username) {
    Student student = Students.findStudent(username);
    // more to write here
  }

  public static void main(String[] args) {
    Touca.run(StudentsTest.class, args);
  }
}
```

## Describing Behavior

For any given username, we can call our `findStudent` function and capture the
properties of its output that are expected to remain the same in future versions
of our software.

We can start small and capture the entire returned object as a Touca result:

```java
touca.addResult("student", student);
```

We can run our test from the command line:

```bash
export TOUCA_API_KEY="your-api-key"
export TOUCA_API_URL="your-api-url"
gradle runExampleMain --args='--revision v1.0 --testcase alice bob charlie'
```

the Touca SDK captures the `Student` object with all its properties and submits
that information to the Touca server. We can check this output on the web app
but we can also ask the SDK to generate a JSON result file for us:

```bash
gradle runExampleMain --args='--revision v2.0 --save-as-json'
```

You can use `--help` to learn about available command line options.

Notice that we are not specifying the list of test cases anymore. When they are
not explicitly provided, the SDK fetches this list from the Touca server.

Adding the output object as a single entity works. But what if we decided to add
a field to the return value of `findStudent` that reported whether the profile
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
providing analytics for different fields. If we changed our `findStudent`
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
only activated when running in the context of a `Touca.workflow` function call.
See the next tutorial to learn more.

## Describing Performance

Just as we can capture values of variables to describe the behavior of different
parts of our software, we can capture the runtime of different functions to
describe their performance.

Touca can notify us when future changes to our implementation result in
significantly changes in the measured runtime values.

```java
Touca.startTimer("find_student");
Student student = Students.findStudent(username);
Touca.stopTimer("find_student");
```

The two functions `startTimer` and `stopTimer` provide fine-grained control for
runtime measurement. If they feel too verbose, we can opt to use `scopedTimer`
as an alternatives:

```java
Touca.scopedTimer("find_student", () -> {
    student = Students.findStudent(username);
});
```

Alternatively, we could use `io.touca.ScopedTimer` in a `try-with-resources`
statement:

```java
try (ScopedTimer timer = ScopedTimer("find_student")) {
    Student student = Students.findStudent(username);
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
