# Core API

[Previously](/sdk/java/main-api), we covered the high-level API of our Java SDK
and learned how to test a `findStudent` software using the Touca test framework:

```java
import io.touca.Touca;

public class StudentsTest {
    public static void main(String[] args) {
        Touca.workflow("students_test", (final String username) -> {
            Student student = Students.findStudent(username);
            // insert code here to describe the behavior
            // and performance of the workflow under test
        });
        Touca.run(args);
    }
}
```

Functions `Touca.workflow` and `Touca.run` are the entry-points to the Touca
test framework. In addition to running our workflow under test with different
test cases, the test framework provides facilities that include reporting
progress, handling errors, parsing command line arguments, and many more. We
intentionally designed this API to abstract away these common features to let
developers focus on their workflow under test.

Touca SDK for Java provides a separate lower-level Client API that offers more
flexibility and control over how tests are executed and how their results are
handled. This API is most useful when integrating Touca with other existing test
frameworks.

```java
import java.io.IOException;
import io.touca.Touca;

public class StudentsTest {
  public static void main(String[] args) throws IOException {
    Touca.configure(options -> {
      options.apiKey = "<TOUCA_API_KEY>";
      options.apiUrl = "<TOUCA_API_URL>";
      options.version = "<TOUCA_TEST_VERSION>";
    });
    for (String username : Touca.getTestcases()) {
      Touca.declareTestcase(username);

      Student student = Students.findStudent(username);
      // insert code here to describe the behavior
      // and performance of the workflow under test

      Touca.post();
      Touca.saveJson(String.format("touca_%s.json", username));
      Touca.saveBinary(String.format("touca_%s.bin", username));
      Touca.forgetTestcase(username);
    }
    Touca.seal();
  }
}
```

The above code uses the low-level Touca Client API to perform the same
operations as the Touca test framework, without handling errors, reporting
progress, and handling command line arguments. In this section, we will review
the functions used in this code and explain what they do.

## Configuring the Client

Touca Client requires a one-time call of function `configure`. This
configuration effectively activates all other Touca functions for capturing data
and submission of results. Therefore, this function must be called from our test
tool, and not from our code under test. This design enables us to leave the
calls to Touca data capturing functions in our production code without having to
worry about their performance impact.

The `configure` function can take various configuration parameters including the
Touca API Key and API URL. You can also specify an external JSON configuration
file via the `file` option. Check out Java SDK reference API documentation for
the full list of acceptable configuration parameters and their impact.

```java
Touca.configure(opt -> {
  opt.apiKey = "<TOUCA_API_KEY>";
  opt.apiUrl = "<TOUCA_API_URL>";
  opt.version = "<TOUCA_TEST_VERSION>";
});
```

> Touca API Key should be treated as a secret. We advise against hard-coding
> this parameter.

The three common parameters, API Key, API URL, and version of the code under
test can also be set as environment variables `TOUCA_API_KEY`, `TOUCA_API_URL`,
and `TOUCA_TEST_VERSION`. Environment variables always override the parameters
passed to the `configure` function.

All of the configuration parameters passed to `configure` are optional. When
`api_key` and `api_url` are missing, the client is configured in the offline
mode. It can still capture data and store them to files but it will not submit
them to the Touca server.

You can always force the client to run in offline mode by passing the `offline`
parameter to the `configure` function.

## Preparing Test Cases

```java
for (String username: Touca.getTestcases()) {
  // insert the code to run for each test case
}
```

The test framework expects test cases to be specified via the Touca server UI or
via command line arguments. With the Client API, you can obtain the list of test
cases from any source and pass them, one by one, to your code under test using a
simple for loop.

You can still use the function `getTestcases` to obtain the list of test cases
from the Touca server, as our high-level API does. This function should be
called when the client is configured to run in offline mode.

## Declaring Test Cases

Once the client is configured, you can call `declareTestcase` once for each test
case to indicate that all subsequent captured data and performance benchmarks
belong to the specified test case, until a different test case is declared. We
can change this behavior for multi-threaded software workflows.

```java
for (String username: Touca.getTestcases()) {
  Touca.declareTestCase(username);
  // now we can start calling our code under test
  // and describing its behavior and performance
}
```

With Touca, we consider test cases as a set of unique names that identify
different inputs to our code under test. These inputs can be anything as long as
they are expected to produce the same behavior every time our code is executed.

Similar to `Touca.configure`, we should only call `Touca.declareTestcase` from
our test tool, and not from our code under test.

## Capturing Test Results

In the [previous document](./main-api.md), we reviewed the main Touca functions
for describing behavior and performance of our code under test, by capturing
values of important variables and runtime of interesting functions. In this
section, we dive a little deeper to explain how Touca tracks values of variables
and performance benchmarks.

### Preserving Data Types

Touca data capturing functions such as `Touca.check`, preserve the types of all
captured data so that the Touca server can compare them in their original type.

```java
Touca.check("username", student.username);
Touca.check("fullname", student.fullname);
Touca.check("birth_date", student.dob);
Touca.check("gpa", student.gpa);
```

In the example above, `Touca.check` stores value of properties `username` and
`fullname` as string while properties `dob` and `gpa` are stored as `LocalDate`
and `float` respectively. The server visualizes possible differences in these
values based on their types.

The SDK is designed to handle iterables and custom objects by serializing their
elements and properties. This makes it possible for us to add object `student`
as a single entity, if we so choose.

### Customizing Data Serialization

While Touca data capturing functions automatically support objects and custom
types, it is possible to override the serialization logic for any given
non-primitive data type.

Consider the following definition for a custom class `Course`.

```java
public final class Course {
    public String name;
    public double grade;
};
```

By default, the SDK serializes objects of this class using by serializing all of
its public properties. This behavior results in object `Course("math", 3.9)` to
be serialized as `{name: "math", grade: 3.9}`. We can use `Touca.addTypeAdapter`
to override this default behavior. The following code excludes the property
`name` during serialization and limits the comparison to `grade`:

```java
Touca.addTypeAdapter(Course.class, course -> course.grade);
for (Course course: student.courses) {
    Touca.addArrayElement("courses", course);
    Touca.addHitCount("number of courses");
}
```

It is sufficient to register each serializer once per lifetime of the test
application.

## Submitting Test Results

Once we execute our code under test for each test case and describe its behavior
and performance, we can submit them to the Touca server.

```java
Touca.post();
```

The server stores the captured data, compares them against the submitted data
for pervious versions of our code, visualizes any differences, and reports them
in real-time.

It is possible to call `Touca.post` multiple times during the runtime of our
test tool. Test cases already submitted to the Touca server whose results have
not changed, will not be resubmitted. It is also possible to add new results for
an already submitted test case. Any subsequent call to `Touca.post` will
resubmit the modified test cases.

We generally recommend that `Touca.post` be called every time the code under
test is executed for a given test case. This practice ensures real-time feedback
about the test results, as they are being executed.

## Storing Test Results

We can choose to store captured test results and performance benchmarks for one
or more of our declared test cases on the local filesystem for further
processing or later submission to the Touca server.

```java
Touca.saveBinary(String.format("touca_%s.bin", username));
Touca.saveJson(String.format("touca_%s.json", username));
```

We can store captured data in JSON or binary format using `Touca.saveJson` or
`Touca.saveBinary` respectively. While JSON files are preferable for quick
inspections, only binary files may be posted to the Touca server at a later
time.

## Forgetting Test Cases

You can use `Touca.forgetTestcase` to free up memory for a given testcase.

```java
touca.forgetTestcase("alice");
```

## Sealing Test Results

When all the test cases are executed for a given version of our code under test,
we have the option to seal the version to let the server know that no further
test result is expected to be submitted for it. This allows the server to send
the final comparison result report to interested users, as soon as it is
available.

```java
Touca.seal();
```

Sealing the version is optional. The Touca server automatically performs this
operation once a certain amount of time has passed since the last test case was
submitted.
