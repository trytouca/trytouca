# The Basics

Let us imagine we are building a simple software that checks whether a given
number is prime or not. We may come up with the following implementation as
`v1.0` of our software.

```cpp
bool is_prime(const unsigned long number) {
    for (auto i = 2u; i < number; i++) {
        if (number % i == 0) {
            return false;
        }
    }
    return 1 < number;
}
```

Prime numbers are so magical that we can spend years improving the correctness
and efficiency of our implementation. But when people rely on our product to
work, we need to make sure that our future improvements do not introduce
unexpected side-effects.

> Touca helps us see, in near real-time, how our code changes impact the
> behavior and performance of our overall software.

## Getting Started

If we were to write unit tests for our `is_prime` function, we could start with
the following code.

```cpp
#include "catch2/catch.hpp"
#include "is_prime.hpp"

TEST_CASE("is_prime")
{
    CHECK(is_prime(13) == true);
    CHECK(is_prime(17) == true);
    CHECK(is_prime(51) == false);
}
```

Unit tests are very effective but they require calling our code under test with
a hard-coded set of inputs and comparing the return value of our function
against a hard-coded set of expected values.

Touca takes a very different approach than unit testing:

```cpp
#include "touca/touca.hpp"
#include "is_prime.hpp"

int main(int argc, char* argv[]) {
  touca::workflow("is_prime", [](const std::string& testcase) {
    const auto number = std::stoul(testcase);
    touca::check("output", is_prime(number));
  });
  touca::run(argc, argv);
}
```

Where `touca/touca.hpp` is the entry-point to high-level API of our C++ SDK.

```cmake
target_link_libraries(
    example_cpp_minimal
  PRIVATE
    touca
)
```

Notice how our Touca test code does not specify the list of numbers we will be
using to test our `is_prime` function. Similarly, it does not include the
expected return value of our `is_prime` function for different inputs. By
decoupling the test cases from our test logic, we can test our software with any
number of test cases, without changing our test code:

```bash
export TOUCA_API_KEY=<YOUR_API_KEY>
export TOUCA_API_URL=<YOUR_API_URL>
./example_cpp_minimal --revision v1.0 --testcase 13,17,51
```

Where `TOUCA_API_KEY` and `TOUCA_API_URL` can be obtained from the
[Touca server](https://app.touca.io).

The command above executes our code under test with the specified testcases and
captures the return values of our `is_prime` function. The test tool submits our
captured data to the Touca server and associates them with version `v1.0`.

```text

Touca Test Framework
Suite: is_prime/v1.0

 1.  PASS   13    (109 ms)
 2.  PASS   17    (152 ms)
 3.  PASS   51    (127 ms)

Tests:      3 passed, 3 total
Time:       0.91 s

✨   Ran all test suites.

```

Now if we change the implementation of our `is_prime` function in the future, we
can rerun this test to submit the new information as, say, `v2.0`. The Touca
server compares the new test results against our test results for `v1.0` and
reports any differences in real-time.

## General Model

The pattern used in this example is generally applicable to testing real-world
workflows of any complexity.

```cpp
#include "touca/touca.hpp"
#include <string>
// import your code under test here

int main(int argc, char* argv[]) {
  touca::workflow("workflow_name", [](const std::string& testcase) {
  // your code goes here
  });
  touca::run(argc, argv);
}
```

The code we insert as our workflow under test generally performs the following
operations.

1.  Map a given testcase name to its corresponding input.

    > We did this by calling `std::stoul(testcase)`.

2.  Call the code under test with that input.

    > We did this by calling `is_prime(number)`.

3.  Describe the behavior and performance of the code under test.

    > We can do this by capturing values of interesting variables and runtime of
    > important functions.
    >
    > In our example, we captured the return value of our `is_prime` function
    > via `touca::check`. We could also capture runtime of functions and other
    > performance data but our example here was too trivial to showcase all
    > possibilities. See our next example for more details.
