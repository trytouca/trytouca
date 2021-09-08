# Main API of Python SDK

[So far](./quickstart.md), we learned how to write and run a simple Touca test
using the Touca SDK for Python. But our previous `is_prime` example was too
minimal to show how Touca can help us describe the behavior and performance of
real-world software workflows. Let us use a Profile Lookup software as another
example that takes the username of a student and returns basic information about
them, such as their name, date of birth, and GPA.

```py
def parse_profile(username: str) -> Student:
```

where `Student` has the following properties:

```py
@dataclass
class Student:
    username: str
    fullname: str
    dob: datetime.date
    gpa: float
```

Here's a Touca test we can write for our code under test:

```py
import touca
from students import parse_profile

@touca.Workflow
def students_test(username: str):
    touca.start_timer("parse_profile")
    student = parse_profile(username)
    touca.stop_timer("parse_profile")
    touca.add_assertion("username", student.username)
    touca.add_result("fullname", student.fullname)
    touca.add_result("birth_date", student.dob)
    touca.add_result("gpa", student.gpa)
    touca.add_metric("external_source", 1500)

if __name__ == "__main__":
    touca.run()
```

While we are using the same test framework as before, we are tracking more data
about the behavior and performance of our software using various data capturing
functions. In this tutorial, we will learn how these functions work and how they
can help us detect regressions in future versions of our software.

## Describing Behavior

For any given username, we can call our `parse_profile` function and capture the
properties of its output that are expected to remain the same in future versions
of our software.

We can start small and capture the entire returned object as a Touca result:

```py
touca.add_result("student", student)
```

Adding the output object as a single entity works. But what if we decided to add
a field to the return value of `parse_profile` that reported whether the profile
was fetched from the cache?

Since this information may change every time we run our tests, we can choose to
capture different fields as separate entities.

```py
touca.add_assertion("username", student.username)
touca.add_result("fullname", student.fullname)
touca.add_result("birth_date", student.dob)
touca.add_result("gpa", student.gpa)
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

```py
def calculate_gpa(courses: List[Course]):
    touca.add_result("courses", courses)
    return sum(k.grade for k in courses) / len(courses) if courses else 0
```

Touca data capturing functions remain no-op in production environments. They are
only activated when running in the context of a `touca.workflow` function call.

## Describing Performance

Just as we can capture values of variables to describe the behavior of different
parts of our software, we can capture the runtime of different functions to
describe their performance.

Touca can notify us when future changes to our implementation result in
significantly changes in the measured runtime values.

```py
touca.start_timer("parse_profile")
student = parse_profile(username)
touca.stop_timer("parse_profile")
```

The two functions `start_timer` and `stop_timer` provide fine-grained control
for runtime measurement. If they feel too verbose, we can opt to use
`scoped_timer` as an alternatives:

```py
with touca.scoped_timer("parse_profile"):
    student = parse_profile(username)
```

It is also possible to add measurements obtained by other performance
benchmarking tools.

```py
touca.add_metric("external_source", 1500)
```

In addition to these data capturing functions, Touca test framework
automatically tracks the wall-clock runtime of every test case and reports it to
the Touca server.

Like other data capturing functions, we can use Touca performance logging
functions in production code, to track runtime of internal functions for
different test cases. The functions introduced above remain no-op in production
environments.
