# Best Practices

## Choosing Test Cases

Identifying the Code Under Test is the first step to developing any Test Tool.
As mentioned before, when using Touca, neither the Code Under Test nor its
direct output needs to be exposed. All we need is one or more exposed interfaces
that collectively share the same execution workflow as the Code Under Test. Once
we identify these interfaces, our objective should be to explain our Code Under
Test such that it constitutes a _pure_ function whose return value remains the
same for the same argument, and its evaluation has no side effects.

By treating the overall Code Under Test as a pure function, we can argue that
for any implementation of the code, any given list of inputs will yield a
specific list of outputs. Therefore, if a subsequent implementation of the
algorithm yields a different set of outputs for the same set of inputs, we can
argue that the changes to the function implementation have introduced
regressions.

This representation of a software component is fairly common as it allows us to
formulate the responsibilities of that component. But when building a Regression
Test Tool, we already know how our function behaves. Our focus during this
effort mentioned above is on defining the appropriate input based on the exposed
set of interfaces such that it makes our Code Under Test behave like a pure
function.

The type and definition of the input to our Workflow Under Test are arbitrary
and restricted only by the requirements of that Workflow. But the input to our
Regression Test Workflow may be different from the input to the Code Under Test,
as long as it leads to the latter. For example, a possible input to our
regression test tool may be the path to a locally stored file or directory in
which the input for the Code Under Test is stored.

We refer to any input to the Regression Test Workflow as a Test Case. When using
the Touca Test Framework, a Test Case is a short, unique, and URL-friendly
string literal to which we associate any data that is captured during the
execution of its corresponding input.

When our Code Under Test desires a complex input, we need to design a two-way
mapping between that input and what can constitute a Test Case. We do not have
any special advice for the Test Authors on how to establish this mapping.

Finally, we should keep in mind that the effectiveness of our Regression Test
depends on the variety of our Test Cases. Ideally, we should have enough Test
Cases to cover all execution branches in the Code Under Test. This may be
difficult to achieve in real-world applications where the Code Under Test may be
arbitrarily complicated. As a more practical alternative, we recommend that the
Test Cases be chosen such that they represent the range of typical inputs given
to the Code Under Test in production environments.

## Choosing Test Results

Defining Test Cases is only one of the important decisions developers of
Regression Test Tool need to make. For any given Test Case, when executing the
Code Under Test, we need to decide what information to capture as Result or
Metric. Ideally, the amount of captured data and the way they are organized
should be optimized to minimize the effort required to find the root cause of
any regression.

Touca is designed to offer great flexibility and leverage to achieve this
objective. Most other conventional test tools and practices are limited to using
the output of the Code Under Test. This practice greatly reduces the scope of
the information that can be collected and monitored for regression. It also
makes it extremely difficult to find the root cause of any newly discovered
regression.

In contrast, Touca's unique ability to integrate with the production code
enables capturing the internal state of functions of interest in their original
data type, even if those functions are not exposed. This distinction offers us
more freedom in capturing the information that we deem as relevant and helpful.

But having this added freedom calls for some general recommendations about
choosing an effective set of test results.

- As noted before, each Test Case corresponds to _some_ input to the Code Under
  Test. It is always helpful to capture as test assertion the essential
  characteristics that uniquely identify that input. Capturing this data allows
  us to quickly identify any change in the input to the Workflow Under Test and
  prevents attribution of that change to our changes to the Workflow
  implementation.

- Make sure that the captured Results are expected to remain consistent between
  different Revisions. Capturing a variable that stores the current date and
  time or a randomly generated number is guaranteed to be flagged as regression
  and only adds noise.

- We do not need to capture _all_ the information from the Code Under Test. If
  it is possible and convenient, you may choose to reproduce your software
  execution workflow in the regression test tool and capture all or some of the
  information from the Regression Test Tool. As an example, if the Code Under
  Test provides as output a complex object with various member functions that
  reveal different properties of that output, it makes more sense to capture
  Results from the Regression Test Tool by explicitly calling those member
  functions, as opposed to adding Touca function calls to the implementation of
  those member functions.

- Start small. We have observed that once users start noticing the value of
  Regression Testing with Touca, they are tempted to capture the values of all
  variables in their Code Under Test. We advise against this practice and
  recommend that you start by capturing a limited number of important variables
  from different parts of your software workflow. Variables that are in the same
  execution branch are likely to change together. Capturing all of these
  variables is only helpful if you need to track the value of each variable when
  regression occurs.

  As a general rule, a variable should be added as a separate Result when it is
  prone to be changed independently from other captured Results. This rule may
  help minimize the number of captured Results while maintaining their
  collective effectiveness in identifying potential regressions.

- For increased readability and easier maintenance, when capturing data from the
  Code Under Test, try to maintain a physical separation between Touca function
  calls and the function's core logic. Even though Touca function calls are a
  no-op in the production environment, they are still considered test-specific
  logic. We suggest that you capture Results at the end of functions living in
  the Code Under Test.

- Always assume that the function you are capturing results from is called by
  other Regression Test Tools that execute a different software workflow. In
  other words, in any function, only capture information that is relevant to
  that function and may be valuable to other regression test workflows that
  happen to execute that function.
