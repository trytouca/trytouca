# Basic Terms

In this section, we provide our definition for some basic terms that may be
overloaded and prone to ambiguity, given that they are widely used in various
Software Testing practices.

- **Workflow Under Test**: Any part of a software product that we want to test.
  At a high level, any Workflow takes _some_ set of inputs and performs _some_
  operation, possibly producing _some_ output. With this definition, a Workflow
  may be as small as a function or as large as the entire software product.
- **Test Tool**: A standalone application that can invoke our Workflow once or
  several times with one or more sets of inputs. A Test Tool always produces
  some output to help us determine whether the behavior of our Workflow was as
  we expected.
- **Test Case**: Any input that is provided, all at once, to our Workflow. To
  gain confidence in the behavior of the Workflow, oftentimes, we test it with
  multiple Test Cases to cover a broad spectrum of the possible behaviors of our
  Workflow. For this reason, an effective Test Case is one that triggers a
  unique and consistent behavior by our Workflow.
- **Test Result**: Any data, captured by the Test Tool when running a particular
  Test Case, that characterizes some aspect of the _behavior_ of the Workflow.
- **Performance Benchmark**: Any time duration, captured by the Test Tool when
  running a particular Test Case, that characterizes some aspect of the
  _performance_ of the Workflow.
- **Version**: a unique identifier for the implementation of our Workflow at a
  particular point in time. In practice, a Version may be the version number of
  our software product or a prefix of the SHA of our last git commit, or any
  arbitrary name that reminds us of a given implementation of our Workflow.

With the above terms, we can now define a **Regression Test Tool** as a Test
Tool that can perform the following:

1.  Execute a Version of a Workflow with a set of Test Cases
2.  Capture Results and Metrics for each Test Case
3.  Enable comparison of the captured data against the captured data for another
    Version

The comparison in step 3 is particularly helpful when data we are comparing
against belongs to a Version of the Workflow whose behavior and performance are
acceptable by the development team. We define this Version as the **Baseline**.
