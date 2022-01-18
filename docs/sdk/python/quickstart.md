# Getting Started

This document introduces Touca SDK for Python through a simple example. If you
are new to Touca, consider reading our
[general quickstart guide](../../basics/quickstart.md) first.

Touca SDK for Python is available as open-source
[on GitHub](https://github.com/trytouca/touca-python) under the Apache-2.0
License. It is publicly available [on PyPI](https://pypi.org/project/touca/) and
can be pulled as a dependency using `pip`.

```bash
pip install touca
```

In this tutorial, we will use Touca examples repository whose Python examples
already list this package as a dependency. Clone this repository to a local
directory of your choice and proceed with building its Python examples.

```bash
git clone git@github.com/trytouca/examples.git "<YOUR_LOCAL_DIRECTORY>"
cd "<YOUR_LOCAL_DIRECTORY>/python"
python -m venv .env
source .env/bin/activate
pip install touca
```

For our first example, let us write a Touca test for a software that checks
whether a given number is prime. You can find a possible first implementation in
`./python/01_python_minimal/is_prime.py` of the examples repository.

```python
def is_prime(number: int):
    for i in range(2, number):
        if number % i == 0:
            return False
    return 1 < number
```

While this implementation is trivial, it represents our code under test with
arbitrary complexity that may involve many nested function calls, interacting
with systems and services. So while we can test the above code with unit tests,
it may not be so easy to write and maintain unit tests for future versions of
our software.

With Touca, we can test our software workflows regardless of their complexity.
Here is an example Touca test for our `is_prime` software using the Touca SDK
for Python.

```python
import touca
from is_prime import is_prime

@touca.Workflow
def is_prime_test(testcase: str):
    touca.check("is_prime_output", is_prime(int(testcase)))

if __name__ == "__main__":
    touca.run()
```

Typical Touca tests do not list the inputs that we use to test our workflow. We
did not specify the expected output of our software either. This is unlike unit
tests in which we hard-code our input values and their corresponding expected
values.

With Touca, we would just define how to run our workflow under test for any
given test case. We would capture values of interesting variables and runtime of
important functions to describe the behavior and performance of our workflow for
that test case. We would leave it to Touca to compare our description against
that of a previous trusted version of our workflow and report the differences as
our test cases are executed.

Let us run our Touca test, passing `13` as a sample input:

```bash
python 01_python_minimal/is_prime_test.py --team tutorial --suite is_prime --revision 1.0 --offline --testcase 13
```

This command produces the following output.

```text

Touca Test Framework
Suite: is_prime/1.0

 1.  PASS   13    (1 ms)

Tests:      1 passed, 1 total
Time:       0.12 s

✨   Ran all test suites.

```

The test framework passes `13` as the `testcase` parameter to our test workflow.
We convert this `testcase` to a number and pass it to our code under test. We
capture the actual value returned by our software as a Touca test result. This
value is stored in its original data type, in a binary file
`./results/is_prime/1.0/13/touca.bin`.

Every time we make changes to our code under test, we can repeat this process
with the same set of test cases. We could compare the generated binary files to
check whether our code changes impact the overall behavior and performance of
our software.

```bash
touca_cli compare --src=./results/is_prime/1.0/13/touca.bin --dst=./results/is_prime/1.0/13/touca.bin
```

But this method is only useful if we test our workflow under test with hundreds
of test cases which would make dealing with result files very inconvenient.
Fortunately, Touca has a server instance that can be self-hosted or cloud-hosted
to manage and compare test results and report their differences.

![You will need API Key and API URL to submit test results.](../../.gitbook/assets/touca-submit-first-version.png)

If you have not already, create an account at
[app.touca.io](https://app.touca.io). Once you make a new suite, the server
shows an API Key and an API URL that you can use to submit test results.

```bash
export TOUCA_API_KEY="8073c34f-a48c-4e69-af9f-405b9943f8cc"
export TOUCA_API_URL="https://api.touca.io/@/tutorial/prime-test"
python 01_python_minimal/is_prime_test.py --revision 1.0 --testcase 19 51 97
```

```text

Touca Test Framework
Suite: prime-test/1.0

 1.  PASS   19    (109 ms)
 2.  PASS   51    (152 ms)
 3.  PASS   97    (127 ms)

Tests:      3 passed, 3 total
Time:       0.57 s

✨   Ran all test suites.

```

![Touca server after submitting results for v1.0](../../.gitbook/assets/touca-sdk-quickstart-1.png)

Now if we make changes to our workflow under test, we can rerun this test and
rely on Touca to check if our changes affected the behavior or performance of
our software.

```bash
python 01_python_minimal/is_prime_test.py --revision 2.0
```

```text

Touca Test Framework
Suite: prime-test/2.0

 1.  PASS   19    (109 ms)
 2.  PASS   51    (152 ms)
 3.  PASS   97    (127 ms)

Tests:      3 passed, 3 total
Time:       0.55 s

✨   Ran all test suites.

```

![Touca server after submitting results for v2.0](../../.gitbook/assets/touca-sdk-quickstart-2.png)

In our example, we captured the output of our workflow using `touca.check`. But
unlike integration tests, we are not bound to the output of our workflow. We can
capture any number of data points and from anywhere within our code. This is
specially useful if our workflow has multiple stages. We can capture the output
of each stage without publicly exposing its API. If the behavior of that stage
changes in a future version of our code, we can leverage the captured output to
find the root cause more easily.

In the next documents, we will learn how to use Touca SDK for Python to test
real-world software workflows.
