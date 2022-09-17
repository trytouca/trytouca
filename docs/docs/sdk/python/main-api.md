# Main API

:::info New To Touca?

Looking for documentation to get started with Touca? Follow our quicks start
tutorial [here](../../../basics/).

:::

Let's assume we'd like to test a software that takes the username of a student
and returns basic information about them including their name, date of birth,
and GPA.

```py title="02_python_main_api/students.py"
@dataclass
class Student:
    username: str
    fullname: str
    dob: datetime.date
    gpa: float

def find_student(username: str) -> Student:
    # ...
```

Here's a Touca test we can write for our code under test:

```py title="02_python_main_api/students_test.py"
import touca
from students import find_student

@touca.Workflow
def students_test(username: str):
    with touca.scoped_timer("find_student"):
        student = find_student(username)
    touca.assume("username", student.username)
    touca.check("fullname", student.fullname)
    touca.check("birth_date", student.dob)
    touca.check("gpa", student.gpa)
```

We are using the same test framework as before but we are tracking more data
about the behavior and performance of our software using various data capturing
functions. Let's see how these functions work.

## Describing the Behavior

For any given username, we can call our `find_student` function and capture the
important properties of its output that we expect to remain the same in future
versions of our software.

We can start small and capture the entire returned object as a Touca result:

```py
touca.check("student", student)
```

But what if we decided to add a field to the return value of `find_student` that
reported whether the profile was fetched from the cache? Since this information
may change every time we run our tests, we can choose to capture different
fields as separate entities.

```py
touca.assume("username", student.username)
touca.check("fullname", student.fullname)
touca.check("birth_date", student.dob)
touca.check("gpa", student.gpa)
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
imagine that our software calculates GPA of students based on their courses. If
we are just relying on the output of our function, it may be difficult to trace
a reported difference in GPA to its root cause. Assuming that the courses
enrolled by a student are not expected to change, we can track them without
redesigning our API:

```py
def calculate_gpa(courses: List[Course]):
    touca.check("courses", courses)
    return sum(k.grade for k in courses) / len(courses) if courses else 0
```

Touca data capturing functions remain no-op in production environments. They are
only activated when running in the context of a `@touca.Workflow` test function.

## Describing the Performance

Just as we can capture values of variables to describe the behavior of different
parts of our software, we can capture the runtime of different functions to
describe their performance. Touca can notify us when future changes to our
implementation result in significant changes in the measured runtime values.

```py
touca.start_timer("find_student")
student = find_student(username)
touca.stop_timer("find_student")
```

The two functions `start_timer` and `stop_timer` provide fine-grained control
for runtime measurement. If they feel too verbose, we can opt to use
`scoped_timer` instead:

```py
with touca.scoped_timer("find_student"):
    student = find_student(username)
```

It is also possible to add measurements obtained by other performance
benchmarking tools.

```py
touca.add_metric("external_source", 1500)
```

In addition to these data capturing functions, the test framework automatically
tracks the wall-clock runtime of every test case and reports it to the Touca
server.

Like other data capturing functions, we can use Touca performance logging
functions in production code, to track runtime of internal functions for
different test cases. The functions introduced above remain no-op in production
environments.
