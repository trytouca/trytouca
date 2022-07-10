# Quick Start

This document introduces Touca SDK for Python
([GitHub](https://github.com/trytouca/trytouca/tree/main/sdk/python),
[PyPI](https://pypi.org/project/touca/)) through a simple example. This SDK is
available as open-source under the Apache-2.0 License.

```bash
pip install touca
```

Let's use the examples available in the
[Touca repository on GitHub](https://github.com/trytouca/trytouca/tree/main/examples/python).
Clone this repository to a directory of your choice and create a virtual
environment.

```bash
git clone git@github.com:trytouca/trytouca.git
cd trytouca/examples/python
python -m venv .env
source .env/bin/activate
pip install touca
```

Let's assume that we want to test a software that checks whether a given number
is prime.

```python title="01_python_minimal/is_prime.py"
def is_prime(number: int):
    for i in range(2, number):
        if number % i == 0:
            return False
    return 1 < number
```

Here is a simple test for our `is_prime` software using the Python SDK.

```python title="01_python_minimal/is_prime_test.py"
import touca
from is_prime import is_prime

@touca.Workflow
def is_prime_test(testcase: str):
    touca.check("is_prime_output", is_prime(int(testcase)))
```

This is slightly different from a typical unit test:

- Touca tests do not use expected values.
- Touca tests do not hard-code input values.

With Touca, we can define how to run our code under test for any given test
case. We can capture values of interesting variables and runtime of important
functions to describe the behavior and performance of our workflow for that test
case.

Let us run our Touca test, passing number `13` as input:

```bash
cd 01_python_minimal
touca test --revision 1.0 --testcase 13 --team tutorial --offline
```

This command produces the following output.

```text

Touca Test Framework

Suite: students/1.0

 1.  PASS   13    (0 ms)

Tests:      1 passed, 1 total
Time:       0.00 s

✨   Ran all test suites.

```

Touca Python CLI passes `13` as the `testcase` parameter to our test workflow.
We convert this `testcase` to a number and pass it to our code under test. We
capture the actual value returned by our software as a Touca test result and
associate it with version `1.0` of our code.

Unlike snapshot testing which writes a snapshot of your software output in local
files, Touca tests store captured test results on a remote Touca server. That
server compares our results against a previous trusted version and reports
differences as test cases are executed.

Let's create an account on [app.touca.io](https://app.touca.io) to submit our
results to it.

![You will need API Key and API URL to submit test results.](/img/assets/touca-submit-first-version.png)

Create a new suite `is_prime_test` and copy the API Key and API URL that we need
to submit test results.

```bash
touca config set api-key="<your_key>"
touca config set api-url="https://api.touca.io/@/tutorial"
touca test --revision=1.0 --testcase 19 51 97
```

```text

Touca Test Framework

Suite: is_prime_test/1.0

 1.  PASS   19    (0 ms)
 2.  PASS   51    (0 ms)
 3.  PASS   97    (0 ms)

Tests:      3 passed, 3 total
Time:       0.39 s

✨   Ran all test suites.

```

![Touca server after submitting results for v1.0](/img/assets/touca-sdk-quickstart-1.png)

Now if we make changes to our workflow under test, we can rerun this test and
rely on Touca to check if our changes affected the behavior or performance of
our software.

```bash
touca test --revision=2.0
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

![Touca server after submitting results for v2.0](/img/assets/touca-sdk-quickstart-2.png)

Unlike integration tests, we are not bound to the output of our workflow. We can
capture any number of data points and from anywhere within our code. This is
specially useful if our workflow has multiple stages. We can capture the output
of each stage without publicly exposing its API. When any stage changes behavior
in a future version of our software, our captured data points will help find the
root cause more easily.

This was an easy example with a trivial implementation. Real-world software
workflows are complex. They may involve many nested function calls and interact
with systems and services. In the next document, we will see how Touca helps us
test real-world software.
