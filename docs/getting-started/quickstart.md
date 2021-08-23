---
description: Getting started with Touca
---

# Quick Start

{% hint style="info" %}
This document is meant to introduce Touca through an example. See our SDK documentations when building regression test tools for real-world software.
{% endhint %}

## Revisiting Unit Testing

Let us imagine that we want to test a simple Code Under Test such as a function that checks if a given number is prime or not.

{% tabs %}
{% tab title="C++" %}
```cpp
bool is_prime(const int number);
```
{% endtab %}

{% tab title="Python" %}
```python
def is_prime(number: int):
```
{% endtab %}

{% tab title="TypeScript" %}
```typescript
function is_prime(number: number): boolean;
```
{% endtab %}
{% endtabs %}

If we want to use unit testing, we'd write a test that invokes this function with a number, and checks whether the actual return value of the function matches our expected value. Here's a sample unit test.

{% tabs %}
{% tab title="C++" %}
```cpp
#include "catch2/catch.hpp"
#include "code_under_test.hpp"

TEST_CASE("is_prime")
{
    CHECK(is_prime(-1) == false);
    CHECK(is_prime(1) == false);
    CHECK(is_prime(2) == true);
    CHECK(is_prime(13) == true);
}
```
{% endtab %}

{% tab title="Python" %}
```python
from code_under_test import is_prime

def test_is_prime():
    assert is_prime(-1) == False
    assert is_prime(1)  == False
    assert is_prime(2)  == True
    assert is_prime(13) == True
```
{% endtab %}

{% tab title="TypeScript" %}
```typescript
import { is_prime } from 'code_under_test';

test('test is_prime', () => {
    expect(is_prime(-1)).toEqual(false);
    expect(is_prime(1)).toEqual(false);
    expect(is_prime(2)).toEqual(true);
    expect(is_prime(13)).toEqual(true);
});
```
{% endtab %}
{% endtabs %}

Unit testing is an effective method to gain confidence in the behavior of functions we are going to implement or have already implemented. But let us, for a moment, review some of the fundamentals of building and maintaining unit tests:

*   For each input, we need to specify the corresponding expected output, as part of our test logic.
*   As our software requirements evolve, we may need to go back and change our expected outputs.
*   When we find other interesting inputs, we may need to go back and include them in our set of inputs.

In the example above, the input and output of the Code Under Test were a number and a boolean, respectively. If we were testing a video compression algorithm, they may have been video files. In that case:

*   Describing the expected output for a given video file would be difficult.
*   When we make changes to our compression algorithm, accurately reflecting those changes in our expected values would be time-consuming.
*   We would need a large number of input video files to gain confidence that our algorithm works correctly.

To make testing complex workflows easier, we could significantly break down our implementation and test each unit separately. But this general best practice may not solve all of the above-mentioned limitations. While writing unit tests is still very effective, we may want to hear that our compression algorithm, as a whole, works as expected.

We've built Touca to make it easier for software engineering teams to continuously test their complex workflows with any number of real-world inputs.

{% hint style="info" %}
Touca is a regression testing system; not a unit testing library. It tries to complement unit testing, not to replace it.
{% endhint %}

## Introducing Touca

Touca takes a very different approach than unit testing. Here's how the above test would look like using the Touca test framework:

{% tabs %}
{% tab title="C++" %}
```cpp
#include "touca/touca.hpp"
#include "touca/touca_main.hpp"
#include "code_under_test.hpp"

void touca::main(const std::string& testcase)
{
    const auto number = std::stoul(testcase);
    touca::add_result("is_prime", is_prime(number));
}
```
{% endtab %}

{% tab title="Python" %}
```python
import touca

@touca.Workflow
def is_prime(testcase: str):
    touca.add_result("is_prime", is_prime(int(testcase)))
    
if __name__ == "__main__":
    touca.run()
```
{% endtab %}

{% tab title="TypeScript" %}
```typescript
import { touca } from '@touca/node';

touca.workflow('test_is_prime', (testcase: string) => {
    touca.add_result("is_prime", is_prime(Number.parseInt(testcase)));
});

touca.run();
```
{% endtab %}
{% endtabs %}

Yes, we agree. This code needs some explanation. Let us start by reviewing what is missing:

*   We have fully decoupled our test inputs from our test logic. Touca refers to these inputs as "test cases". The SDK retrieves the test cases from a file or a remote Touca server and feeds them one by one to our code under test.
*   We have completely removed the concept of "expected values". Instead, we are capturing the actual return value of `is_prime` via `add_result`. We can capture any number of values, from anywhere within our code under test. These captured values are associated with their corresponding input value \(test case\) and are submitted to a remote Touca server, as we run the code under test for each input.

You may wonder how we verify the correctness of our code under test without using expected values. Let us clarify: we don't. Since Touca is a regression testing system, its objective is to help us verify if our code under test works *as before*. The remote server compares the submitted "actual values" against those submitted for a previous "baseline" version of our code, and reports differences. As long as we trust the "baseline" version of our software, knowing that such comparison does not reveal any differences, can help us conclude that our new version works as well as before.

Once we build this code as a separate executable, we can run it as shown below.

{% tabs %}
{% tab title="C++" %}
```bash
export TOUCA_API_KEY=<YOUR_API_KEY>
./prime_app_test --api-url "https://api.touca.io/@/acme/prime_app/v2.0"
```
{% endtab %}

{% tab title="Python" %}
```bash
export TOUCA_API_KEY=<YOUR_API_KEY>
python3 prime_app_test.py --api-url "https://api.touca.io/@/acme/prime_app/v2.0"
```
{% endtab %}

{% tab title="TypeScript" %}
```bash
export TOUCA_API_KEY=<YOUR_API_KEY>
tsc --outFile prime_app_test.js prime_app_test.ts
node prime_app_test.js --api-url "https://api.touca.io/@/acme/prime_app/v2.0"
```
{% endtab %}
{% endtabs %}

Notice that we are including the version of our code as part of the URL to our remote Touca server. Touca SDKs are very flexible in how we pass this information. The above command produces the following output:

```text
Touca Regression Test Framework
Suite: prime_app
Revision: v2.0

 (  1 of 3  ) -1                         (pass, 127 ms)
 (  2 of 4  ) 1                          (pass, 123 ms)
 (  3 of 4  ) 2                          (pass, 159 ms)
 (  4 of 4  ) 13                         (pass, 140 ms)

processed 4 of 4 testcases
test completed in 565 ms
```

If and when we change the implementation of `is_prime`, we can rerun the test \(passing a different version number\) and submit the new results for the new version to the Touca server. The server takes care of storing and comparing the results submitted between the two versions and reports the differences in near real-time.

The Touca server considers the test results submitted for the first version of our test, as our baseline: all subsequent versions submitted to the server would be compared against it. If, for any reason, requirements of our software change and we decide to change this baseline, we can do so by clicking a button right from the Touca server UI.

What we've demonstrated so far is only scratching the surface. We are intentionally leaving out many features and various abstraction layers of the SDKs to highlight only the fundamentals of regression testing with Touca. We refer you to our [Create a Test Tool](../guides/submit.md) guide for more information.

![Touca Server](https://touca-public-assets.s3.us-east-2.amazonaws.com/touca-screenshot-suite-page.png)

## Value Proposition

You might be wondering what are the advantages of using this approach. We hope that this approach can help you build trust in complex workflows that cannot solely be tested with unit tests. We think this approach is effective in addressing common problems in the following situations:

*   When we need to test our workflow with a large number of inputs.
*   When the output of our workflow is too complex, or too difficult to describe in our unit tests.
*   When interesting information to check for regression is not exposed by the workflow's interface.

The fundamental design features of Touca that we highlighted earlier can help us test these workflows at any scale.

*   Decoupling our test input from our test logic, can help us manage our long list of inputs without modifying the test logic. Managing that list on a remote server accessible to all members of our team, can help us add notes to each test case, explain why they are needed and track how their performance changes over time.
*   Submitting our test results to a remote server, instead of storing them in files, can help us avoid the mundane tasks of managing and processing of those results. The Touca server retains test results and makes them accessible to all members of the team. It compares test results using their original data types and reports discovered differences in real-time to all interested members of our team. It allows us to audit how our software evolves over time and provides high-level information about our tests.

## Where to go next

Touca client libraries are free and open-source. Our cloud-hosted version of Touca server at [Touca.io](https://touca.io) has a free forever plan. You can create an account and explore Touca server capabilities on your own. But we want to help you get on-boarded and answer any questions you may have in the process. So we ask that you schedule a no-pressure chat with us [here](https://calendly.com/ghorbanzade/30min). We like to learn more about you, understand your software and its requirements, and do our best to make Touca provide value to you and your team.
