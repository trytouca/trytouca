<p align="center">
<a href="https://touca.io"><img src="https://touca.io/images/touca_logo_bgwt.png" alt="touca.io" width="300px" /></a>
</p>
<p align="center">
<a href="https://github.com/trytouca/trytouca/blob/main/LICENSE"><img src="https://img.shields.io/github/license/trytouca/trytouca?color=blue" /></a>
<a href="https://touca.io/docs"><img src="https://img.shields.io/static/v1?label=docs&message=touca.io/docs&color=blue" /></a>
<a href="https://touca.io/discord"><img src="https://img.shields.io/static/v1?label=community&message=touca.io/discord&color=blue" /></a>
</p>

## Continuous Regression Testing for Engineering Teams

Touca helps engineering teams find the unintended side-effects of their day to
day code changes. It remotely compares the behavior and performance of your
software against a previous trusted version and visualizes differences in near
real-time.

![Touca Server](https://touca.io/images/touca_screenshot_image_visualization.jpg)

## Start for free

[![Server](https://img.shields.io/docker/v/touca/touca)](https://hub.docker.com/r/touca/touca)

### Option 1: Self-host locally

You can self-host Touca by running our install script that uses Docker Compose
under the hood.

```bash
/bin/bash -c "$(curl -fsSL https://touca.io/install.sh)"
```

### Option 2: Use Touca Cloud

Or you can use https://app.touca.io that we manage and maintain. We have a free
plan and offer additional collaborative and enterprise features to larger teams.

## Sneak Peek

> Touca has SDKs in Python, C++, Java, and JavaScript.

[![C++ SDK](https://img.shields.io/static/v1?label=C%2B%2B&message=v1.5.2&color=blue)](https://github.com/trytouca/trytouca/tree/main/sdk/cpp)
[![Python SDK](https://img.shields.io/pypi/v/touca?label=Python&color=blue)](https://pypi.org/project/touca/)
[![JavaScript SDK](https://img.shields.io/npm/v/@touca/node?label=JavaScript&color=blue)](https://www.npmjs.com/package/@touca/node)
[![Java SDK](https://img.shields.io/maven-central/v/io.touca/touca?label=Java&color=blue)](https://search.maven.org/artifact/io.touca/touca)

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

```bash
touca config set api-key="<your_api_key>"
touca config set team="tutorial"
```

![Sample Test Output](https://touca.io/docs/img/assets/touca-cli-test.dark.gif)

Now if we make changes to our workflow under test, we can rerun this test and
let Touca automatically compare our captured data points against those of a
previous baseline version and report any difference in behavior or performance.

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
<a href="https://github.com/mmdbalkhi"><img src="https://avatars.githubusercontent.com/u/65954744?v=4" title="mmdbalkhi" width="50" height="50"></a>
<a href="https://github.com/depthdeluxe"><img src="https://avatars.githubusercontent.com/u/4984331?v=4" title="depthdeluxe" width="50" height="50"></a>
<a href="https://github.com/ehsan-touca"><img src="https://avatars.githubusercontent.com/u/112129743?v=4" title="ehsan-touca" width="50" height="50"></a>
<a href="https://github.com/rossh87"><img src="https://avatars.githubusercontent.com/u/36278238?v=4" title="rossh87" width="50" height="50"></a>

## Sponsors

<a href="https://github.com/pykello"><img src="https://avatars.githubusercontent.com/u/628106?v=4" title="pykello" width="50" height="50"></a>
<a href="https://github.com/fffaraz"><img src="https://avatars.githubusercontent.com/u/895678?v=4" title="fffaraz" width="50" height="50"></a>

## License

This repository is released under the Apache-2.0 License. See
[`LICENSE`](https://github.com/trytouca/trytouca/blob/main/LICENSE).
