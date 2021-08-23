---
description: Touca SDK for the Python Programming Language
---

# Python SDK

{% hint style="info" %}
This section is meant to introduce basic function API of our Python core library. See  our [Python Client Library](./) document to learn how to use Touca to develop regression test tools.
{% endhint %}

Let us imagine that we like to setup continuous regression testing for the following Code Under Test:

```python
def is_prime(number: str):
    pass
```

As a first step, we can create a regression test executable that has access to the entry-point of our Code Under Test. See our [Integration Guide](docs/Integration.md) to learn how to integrate Touca as a third-party dependency with your code.

```python
import touca
```

Our goal is to run this regression test tool every time we make changes to our software. For each version, we can invoke our Code Under Test any number of times with different inputs and capture any data that indicates its behavior or performance.

```python
    for input_number in [1, 2, 3, 4, 7, 673, 7453, 14747]:
        touca.declare_testcase(str(input_number))
        with touca.scoped_timer("is_prime runtime"):
            touca.add_result("is_prime", is_prime(input_number))
```

But all Touca functions are disabled by default until we configure the library which is meant to be done only in our regression test tool. This behavior allows us to move our data capturing functions inside the implementation of our Code Under Test if we liked to do so. When our software is running in a production environment, the client is not configured and all its functions remain no-op.

```python
    touca.configure(
      api_key="<your-api-key>",
      api_url="<your-api-url>",
      version="<your-software-version>"
    })
```

Once all our desired test results are added to the test case\(s\), we may save them on the local filesystem and/or submit them to the Touca platform.

```python
    touca.save_binary("tutorial.bin")
    touca.save_json("tutorial.json")
    touca.post()
```

The Platform compares the test results submitted for a given version against a baseline version known to behave as we expect. If differences are found Touca notifies us so we can decide if those differences are expected or they are symptoms of an unintended side-effect of our change.

Putting this all together, our very basic regression test tool may look like the following:

```python
import touca
from code_under_test import parse_profile

def main():
    touca.configure(
        api_key="7e6f0cc4-37d3-4fa7-8bd5-f09d10b485fd",
        api_url="https://api.touca.io/@/acme/students-db/v1.0"
    )
    for username in [1, 2, 3, 4, 7, 673, 7453, 14747]:
        touca.declare_testcase(username)

        touca.start_timer("parse_profile")
        student = parse_profile(username)
        touca.stop_timer("parse_profile")

        touca.add_result("fullname", student.fullname)
        touca.add_result("birth_date", student.dob)
        touca.add_result("courses", student.courses)

        touca.post()
    
    touca.save_binary("tutorial.bin")
    touca.save_json("tutorial.json")

if __name__ == "__main__":
    main()
```

We can simplify the above code via using the Touca test framework for Python:

```python
import touca
from code_under_test import parse_profile

@touca.Workflow
def students_db():
    with touca.scoped_timer("parse_profile"):
        student = parse_profile(username)
    touca.add_result("fullname", student.fullname)
    touca.add_result("birth_date", student.dob)
    touca.add_result("courses", student.courses)

if __name__ == "__main__":
    touca.run()
```

We just scratched the surface of how Touca can help us setup continuous regression testing for our software. We encourage you to explore Touca documentation to learn how to get started.

