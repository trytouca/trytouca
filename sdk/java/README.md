# Touca SDK for Java

[![Maven Central](https://img.shields.io/maven-central/v/io.touca/touca?color=blue)](https://search.maven.org/artifact/io.touca/touca)
[![License](https://img.shields.io/github/license/trytouca/touca-java?color=blue)](https://github.com/trytouca/touca-java/blob/main/LICENSE)
[![Build Status](https://img.shields.io/github/workflow/status/trytouca/touca-java/touca-java-main)](https://github.com/trytouca/touca-java/actions)
[![Code Quality](https://img.shields.io/codacy/grade/a98ce7c10db1482da22c6922c334959f)](https://app.codacy.com/gh/trytouca/touca-java)
[![Code Coverage](https://img.shields.io/codecov/c/github/trytouca/touca-java)](https://app.codecov.io/gh/trytouca/touca-java)

Touca helps you understand the true impact of your day to day code changes on
the behavior and performance of your overall software, as you write code.

[![Touca Server](https://touca-public-assets.s3.us-east-2.amazonaws.com/touca-screenshot-suite-page.jpg)](https://touca-public-assets.s3.us-east-2.amazonaws.com/touca-screenshot-suite-page.jpg)

Touca SDKs let you describe the behavior and performance of your code by
capturing values of interesting variables and runtime of important functions. We
remotely compare your description against a trusted version of your software,
visualize all differences, and report them in near real-time.

## 🧑‍🔧 Install

You can install Touca from
[Maven Central](https://search.maven.org/artifact/io.touca/touca):

```xml
<dependency>
  <groupId>io.touca</groupId>
  <artifactId>touca</artifactId>
  <version>VERSION NUMBER</version>
</dependency>
```

We formally support Java 8 and newer on Linux, macOS, and Windows platforms.

## 👀 Sneak Peak

> For a more thorough guide of how to use Touca SDK for Python, check out the
> `examples` directory or visit our documentation website at
> [docs.touca.io](https://docs.touca.io).

Let us imagine that we want to test a software workflow that reports whether a
given number is prime.

```java
public static boolean isPrime(final int number)
```

We can use unit testing in which we hard-code a set of input numbers and list
our expected return value for each input. In this example, the input and output
of our code under test are a number and a boolean. If we were testing a video
compression algorithm, they may have been video files. In that case:

- Describing the expected output for a given video file would be difficult.
- When we make changes to our compression algorithm, accurately reflecting those
  changes in our expected values would be time-consuming.
- We would need a large number of input video files to gain confidence that our
  algorithm works correctly.

Touca makes it easier to continuously test workflows of any complexity and with
any number of test cases.

```java
import io.touca.Touca;

public final class PrimeTest {

  @Touca.Workflow
  public void isPrime(final String testcase) {
    final int number = Integer.parseInt(testcase);
    Touca.check("output", Prime.isPrime(number));
  }

  public static void main(String[] args) {
    Touca.run(PrimeTest.class, args);
  }
}
```

Touca tests have two main differences compared to typical unit tests:

- We have fully decoupled our test inputs from our test logic. We refer to these
  inputs as "test cases". The SDK retrieves the test cases from the command
  line, or a file, or a remote Touca server and feeds them one by one to our
  code under test.
- We have removed the concept of _expected values_. With Touca, we only describe
  the _actual_ behavior and performance of our code under test by capturing
  values of interesting variables and runtime of important functions, anywhere
  within our code. For each test case, the SDK submits this description to a
  remote server which compares it against the description for a trusted version
  of our code. The server visualizes any differences and reports them in near
  real-time.

We can run Touca tests with any number of inputs from the command line:

```bash
export TOUCA_API_KEY=<TOUCA_API_KEY>
export TOUCA_API_URL=<TOUCA_API_URL>
gradle runExampleMinimal --args='--revision v1.0 --testcase 13 17 51'
```

Where `TOUCA_API_KEY` and `TOUCA_API_URL` can be obtained from the Touca server
at [app.touca.io](https://app.touca.io). This command produces the following
output:

```text

Touca Test Framework
Suite: isPrime/v1.0

 1.  PASS   13    (109 ms)
 2.  PASS   17    (152 ms)
 3.  PASS   51    (127 ms)

Tests:      3 passed, 3 total
Time:       0.91 s

✨   Ran all test suites.

```

## ✨ Features

Touca is very effective in addressing common problems in the following
situations:

- When we need to test our workflow with a large number of inputs.
- When the output of our workflow is too complex, or too difficult to describe
  in our unit tests.
- When interesting information to check for regression is not exposed through
  the interface of our workflow.

The fundamental design features of Touca that we highlighted earlier can help us
test these workflows at any scale.

- Decoupling our test input from our test logic, can help us manage our long
  list of inputs without modifying the test logic. Managing that list on a
  remote server accessible to all members of our team, can help us add notes to
  each test case, explain why they are needed and track how their performance
  changes over time.
- Submitting our test results to a remote server, instead of storing them in
  files, can help us avoid the mundane tasks of managing and processing of those
  results. The Touca server retains test results and makes them accessible to
  all members of the team. It compares test results using their original data
  types and reports discovered differences in real-time to all interested
  members of our team. It allows us to audit how our software evolves over time
  and provides high-level information about our tests.

## 📖 Documentation

- If you are new to Touca, the best place to start is our
  [Quickstart Guide](https://docs.touca.io/basics/quickstart).
- To learn how to use our Java SDK, see our
  [Java SDK Documentation](https://docs.touca.io/sdk/java).
- If you cannot wait to start writing your first test with Touca, see our
  [Java API Reference](https://app.touca.io/docs/clients/java/api.html).

## 🙋 Ask for Help

We want Touca to work well for you. If you need help, have any questions, or
like to provide feedback, send us a note through the Intercom at
[app.touca.io](https://app.touca.io) or email us at <hello@touca.io>.

## License

This repository is released under the Apache-2.0 License. See
[LICENSE](https://github.com/trytouca/touca-java/blob/main/LICENSE).
