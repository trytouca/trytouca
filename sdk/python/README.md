# Touca Python SDK

[![PyPI](https://img.shields.io/pypi/v/touca?color=blue)](https://pypi.org/project/touca/)
[![License](https://img.shields.io/pypi/l/touca?color=blue)](https://github.com/trytouca/trytouca/blob/main/sdk/python/LICENSE)
[![PyPI - Python Version](https://img.shields.io/pypi/pyversions/touca)](https://pypi.org/project/touca)
[![Build Status](https://img.shields.io/github/actions/workflow/status/trytouca/trytouca/build.yml?branch=main)](https://github.com/trytouca/trytouca/actions/workflows/build.yml?query=branch:main+event:push)
[![Documentation Status](https://readthedocs.org/projects/touca-python/badge/?version=latest)](https://touca-python.readthedocs.io)
[![Code Coverage](https://img.shields.io/codecov/c/github/trytouca/trytouca)](https://app.codecov.io/gh/trytouca/trytouca)

## Install

```bash
pip install touca
```

We support Python v3.6 and newer.

## Sneak Peak

> For a more thorough guide of how to use Touca SDK for Python, refer to our
> [documentation website](https://touca.io/docs).

Let us imagine that we want to test a software workflow that takes the username
of a student and provides basic information about them.

```python
def test_find_student():
    alice = find_student("alice")
    assert alice.fullname == "Alice Anderson"
    assert alice.dob == date(2006, 3, 1)
    assert alice.gpa == 3.9
```

We can use unit testing in which we hard-code expected values for each input.
But real-world software is complex:

- We need a large number of test inputs to gain confidence that our software
  works as expected.
- Describing the expected behavior of our software for each test input is
  difficult.
- When we make intentional changes to the behavior of our software, updating our
  expected values is cumbersome.

Touca is effective in testing software workflows that need to handle a large
variety of inputs or whose expected behavior is difficult to hard-code.

```python
import touca
from students import find_student

@touca.workflow(testcases=["alice", "bob", "charlie"])
def students_test(username: str):
    student = find_student(username)
    touca.check("fullname", student.fullname)
    touca.check("dob", student.dob)
    touca.check("gpa", student.gpa)
```

This is slightly different from a typical unit test:

- Touca tests do not use expected values.
- Touca tests do not hard-code input values.

With Touca, we describe how we run our code under test for any given test case.
We can capture values of interesting variables and runtime of important
functions to describe the behavior and performance of our workflow for that test
case.

![Sample Test Output](https://touca.io/docs/img/assets/touca-run-python.dark.gif)

Now if we make changes to our workflow under test, we can rerun this test and
let Touca automatically compare our captured data points against those of a
previous baseline version and report any difference in behavior or performance.

## Documentation

- [Documentation Website](https://touca.io/docs/basics/): If you are new to
  Touca, this is the best place to start.
- [Python SDK API Reference](https://touca.io/docs/external/sdk/python/index.html):
  Auto-generated source code documentation for Touca Python SDK with explanation
  about individual API functions.
- [Python Examples](https://github.com/trytouca/trytouca/tree/main/examples/python):
  Sample Python projects that show how to use Touca in various real-world
  use-cases.

## Community

We hang on [Discord](https://touca.io/discord). Come say hi! We love making new
friends. If you need help, have any questions, or like to contribute or provide
feedback, that's the best place to be.

## Contributing

We welcome all forms of contributions, from adding new features to improving
documentation and sharing feedback.

- [Code of Conduct](https://touca.io/docs/contributing/conduct/)
- [Contributing Guide](https://touca.io/docs/contributing/)
- [Good First Issues](https://touca.io/docs/contributing/good-first-issues/)

## FAQ

- Should I install Touca as a development dependency?

  Yes, unless you like to capture data-points that are not accessible through
  your software's public API. Touca data capturing functions (e.g. `touca.check`
  and `touca.scoped_timer`) are no-op in production environments. They only work
  when called from a `@touca.workflow` context.

- How is Touca making money?

  Touca is open-source software that you can self-host for free. Touca, Inc.
  operates [Touca Cloud](https://app.touca.io): a managed cloud instance of
  Touca with additional enterprise-ready features. We have a free plan and
  leverage usage-based pricing to charge for storage and service. Visit our
  [pricing page](https://touca.io/pricing) to learn more.

## License

This repository is released under the Apache-2.0 License. See
[`LICENSE`](https://github.com/trytouca/trytouca/blob/main/sdk/python/LICENSE).
