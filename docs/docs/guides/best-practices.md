# Best Practices

## Choosing Test Cases

Identifying the code under test is the first step to developing any test tool.
We recommend that you choose your code under test such that it constitutes a
_pure_ function whose return value remains the same for the same argument, and
its evaluation has no side effects. This way, for any implementation of our
code, any given input will yield a specific output. If a subsequent
implementation yields a different output for the same input, we can argue that
the changes in the implementation have introduced regressions.

The type and definition of the input to our code under test are arbitrary and
restricted only by the requirements of our workflow. But Touca tests always take
a short, unique, and URL-friendly string as test case. As an example, a possible
test case for our Touca test may be the name of a locally stored file or
directory in which the input for the code under test is stored. It is up to us
to load the actual input to our code under test based on the filename provided
as test case.

The effectiveness of a Touca test depends, in part, on the variety of its test
cases. Ideally, we should have enough test cases to cover all execution branches
of our code under test. This may be difficult to achieve in real-world
applications where the code under test may be arbitrarily complicated. As a more
practical alternative, we recommend that the test cases be chosen such that they
represent the range of typical inputs given to our software in production
environments.

## Choosing Test Results

Most other conventional test methods are limited to using the output of the code
under test, which reduces the scope of information that can be collected and
monitored for regression. It also makes it difficult to find the root cause of
any newly discovered regression.

In contrast, Touca SDKs can integrate with the production code to capture values
of important variables and runtime of interesting functions, even if those
functions are not exposed. The effectiveness of Touca tests depends on the data
we capture. We should capture enough information to help us detect changes in
behavior and performance. AT the same time, capturing too much data with little
value may generate false positives or make it difficult to trace a discovered
regression to its root cause.

Here are some general recommendations for choosing an effective set of test
results:

- Each test case corresponds to _some_ input to the code under test. It is
  always helpful to capture as test assertion the essential characteristics that
  uniquely identify that input. Capturing this data allows us to quickly
  identify any change in the input to the code under test. It prevents
  attribution of that change to our changes to the production code.

- We should only capture values of variables that are expected to remain
  consistent between different revisions. Capturing a variable that stores the
  current date and time or a randomly generated number is guaranteed to be
  flagged as regression and only adds noise.

- We do not need to capture _all_ the information from the code under test. If
  it is possible and convenient, we may choose to reproduce our software
  execution workflow in the test tool and capture all or some of the information
  from the test tool. As an example, if the code under test provides as output a
  complex object with various member functions that reveal different properties
  of that output, it makes more sense to capture results from the test tool by
  explicitly calling those member functions, as opposed to adding data capturing
  functions to the implementation of those member functions.

- Start small. It is tempting to capture the values of all variables. We advise
  against this practice and recommend that you start by capturing a limited
  number of important variables from different parts of your software workflow.
  Variables that are in the same execution branch are likely to change together.
  Capturing all of these variables is only helpful if you need to track the
  value of each variable when regression occurs.

  As a general rule, a variable should be added as a separate result when it is
  prone to change independently. This rule may help minimize the number of
  tracked data points while maintaining their effectiveness in identifying
  potential regressions.

- For increased readability and easier maintenance, when capturing data from the
  code under test, try to maintain a physical separation between Touca function
  calls and the function's core logic. Even though Touca function calls are a
  no-op in the production environment, they are still considered test-specific
  logic.

- Always assume that the function you are capturing results from is called by
  other Touca test tools that execute a different software workflow. In other
  words, in any function, only capture information that is relevant to that
  function and may be valuable to other test workflows that happen to execute
  that function.
