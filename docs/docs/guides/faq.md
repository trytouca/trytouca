# FAQ

## What programming languages do you support?

The Touca server is language agnostic. But you would need to use one of our SDKs
to capture test results and submit them to the server. We currently provide SDKs
for C++, Python, Java, and JavaScript.

## What types of software can benefit from Touca the most?

Touca is very effective in addressing common problems in the following
situations:

- When we need to test our workflow with a large number of test cases with
  various characteristics.
- When the output of our workflow is too complex, or too difficult to describe
  in our unit tests.
- When interesting information to check for regression is not exposed through
  the interface of our workflow.

These workflows are difficult to unit test because unit testing requires
hard-coding the test cases and their corresponding expected output. Maintaining
unit tests for these workflows is also costly. We would need to adjust out test
code every time our software requirements change.

Unlike unit testing, Touca only captures the actual behavior and performance of
our workflow. This approach makes Touca test logic independent of our test cases
so we can test our workflows with any number of test cases without changing our
test code. Because we no longer need to explicitly hard-code expected values, we
can use Touca data capturing functions anywhere within our code to track changes
in important variables, even if they are not exposed in the output of our code
under test.

## What types of data can we capture as test results?

At the moment, we do not support comparing images, audio, video or external
output files.

Touca SDKs have native support for primitive data types such as integers and
floating point numbers, characters and string, arrays and maps. In addition,
each SDK has out of the box support for specific data types commonly used in its
respective programming language.

Touca SDKs also support custom user-defined types. Touca SDKs for Python and
JavaScript offer this support out of the box. Other SDKs like C++ provide this
support through an extensible type system. Consult with the documentation for
each SDK to refer.

## How many test cases can be declared for a test suite?

There is no fixed upper limit. Touca server can handle several thousands of test
cases in a given Suite and several hundred thousands of keys in a test case. For
best performance, we suggest that you keep the number of test cases in a Suite
below one thousand. Refer to our [Best Practices](../guides/best-practices.md)
document to learn more.
