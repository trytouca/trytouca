<p align="center">
<a href="https://touca.io"><img src="https://touca.io/logo/touca-logo-w-text-bg.png" alt="touca.io" width="300px" /></a>
</p>
<p align="center">
<a href="https://github.com/trytouca/trytouca/blob/main/LICENSE"><img src="https://img.shields.io/github/license/trytouca/trytouca?color=blue" /></a>
<a href="https://touca.io/docs"><img src="https://img.shields.io/static/v1?label=docs&message=touca.io/docs&color=blue" /></a>
<a href="https://touca.io/discord"><img src="https://img.shields.io/static/v1?label=community&message=touca.io/discord&color=blue" /></a>
</p>

## Continuous Regression Testing for Engineering Teams

Touca provides feedback when you write code that could break your software. It
remotely compares the behavior and performance of your software against a
previous trusted version and visualizes differences in near real-time.

[![Touca Server](https://i.vimeocdn.com/filter/overlay?src0=https%3A%2F%2Fi.vimeocdn.com%2Fvideo%2F1420276355-a2760e21742b267f63e7e1599eefc02329dcc22c2f155f125ff8692c99161e9c-d_1920x1080&src1=http%3A%2F%2Ff.vimeocdn.com%2Fp%2Fimages%2Fcrawler_play.png)](https://vimeo.com/703039452 "Touca Quick Product Demo")

## Start for free

[![Server](https://img.shields.io/static/v1?label=Server&message=v1.4.0&color=blue)](https://hub.docker.com/repository/docker/touca)

### Option 1: Self-host locally

You can self-host Touca by running the following command on a UNIX machine with
at least 2GB of RAM, with Docker and Docker Compose installed.

```bash
/bin/bash -c "$(curl -fsSL https://touca.io/install.sh)"
```

### Option 2: Use Touca Cloud

Or you can use https://app.touca.io, managed and maintained by Touca, Inc. with
additional enterprise-ready features. We offer a free plan and leverage
usage-based pricing to charge larger teams for storage and compute.

## Sneak Peek

> Touca has SDKs in Python, C++, Java, and JavaScript.

[![C++ SDK](https://img.shields.io/static/v1?label=C%2B%2B&message=v1.5.2&color=blue)](https://github.com/trytouca/trytouca/tree/main/sdk/cpp)
[![Python SDK](https://img.shields.io/pypi/v/touca?label=Python&color=blue)](https://pypi.org/project/touca/)
[![JavaScript SDK](https://img.shields.io/npm/v/@touca/node?label=JavaScript&color=blue)](https://www.npmjs.com/package/@touca/node)
[![Java SDK](https://img.shields.io/maven-central/v/io.touca/touca?label=Java&color=blue)](https://search.maven.org/artifact/io.touca/touca)

Let us imagine that we want to test a software workflow that takes the username
of a student and provides basic information about them.

```python
@dataclass
class Student:
    username: str
    fullname: str
    dob: datetime.date
    gpa: float

def find_student(username: str) -> Student:
    # ...
```

We can use unit testing in which we hard-code a set of usernames and list our
expected return value for each input. In this example, the input and output of
our code under test are `username` and `Student`. If we were testing a video
compression algorithm, they may have been video files. In that case:

- Describing the expected output for a given video file would be difficult.
- When we make changes to our compression algorithm, accurately reflecting those
  changes in our expected values would be time-consuming.
- We would need a large number of input video files to gain confidence that our
  algorithm works correctly.

Touca makes it easier to continuously test workflows of any complexity and with
any number of test cases.

```python
import touca
from students import find_student

@touca.Workflow
def students_test(username: str):
    student = find_student(username)
    touca.check("username", student.username)
    touca.check("fullname", student.fullname)
    touca.check("birth_date", student.dob)
    touca.check("gpa", student.gpa)
```

This is slightly different from a typical unit test:

- Touca tests do not use expected values.
- Touca tests do not hard-code input values.

With Touca, we describe how we run our code under test for any given test case.
We can capture values of interesting variables and runtime of important
functions to describe the behavior and performance of our workflow for that test
case.

We can run Touca tests with any number of inputs from the command line:

```bash
touca config set api-key="<your_api_key>"
touca config set api-url="https://api.touca.io/@/tutorial"
touca test --revision=1.0 --testcase alice bob charlie
```

This command produces the following output:

```text

Touca Test Framework

Suite: students_test/1.0

 1.  PASS   alice    (0 ms)
 2.  PASS   bob      (0 ms)
 3.  PASS   charlie  (0 ms)

Tests:      3 passed, 3 total
Time:       0.39 s

✨   Ran all test suites.

```

Now if we make changes to our workflow under test, we can rerun this test and
rely on Touca to check if our changes affect the behavior or performance of our
software.

Unlike integration tests, we are not bound to the output of our workflow. We can
capture any number of data points and from anywhere within our code. This is
specially useful if our workflow has multiple stages. We can capture the output
of each stage without publicly exposing its API. When any stage changes behavior
in a future version of our software, our captured data points will help find the
root cause more easily.

## Value Proposition

Touca is very effective in addressing common problems in the following
situations:

- When we need to test our workflow with a large number of inputs.
- When the output of our workflow is too complex, or too difficult to describe
  in our unit tests.
- When interesting information to check for regression is not exposed through
  the interface of our workflow.

The highlighted design features of Touca can help us test these workflows at any
scale.

- Decoupling our test input from our test logic helps us manage our long list of
  inputs without modifying the test logic. Managing that list on a remote server
  accessible to all members of our team helps us add notes to each test case,
  explain why they are needed and track their stability and performance changes
  over time.
- Submitting our test results to a remote server, instead of storing them in
  files, helps us avoid the mundane tasks of managing and processing of test
  results. Touca server retains all test results and makes them accessible to
  all members of the team. It compares test results using their original data
  types and reports discovered differences in real-time to all interested
  members of our team. It helps us audit how our software evolves over time and
  provides high-level information about our tests.

## Documentation

If you are new to Touca, the best place to start is our
[documentation website](https://touca.io/docs).

## Community

We hang on [Discord](https://touca.io/discord). Come say hi! We love making new
friends. If you need help, have any questions, or like to contribute or provide
feedback, that's the best place to be.

## Contributors

<a href="https://github.com/ghorbanzade"><img src="https://avatars.githubusercontent.com/u/11810467?v=4" title="ghorbanzade" width="50" height="50"></a>
<a href="https://github.com/rmarrcode"><img src="https://avatars.githubusercontent.com/u/13802466?v=4" title="rmarrcode" width="50" height="50"></a>
<a href="https://github.com/cthulhu-irl"><img src="https://avatars.githubusercontent.com/u/23152417?v=4" title="cthulhu-irl" width="50" height="50"></a>
<a href="https://github.com/mdkhaki"><img src="https://avatars.githubusercontent.com/u/62190332?v=4" title="mdkhaki" width="50" height="50"></a>
<a href="https://github.com/afshinm"><img src="https://avatars.githubusercontent.com/u/314326?v=4" title="afshinm" width="50" height="50"></a>
<a href="https://github.com/mapron"><img src="https://avatars.githubusercontent.com/u/7624327?v=4" title="mapron" width="50" height="50"></a>
<a href="https://github.com/duncanspumpkin"><img src="https://avatars.githubusercontent.com/u/1277401?v=4" title="duncanspumpkin" width="50" height="50"></a>
<a href="https://github.com/committomaster"><img src="https://avatars.githubusercontent.com/u/20593344?v=4" title="committomaster" width="50" height="50"></a>

## Sponsors

<a href="https://github.com/pykello"><img src="https://avatars.githubusercontent.com/u/628106?v=4" title="pykello" width="50" height="50"></a>
<a href="https://github.com/fffaraz"><img src="https://avatars.githubusercontent.com/u/895678?v=4" title="fffaraz" width="50" height="50"></a>

## License

This repository is released under the Apache-2.0 License. See
[`LICENSE`](https://github.com/trytouca/trytouca/blob/main/LICENSE).
