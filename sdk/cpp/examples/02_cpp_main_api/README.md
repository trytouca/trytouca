# Touca C++ SDK

In the [previous tutorial](../01_cpp_minimal), we showed how to write and run a
simple Touca test using our C++ SDK. But our `is_prime` example was too minimal
to show how Touca can help us describe the behavior and performance of
real-world software workflows.

In this tutorial, we will test a Profile Lookup application that takes the
username of a student and returns basic information about them, such as their
name, date of birth, and GPA.

Let us imagine that our code under test has the following entry-point. See
[`students.cpp`](students.cpp) for a possible implementation.

```cpp
Student parse_profile(const std::string& username);
```

where `Student` has the following members:

```cpp
struct Student {
    std::string username;
    std::string fullname;
    Date dob;
    float gpa;
};
```

Here's a Touca test we can write for our code under test:

```cpp
#include "students.hpp"
#include "students_types.hpp"
#include "touca/touca_main.hpp"

void touca::main(const std::string& username)
{
    const auto& student = parse_profile(username);
    // more to write here
}
```

## Describing Behavior

For any given username, we can call our `parse_profile` function and capture the
properties of its output that are expected to remain the same in future versions
of our software.

We can start small and capture the entire returned object as a Touca result:

```cpp
  touca::add_result("student", student);
```

We can run our test from the command line:

```bash
export TOUCA_API_KEY="your-api-key"
export TOUCA_API_URL="your-api-url"
./local/dist/bin/example_cpp_main_api --revision v1.0 --testcase-file ./testcases.txt
```

Where `./testcases.txt` has the following content:

```text
alice
bob
charlie
```

the Touca SDK captures the `Student` object with all its properties and submits
that information to the Touca server. We can check this output on the web app
but we can also ask the SDK to generate a JSON result file for us:

```bash
./local/dist/bin/example_cpp_main_api --revision v2.0 --save-as-json
```

You can use `--help` to learn about available command line options.

Notice that we are not specifying the list of test cases anymore. When they are
not explicitly provided, the SDK fetches this list from the Touca server.

Adding the output object as a single entity works. But what if we decided to add
a field to the return value of `parse_profile` that reported whether the profile
was fetched from the cache?

Since this information may change every time we run our tests, we can choose to
capture different fields as separate entities.

```cpp
  touca::add_assertion("username", student.username);
  touca::add_result("fullname", student.fullname);
  touca::add_result("birth_date", student.dob);
  touca::add_result("gpa", student.gpa);
```

This approach allows Touca to report differences in a more helpful format,
providing analytics for different fields. If we changed our `parse_profile`
implementation to always capitalize student names, we could better visualize the
differences to make sure that only the value associated with key `fullname`
changes across our test cases.

Note that we used Touca function `add_assertion` to track the `username`. Touca
does not visualize the values captured as assertion unless they are different.

We can capture the value of any number of variables, including the ones that are
not exposed by the interface of our code under test. In our example, let us
imagine that our software calculates GPA of students based on their courses.

If we are just relying on the output of our function, it may be difficult to
trace a reported difference in GPA to its root cause. Assuming that the courses
enrolled by a student are not expected to change, we can track them without
redesigning our API:

```cpp
float calculate_gpa(const std::vector<Course>& courses)
{
    touca::add_result("courses", courses);
    const auto& sum = std::accumulate(courses.begin(), courses.end(), 0.0f,
        [](const float sum, const Course& course) {
            return sum + course.grade;
        });
    return courses.empty() ? 0.0f : sum / courses.size();
}
```

Touca data capturing functions remain no-op in production environments. They are
only activated when running in the context of a `touca::main` function call. See
the next tutorial to learn more.

## Describing Performance

Just as we can capture values of variables to describe the behavior of different
parts of our software, we can capture the runtime of different functions to
describe their performance.

Touca can notify us when future changes to our implementation result in
significantly changes in the measured runtime values.

```cpp
    touca::start_timer("parse_profile");
    const auto& student = parse_profile(username);
    touca::stop_timer("parse_profile");
```

The two functions `start_timer` and `stop_timer` provide fine-grained control
for runtime measurement. If they feel too verbose, we can opt to use
`scoped_timer` as an alternatives:

```cpp
Student parse_profile(const std::string& username)
{
    TOUCA_SCOPED_TIMER;
    // implementation
}
```

We can also measure the lifetime of a scoped variable:

```cpp
  touca::scoped_timer timer("parse_profile");
```

It is also possible to add measurements obtained by other performance
benchmarking tools.

```cpp
  touca::add_metric("external_source", 1500);
```

In addition to these data capturing functions, Touca test framework
automatically tracks the wall-clock runtime of every test case and reports it to
the Touca server.

Like other data capturing functions, we can use Touca performance logging
functions in production code, to track runtime of internal functions for
different test cases. The functions introduced above remain no-op in production
environments.
