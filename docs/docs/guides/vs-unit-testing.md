# Touca vs. Unit Testing

Unit testing is the most established and effective method of testing software.
Unit tests often give the fastest feedback to engineering teams and provide
basic levels of confidence in the core functionality of small units of code.

Touca complements unit testing to provide higher levels of confidence in the
impact of day to day code changes on the behavior and performance of larger
system components across a much larger set of inputs.

Touca tests are slower to run but because they run continuously as part of the
software development workflow, they often provide feedback before individual
code changes are merged into the product, giving engineering teams increased
confidence that their changes work as they expect.

Here is a typical unit test for a simple software workflow that takes the
username of a student and provides basic information about them.

```py
from datetime import date
from students import find_student

def test_find_student():
    alice = find_student("alice")
    assert alice.fullname == "Alice Anderson"
    assert alice.dob == date(2006, 3, 1)
    assert alice.gpa == 3.9

    bob = find_student("bob")
    assert bob.fullname == "Bob Brown"
    assert bob.dob == date(1996, 6, 30)
    assert bob.gpa == 3.8

    charlie = find_student("charlie")
    assert charlie.fullname == "Charlie Clark"
    assert charlie.dob == date(2003, 9, 19)
    assert charlie.gpa == 3.3
```

With unit testing, we call our code under test, once for each test input, and
match its actual output against expected values that we hard-code as part of our
test logic.

In the example above, our code under test has low intrinsic complexity and its
input and output are simple enough that make it ideal for unit testing. But what
if our software workflow took the profile picture of a student instead of their
username? In that case:

- We would need a large number of input images to gain confidence that our
  algorithm works correctly.
- Describing the expected output for each image would be cumbersome.
- When we make changes to our code under test, accurately reflecting those
  changes in our expected values would be time-consuming.

Here's a typical Touca test to address these challenges:

```py
import touca
import computer_vision_model as code_under_test

def find_testcases():
    for file in Path("images").rglob("*.jpg"):
        yield file.stem

@touca.workflow(testcases=find_testcases)
def find_students(filename: str):
    profile_picture = Path("images").joinpath(filename).with_suffix(".jpg")
    student = code_under_test.predict(profile_picture)
    touca.check("fullname", student.fullname)
    touca.check("dob", student.dob)
    touca.check("gpa", student.gpa)
```

Unlike unit testing, Touca only captures the actual behavior and performance of
our workflow and compares them against a previous trust version. This approach
makes Touca test code decoupled from our test inputs, allowing us to scale the
number of our test inputs without increasing the overall maintenance cost of our
test.

Touca is very effective in addressing common problems in the following
situations:

- When we need to test our workflow with a large number of test cases with
  various characteristics.
- When the output of our workflow is too complex, or too difficult to describe
  in our unit tests.
- When interesting information to check for regression is not exposed through
  the interface of our workflow.
