# About Touca

## What is Touca?

Touca is a continuous regression testing system that helps engineering teams
understand the true impact of their code changes on the behavior and performance
of their software. It is especially designed for testing mission-critical
systems at scale and with a variety of real-world inputs. We want to reduce the
risk of making code changes to these systems.

Touca offers open-source client libraries that help you test your complex
workflows with any number of real-world inputs. They let you capture the values
of interesting variables and the runtime of functions, from anywhere within your
code, to describe the behavior and performance of your workflow for each input.
They submit this information to a remote Touca Server where they are stored and
compared against your baseline. If differences are found, Touca visualizes those
differences, produces easy-to-understand reports, and notifies you so you can
collaborate with other members of your team and decide whether such differences
are expected.

By automating the submission, comparison, and management of your test results,
Touca seamlessly integrates with your development workflow without causing
interference and requiring regular maintenance.

## Who is Touca for?

Touca is most useful for testing software workflows whose overall behavior must
be checked with inputs that are too many in number or too large in size, to be
fed into unit tests. In these systems, the expected output of workflows for
different inputs cannot be described as unit test assertions. Regression testing
is an effective method for these workflows. It complements unit testing to
control if and how the daily code changes affect the expected behavior of these
workflows.

Some examples for the types of software that can greatly benefit from using
Touca include medical and financial software, machine learning algorithms,
robotics, and autonomous driving systems.

## What problem does Touca solve?

While Software is eating the world, the labor of building and maintaining it
remains largely manual. On average, every engineer spends 17 hours every week
maintaining existing code. This includes refactoring code, fixing defects, and
architectural updates to enable further growth. This number may be higher in
organizations maintaining mission-critical systems, where the risk of breaking
the product holds engineers back from making regular code changes.

Touca reduces the risk of making code changes to critical software components,
by enabling engineering teams to continuously test those components with any
number of real-world inputs and understand the true impact of their code
changes.

Many existing products offer visual regression testing for web applications. But
a large subset of software developed every year is in products that have limited
or no user interface. A common existing solution for testing these products is
snapshot testing, a form of regression testing that stores the output of a given
version of software workflows in snapshot files.

Most snapshot testing libraries leave the comparison and management of these
files to software engineers. Managing result files for hundreds of test cases is
not feasible at scale. Touca manages all submitted test results, compares them
against previous versions, and reports differences in an easy-to-understand
format so that engineers only need to decide what to do with those differences.

Because snapshot files store the overall output of a workflow, they may contain
dynamic data such as timestamps, that can trigger false positives during
comparison. They can miss important information that may not necessarily be
exposed through the software interface. Touca gives you fine-grained control
over what variables and return values to capture as test results. Touca client
libraries preserve the types of your captured data and compare your test results
using their original data type.

## How Did Touca Start?

Touca started as an internal tool at
[Vital Images Inc.](https://vitalimages.com), a Canon Group company, to help
with testing a software product for
[3D visualization of medical images](https://www.youtube.com/watch?v=LEuNpEOzNSo).
It was first used to test a complex product component responsible for ingesting
MRI and CT scan datasets and producing an in-memory representation of each
dataset, ready for consumption by rendering algorithms and high-level clinical
applications. This 500K line-of-code component had no clear user interface and
was expected to correctly handle thousands of datasets of various
characteristics.

## What to read next

If you are interested in learning more about Touca, we recommend that you read
our [Quickstart guide](getting-started/quickstart.md) next. It is specifically
written to give you a basic understanding of how Touca works in action.
