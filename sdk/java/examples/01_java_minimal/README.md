# The Basics

Let us imagine we are building a simple software that checks whether a given
number is prime or not. We may come up with the following implementation as
`v1.0` of our software.

```java
package io.touca.examples.minimal;

public final class Prime {
    public static boolean isPrime(final int number) {
        for (int i = 2; i < number; i++) {
            if (number % i == 0) {
                return false;
            }
        }
        return 1 < number;
    }
}
```

Prime numbers are so magical that we can spend years improving the correctness
and efficiency of our implementation. But when people rely on our product to
work, we need to make sure that our future improvements do not introduce
unexpected side-effects.

> Touca helps us see, in near real-time, how our code changes impact the
> behavior and performance of our overall software.

## Getting Started

If we were to write unit tests for our `isPrime` function, we could start with
the following code.

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public final class PrimeTest {

  @Test
  public void isPrime() {
    assertTrue(Prime.isPrime(13));
    assertTrue(Prime.isPrime(17));
    assertFalse(Prime.isPrime(51));
  }

}
```

Unit tests are very effective but they require calling our code under test with
a hard-coded set of inputs and comparing the return value of our function
against a hard-coded set of expected values.

Touca takes a very different approach than unit testing:

```java
package io.touca.examples.minimal;

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

Where `io.touca` is the `packageId` of our Java SDK on Maven Central repository.

```kotlin
repositories {
    mavenCentral()
}

dependencies {
    testImplementation('io.touca:touca:0.3.1')
}
```

Notice how our Touca test code does not specify the list of numbers we will be
using to test our `isPrime` function. Similarly, it does not include the
expected return value of our `isPrime` function for different inputs. By
decoupling the test cases from our test logic, we can test our software with any
number of test cases, without changing our test code:

```bash
gradle runExampleMinimal --args='--api-key <TOUCA_API_KEY> --api-url <TOUCA_API_URL> --revision v1.0 --testcase 13 17 51'
```

Where `TOUCA_API_KEY` and `TOUCA_API_URL` can be obtained from the
[Touca server](https://app.touca.io).

The command above executes our code under test with the specified testcases and
captures the return values of our `isPrime` function. The test tool submits our
captured data to the Touca server and associates them with version `v1.0`.

```text
Touca Test Framework
Suite: is_prime_test
Revision: v1.0

 (1 of 3) 13 (pass, 0 ms)
 (2 of 3) 17 (pass, 0 ms)
 (3 of 3) 51 (pass, 0 ms)

Processed 3 of 3 test cases
Test completed in 1 ms
```

Now if we change the implementation of our `isPrime` function in the future, we
can rerun this test to submit the new information as, say, `v2.0`. The Touca
server compares the new test results against our test results for `v1.0` and
reports any differences in real-time.

## General Model

The pattern used in this example is generally applicable to testing real-world
workflows of any complexity.

```java
import io.touca.Touca;
// import your code under test here

public final class ExampleTest {

  @Touca.Workflow
  public void workflowName(final String testcase) {
    // your code goes here
  }

  public static void main(String[] args) {
    Touca.run(ExampleTest.class, args);
  }
}
```

The code we insert as our workflow under test generally performs the following
operations.

1.  Map a given testcase name to its corresponding input.

    > We did this by calling `Integer.parseInt(testcase)`.

2.  Call the code under test with that input.

    > We did this by calling `Prime.isPrime(number)`.

3.  Describe the behavior and performance of the code under test.

    > We can do this by capturing values of interesting variables and runtime of
    > important functions.
    >
    > In our example, we captured the return value of our `isPrime` function via
    > `Touca.check`. We could also capture runtime of functions and other
    > performance data but our example here was too trivial to showcase all
    > possibilities. See our next example for more details.
