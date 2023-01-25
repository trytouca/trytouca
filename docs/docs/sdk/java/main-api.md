# Main API

:::info New To Touca?

Checkout our [Quick Start](https://touca.io/docs/basics/) guide to learn how to
get started with Touca.

:::

Let's assume we'd like to test a software that takes the username of a student
and returns basic information about them including their name, date of birth,
and GPA.

```java
public static Student findStudent(final String username);
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
    Touca.run(StudentsTest.class, args);
  }
}
```

While we are using the same test framework as before, we are tracking more data
about the behavior and performance of our software using various data capturing
functions. In this tutorial, we will learn how these functions work and how they
can help us detect regressions in future versions of our software.

## Describing the Behavior

For any given username, we can call our `findStudent` function and capture the
properties of its output that are expected to remain the same in future versions
of our software.

We can start small and capture the entire returned object as a Touca result:

```java
Touca.check("student", student);
```

Adding the output object as a single entity works. But what if we decided to add
a field to the return value of `findStudent` that reported whether the profile
was fetched from the cache?

Since this information may change every time we run our tests, we can choose to
capture different fields as separate entities.

```java
Touca.assume("username", student.username);
Touca.check("fullname", student.fullname);
Touca.check("birth_date", student.dob);
Touca.check("gpa", student.gpa);
```

This approach allows Touca to report differences in a more helpful format,
providing analytics for different fields. If we changed our `findStudent`
implementation to always capitalize student names, we could better visualize the
differences to make sure that only the value associated with key `fullname`
changes across our test cases.

Note that we used Touca function `assume` to track the `username`. Touca does
not visualize the values captured as assertion unless they are different.

We can capture the value of any number of variables, including the ones that are
not exposed by the interface of our code under test. In our example, let us
imagine that our software calculates GPA of students based on their courses.

If we are just relying on the output of our function, it may be difficult to
trace a reported difference in GPA to its root cause. Assuming that the courses
enrolled by a student are not expected to change, we can track them without
redesigning our API:

```java
private static double calculateGPA(final Course[] courses) {
    Touca.check("courses", courses);
    double sum = Arrays.asList(courses).stream().mapToDouble(item -> item.grade).sum();
    return courses.length == 0 ? sum / courses.length : 0.0;
}
```

Touca data capturing functions remain no-op in production environments. They are
only activated when running in the context of a `Touca.run` function call.

## Describing the Performance

Just as we can capture values of variables to describe the behavior of different
parts of our software, we can capture the runtime of different functions to
describe their performance.

Touca can notify us when future changes to our implementation result in
significantly changes in the measured runtime values.

```java
Touca.startTimer("find_student");
Student student = find_student(username);
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

In addition to these data capturing functions, the test framework automatically
tracks the wall-clock runtime of every test case and reports it to the Touca
server.

Like other data capturing functions, we can use Touca performance logging
functions in production code, to track runtime of internal functions for
different test cases. The functions introduced above remain no-op in production
environments.
