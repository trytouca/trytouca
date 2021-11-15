# Main API of JavaScript SDK

[So far](./quickstart.md), we learned how to write and run a simple Touca test
using the Touca SDK for JavaScript. But our previous `is_prime` example was too
minimal to show how Touca can help us describe the behavior and performance of
real-world software workflows. Let us use a Profile Lookup software as another
example that takes the username of a student and returns basic information about
them, such as their name, date of birth, and GPA.

```typescript
export async function find_student(username: string): Student;
```

where `Student` has the following properties:

```typescript
interface Student {
  username: string;
  fullname: string;
  dob: Date;
  gpa: number;
}
```

Here's a Touca test we can write for our code under test:

```typescript
import { touca } from "@touca/node";
import { find_student } from "./students";

touca.workflow("students_test", async (username: string) => {
  touca.start_timer("find_student");
  const student = await find_student(username);
  touca.stop_timer("find_student");
  touca.assume("username", student.username);
  touca.check("fullname", student.fullname);
  touca.check("birth_date", student.dob);
  touca.check("gpa", student.gpa);
  touca.add_metric("external_source", 1500);
});

touca.run();
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

```typescript
touca.check("student", student);
```

Adding the output object as a single entity works. But what if we decided to add
a field to the return value of `find_student` that reported whether the profile
was fetched from the cache?

Since this information may change every time we run our tests, we can choose to
capture different fields as separate entities.

```typescript
touca.assume("username", student.username);
touca.check("fullname", student.fullname);
touca.check("birth_date", student.dob);
touca.check("gpa", student.gpa);
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

```typescript
function calculate_gpa(courses: Course[]): number {
  touca.check("courses", courses);
  return courses.reduce((sum, v) => sum + v.grade, 0) / courses.length;
}
```

Touca data capturing functions remain no-op in production environments. They are
only activated when running in the context of a `touca.workflow` function call.

## Describing Performance

Just as we can capture values of variables to describe the behavior of different
parts of our software, we can capture the runtime of different functions to
describe their performance.

Touca can notify us when future changes to our implementation result in
significantly changes in the measured runtime values.

```typescript
touca.start_timer("find_student");
const student = find_student(username);
touca.stop_timer("find_student");
```

The two functions `start_timer` and `stop_timer` provide fine-grained control
for runtime measurement. If they feel too verbose, we can opt to use
`scoped_timer` as an alternatives:

```typescript
const student = await touca.scoped_timer("find_student", () =>
  find_student(username)
);
```

It is also possible to add measurements obtained by other performance
benchmarking tools.

```typescript
touca.add_metric("external_source", 150);
```

In addition to these data capturing functions, Touca test framework
automatically tracks the wall-clock runtime of every test case and reports it to
the Touca server.

Like other data capturing functions, we can use Touca performance logging
functions in production code, to track runtime of internal functions for
different test cases. The functions introduced above remain no-op in production
environments.
