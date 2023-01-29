# Touca Java SDK

[![Maven Central](https://img.shields.io/maven-central/v/io.touca/touca?color=blue)](https://search.maven.org/artifact/io.touca/touca)
[![License](https://img.shields.io/static/v1?label=license&message=Apache-2.0&color=blue)](https://github.com/trytouca/trytouca/blob/main/sdk/java/LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/trytouca/trytouca/build.yml?branch=main)](https://github.com/trytouca/trytouca/actions/workflows/build.yml?query=branch:main+event:push)
[![Code Coverage](https://img.shields.io/codecov/c/github/trytouca/trytouca)](https://app.codecov.io/gh/trytouca/trytouca)

## Install

You can install Touca from
[Maven Central](https://search.maven.org/artifact/io.touca/touca):

```xml
<dependency>
  <groupId>io.touca</groupId>
  <artifactId>touca</artifactId>
  <version>1.6.1</version>
</dependency>
```

We support Java 8 and newer on Linux, macOS, and Windows platforms.

## Sneak Peak

> For a more thorough guide of how to use Touca SDK for Java, refer to our
> [documentation website](https://touca.io/docs).

Let us imagine that we want to test a software workflow that takes the username
of a student and provides basic information about them.

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

public final class StudentsTest {

  @Test
  public void testAlice() {
    Student alice = Students.findStudent("alice");
    assertEquals("Alice Anderson", alice.fullname);
    assertEquals(new Date(2006, 3, 1), alice.dob);
    assertEquals(3.9, alice.dob);
  }
}
```

We can use unit testing in which we hard-code expected values for each input.
But real-world software is complex:

- We need a large number of test inputs to gain confidence that our software
  works as expected.
- Describing the expected behavior of our software for each test input is
  difficult.
- When we make intentional changes to the behavior of our software, updating our
  expected values is cumbersome.

Touca is effective in testing software workflows that need to handle a large
variety of inputs or whose expected behavior is difficult to hard-code.

```java
import io.touca.Touca;

public final class StudentsTest {

  @Touca.Workflow
  public void findStudent(final String username) {
    Student student = Students.findStudent(username);
    Touca.check("fullname", student.fullname);
    Touca.check("dob", student.dob);
    Touca.check("gpa", student.gpa);
  }

  public static void main(String[] args) {
    Touca.run(StudentsTest.class, args);
  }
}
```

This is slightly different from a typical unit test:

- Touca tests do not use expected values.
- Touca tests do not hard-code input values.

With Touca, we describe how we run our code under test for any given test case.
We can capture values of interesting variables and runtime of important
functions to describe the behavior and performance of our workflow for that test
case.

![Sample Test Output](https://touca.io/docs/external/assets/touca-run-java.dark.gif)

Now if we make changes to our workflow under test, we can rerun this test and
let Touca automatically compare our captured data points against those of a
previous baseline version and report any difference in behavior or performance.

## Documentation

- [Documentation Website](https://touca.io/docs/basics/): If you are new to
  Touca, this is the best place to start.
- [Java SDK API Reference](https://touca.io/docs/external/sdk/java/index.html):
  Auto-generated source code documentation for Touca Java SDK with explanation
  about individual API functions.
- [Java Examples](https://github.com/trytouca/trytouca/tree/main/examples/java):
  Sample Java projects that show how to use Touca in various real-world
  use-cases.

## Community

We hang on [Discord](https://touca.io/discord). Come say hi! We love making new
friends. If you need help, have any questions, or like to contribute or provide
feedback, that's the best place to be.

## License

This repository is released under the Apache-2.0 License. See
[LICENSE](https://github.com/trytouca/trytouca/blob/main/sdk/java/LICENSE).
