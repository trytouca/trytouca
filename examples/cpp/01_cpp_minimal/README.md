# Introducing Touca using C++ SDK

This simple example attempts to test the following function as our
code under test using our high-level C++ API.

```cpp
#include <cmath>

bool is_prime(const unsigned long number)
{
    if (number < 2) {
        return false;
    }
    for (auto i = 2u; i < number; i++) {
        if (number % i == 0) {
            return false;
        }
    }
    return true;
}
```

The efficiency and correctness of this implementation is not important
since we expect this implementation to change in future versions of
our software.

Touca helps us understand how these future changes impact
the behavior and performance of our code under test.

## Getting Started

Let's create a file `is_prime_test.cpp` and copy the following code
snippet into it.

```cpp
#include "is_prime.hpp"
#include "touca/touca.hpp"
#include "touca/touca_main.hpp"
#include <string>

void touca::main(const std::string& testcase)
{
    const auto number = std::stoul(testcase);
    touca::add_result("is_prime", is_prime(number));
}
```

Notice how our Touca test code does not specify the list of numbers we
will be using to test our `is_prime` function. Similarly, it does not
include the expected return value of our `is_prime` function for different
inputs. These features make Touca slightly different than the traditional
unit testing techniques. By decoupling the test cases from our test logic,
we can now test our code with any number of test cases, without changing
our test code:

```bash
./example_cpp_minimal
  --api-key <YOUR API KEY>
  --api-url <YOUR API URL>
  --revision v1.0
  --testcase 17
```

> Alternatively, we could set `TOUCA_API_KEY` and `TOUCA_API_URL`
> as environment variables.

The command above will execute our code under test with testcase "17" and
captures the return value of our `is_prime` function as a Touca test result.
The test tool will submit our captured data to the Touca server and associates
them with version `v1.0`.

```text
Touca Test Framework
Suite: is_prime_test
Revision: v1.0

 (1 of 7) 17 (pass, 0 ms)

Processed 1 of 1 test cases
Test completed in 1 ms
```

Now if someone changes the implementation of our `is_prime` function, we
can rerun this test again to submit the new information as, say, `v2.0`.
Once we do so, the server will compare the new test results against our
test results for `v1.0` and visualizes all differences.

## General Model

The pattern used in this example is generally applicable to testing
real-world workflows of any complexity.

```cpp
#include "touca/touca.hpp"
#include "touca/touca_main.hpp"
#include <string>
// import your code under test here

void touca::main(const std::string& testcase)
{
  // your code goes here
}
```

The code you insert as your workflow under test generally performs
the following operations.

1.  Map a given testcase name to its corresponding input.

    > We did this by calling `std::stoul(testcase)`.

2.  Call your code under test with that input.

    > We did this by calling `is_prime(number)`.

3.  Describe the behavior and performance of your code under test.

    > We can do this by capturing values of interesting variables
    > and runtime of important functions.
    >
    > In our example, we captured the return value of our `is_prime`
    > function via `touca::add_result`. We could also capture runtime
    > of functions and other performance data but our example here
    > was too trivial to showcase all possibilities. See our next
    > example for more details.
