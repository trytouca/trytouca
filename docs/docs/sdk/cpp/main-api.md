# Main API

:::info New To Touca?

Checkout our [Quick Start](https://touca.io/docs/basics/) guide to learn how to
get started with Touca.

:::

Let's assume we'd like to test a software that takes the username of a student
and returns basic information about them including their name, date of birth,
and GPA.

```cpp
Student find_student(const std::string& username);
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
#include "touca/touca.hpp"

int main(int argc, char* argv[]) {
  touca::workflow("find_student", [](const std::string& username) {
    const auto& student = find_student(username);
    touca::assume("username", student.username);
    touca::check("fullname", student.fullname);
    touca::check("birth_date", student.dob);
    touca::check("gpa", student.gpa);
    touca::add_metric("external_source", 1500);
  });
  return touca::run(argc, argv);
}
```

While we are using the same test framework as before, we are tracking more data
about the behavior and performance of our software using various data capturing
functions. In this tutorial, we will learn how these functions work and how they
can help us detect regressions in future versions of our software.

## Describing Behavior

For any given username, we can call our `find_student` function and capture the
properties of its output that are expected to remain the same in future versions
of our software.

We can start small and capture the entire returned object as a Touca result:

```cpp
touca::check("student", student);
```

Adding the output object as a single entity works. But what if we decided to add
a field to the return value of `find_student` that reported whether the profile
was fetched from the cache?

Since this information may change every time we run our tests, we can choose to
capture different fields as separate entities.

```cpp
touca::assume("username", student.username);
touca::check("fullname", student.fullname);
touca::check("birth_date", student.dob);
touca::check("gpa", student.gpa);
```

This approach allows Touca to report differences in a more helpful format,
providing analytics for different fields. If we changed our `find_student`
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

```cpp
float calculate_gpa(const std::vector<Course>& courses) {
  touca::check("courses", courses);
  const auto& sum = std::accumulate(courses.begin(), courses.end(), 0.0f,
      [](const float sum, const Course& course) {
        return sum + course.grade;
      });
  return courses.empty() ? 0.0f : sum / courses.size();
}
```

Touca data capturing functions remain no-op in production environments. They are
only activated when running in the context of the `touca::run` function call.

## Describing Performance

Just as we can capture values of variables to describe the behavior of different
parts of our software, we can capture the runtime of different functions to
describe their performance.

Touca can notify us when future changes to our implementation result in
significantly changes in the measured runtime values.

```cpp
touca::start_timer("find_student");
const auto& student = find_student(username);
touca::stop_timer("find_student");
```

The two functions `start_timer` and `stop_timer` provide fine-grained control
for runtime measurement. If they feel too verbose, we can opt to use
`scoped_timer` as an alternatives:

```cpp
Student find_student(const std::string& username) {
  TOUCA_SCOPED_TIMER;
  // implementation
}
```

We can also measure the lifetime of a scoped variable:

```cpp
touca::scoped_timer timer("find_student");
```

It is also possible to add measurements obtained by other performance
benchmarking tools.

```cpp
touca::add_metric("external_source", 1500);
```

In addition to these data capturing functions, the test framework automatically
tracks the wall-clock runtime of every test case and reports it to the Touca
server.

Like other data capturing functions, we can use Touca performance logging
functions in production code, to track runtime of internal functions for
different test cases. The functions introduced above remain no-op in production
environments.
