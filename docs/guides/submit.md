# Create a Test Tool

{% hint style="info" %}
This document is intended to introduce the basics of creating a test tool using Touca client libraries. Consult with the documentation for individual SDKs when creating test tools for serious workflows.
{% endhint %}

## Recap

As we read in our [Quickstart Guide](../getting-started/quickstart.md), Touca is a regression testing system with a fundamentally different approach than unit testing:

* In unit testing, we run our code with a specific input and we hard-code our expected output to verify that our code produces the "right" output.
* In regression testing, we run our code with a large number of inputs, and for each input, we make note of the actual output to verify that our code produces the "same" output as in a previous trusted version.

This difference in approach explains why Touca regression test tools do not include _assertions_, rather they capture actual values of variables and runtime of functions. We already saw a glimpse of this in the test code for our `is_prime` function.

{% tabs %}
{% tab title="C++" %}
{% code title="example/starter/regression\_test.cpp" %}
```cpp
#include "code_under_test.hpp"
#include "touca/touca.hpp"
#include "touca/touca_main.hpp"

void touca::main(const std::string& testcase)
{
    const auto number = std::stoul(testcase);
    touca::add_result("is_prime", is_prime(number));
}
```
{% endcode %}
{% endtab %}

{% tab title="Python" %}
{% code title="examples/starter.py" %}
```python
import touca

@touca.Workflow
def is_prime(testcase: str):
    touca.add_result("is_prime", is_prime(int(testcase)));

if __name__ == "__main__":
    touca.run()
```
{% endcode %}
{% endtab %}
{% endtabs %}

You can find the code above in the "starter" directory of Touca's open-source "examples" repository on GitHub. You can check out this repository, run its top-level `build.sh` to build the example test tools and run the code above via the following command:

{% tabs %}
{% tab title="C++" %}
```bash
TOUCA_API_KEY=<YOUR_API_KEY> ./prime_app_test \
    --api-url https://api.touca.io/@/acme/prime_app \
    --version v2.0 \
    --testcase 17
```
{% endtab %}

{% tab title="Python" %}
```
TOUCA_API_KEY=<YOUR_API_KEY> python3 ./starter.py \
    --api-url https://api.touca.io/@/acme/prime_app \
    --version v2.0 \
    --testcase 17
```
{% endtab %}
{% endtabs %}

So what is happening here? The header `touca/touca_main.hpp` includes the application's main function. The function finds the list of inputs and calls `touca::main`, once for each input, to capture the actual return value of `is_prime` as a "test result". After running `touca::main` for each input, the application submits any captured data to the specified `prime_app` suite of `acme` team on Touca's cloud-hosted server.

We encourage you to run the above code locally. But our `is_prime` example is too trivial to showcase the true powers of Touca SDKs. We used the highest level of API abstraction to highlight the differences in approach. In this section, we introduce low-level abstraction APIs of the libraries to help you use them for testing workflows of any complexity.

## Starting Small

Let us suppose that we want to test a software workflow that takes the username of a student and provides basic information about them.

{% tabs %}
{% tab title="C++" %}
{% code title="example/basic/code\_under\_test.hpp" %}
```cpp
struct Student {
    std::string username;
    std::string fullname;
    Date dob; // user-defined type
    std::vector<Course> courses; // user-defined type
};

Student parse_profile(const std::string& username);
```
{% endcode %}
{% endtab %}

{% tab title="Python" %}
{% code title="examples/code\_under\_test.py" %}
```python
from dataclasses import dataclass
from typing import List

@dataclass
class Student:
    username: str
    fullname: str
    dob: Date # user-defined type
    courses: List[Course] # user-defined type

def parse_profile(username: str) -> Student:
    # some implementation here
```
{% endcode %}
{% endtab %}
{% endtabs %}

We want to understand if and how changes in the implementation of the `parse_profile` function change the overall software behavior. For each version of its implementation, we can invoke `parse_profile` as our code under test, with a set of usernames and inspect its return value.

{% tabs %}
{% tab title="C++" %}
```cpp
#include "code_under_test.hpp"
#include "touca/touca.hpp"

int main()
{
    touca::configure();
    for (const auto& username : { "alice", "bob", "charlie" }) {
        touca::declare_testcase(username);
        touca::scoped_timer scoped_timer("parse_profile");
        const auto& student = parse_profile(username);
        touca::add_result("fullname", student.fullname);
        touca::add_result("birth_date", student.dob);
        touca::add_result("courses", student.courses);
    }
    touca::save_binary("touca_output.bin");
}
```
{% endtab %}

{% tab title="Python" %}
```python
import touca

def main():
    touca.configure()
    for username in [ "alice", "bob", "charlie" ]:
        touca.declare_testcase(username)

        touca.start_timer("parse_profile")
        student = parse_profile(username)
        touca.stop_timer("parse_profile")

        touca.add_result("fullname", student.fullname)
        touca.add_result("birth_date", student.dob)
        touca.add_result("courses", student.courses)

    touca.save_binary("touca_output.bin")

if __name__ == "__main__":
    main()
```
{% endtab %}
{% endtabs %}

### Declaring a Testcase

In the code above, we are using `declare_testcase` to ask the library to consider each username as a "test case". By calling this function, we are declaring to the library that all subsequent captured data and performance benchmarks belong to the specified test case, until a different test case is declared.

It is possible to change this behavior for multi-threaded software workflows. See full SDK documentation to learn more.

### Capturing Behavior

After calling our code under test with the given username, we can capture any interesting information in our returned output via calling `add_result`. This function associates the captured data with a key name \(e.g. `birth_date`\). For each test case, we can call this function and other variants like `add_hit_count` and `add_array_element` any number of times.

Touca SDKs detect the types of our captured data and attempt to serialize them into a special binary format. This way, the Touca server can compare our captured data without loss of accuracy. The SDKs natively support commonly-used types such as numbers, strings and lists. We can also extend the set of supported types to cover our user-defined types. In our example, to capture member variables `dob` and `courses`, we can extend Touca's type system to define how it should handle types `Date` and `Course`. See full SDK documentation to learn how to extend Touca's type system.

### Capturing Performance

In addition to values of interesting variables, Touca SDKs allow us to capture runtime of functions or any arbitrary piece of code. In our example, we are capturing the runtime of every iteration of our `for` loop using a scoped variable of type `scoped_timer` that logs its own lifetime. This is only one way of measuring the runtime of a piece of code. The SDKs offer other function APIs such as `start_timer`, `stop_timer`, and `add_metric` as flexible ways to capture performance benchmarks.

### Configuring the Library

Touca SDKs allow us to capture values of variables and runtime of functions from anywhere: we can use these functions within our code under test if we like to do so. This way, we will not be limited to information exposed in the output: if there is an important variable internal to our code under test, we can still capture its value and compare it across versions.

Capturing values and measuring runtimes are only helpful in the test environment, when our code under test is called from our test tool and with our test cases. To eliminate the cost of function calls in production environments, all Touca SDK functions are no-op by default, unless the library is configured via `configure`. As long as we make sure that this function is only called from our test tool, using other functions in production code will have no cost.

### Managing Test Results

We can store captured values and runtimes on the local filesystem in binary or JSON formats. The example code above uses `save_binary` to do so, after all test cases are executed. Touca binary files can later be submitted to a Touca server asynchronously. We can also use Touca CLI to view, compare and edit the binary files.

In most cases, however, we want to submit our captured data to a remote Touca server to leverage its powers in comparing our data, visualizing differences and generating reports. We can use `post` to do submit our data, either after each test case is executed or after all test cases are executed.

{% tabs %}
{% tab title="C++" %}
```cpp
#include "code_under_test.hpp"
#include "touca/touca.hpp"

int main()
{
    touca::configure({
        { "api-key", "7e6f0cc4-37d3-4fa7-8bd5-f09d10b485fd" },
        { "api-url", "https://api.touca.io/@/acme/students-db/v1.0" }
    });
    for (const auto& username : touca::get_testcases()) {
        touca::declare_testcase(username);
        touca::scoped_timer scoped_timer("parse_profile");
        const auto& student = parse_profile(username);
        touca::add_result("fullname", student.fullname);
        touca::add_result("birth_date", student.dob);
        touca::add_result("courses", student.courses);
        touca::post();
    }
}
```
{% endtab %}

{% tab title="Python" %}
```python
import touca
from code_under_test import parse_profile

def main():
    touca.configure(
        api_key="7e6f0cc4-37d3-4fa7-8bd5-f09d10b485fd",
        api_url="https://api.touca.io/@/acme/students-db/v1.0"
    )
    for username in touca.get_testcases():
        touca.declare_testcase(username)

        touca.start_timer("parse_profile")
        student = parse_profile(username)
        touca.stop_timer("parse_profile")

        touca.add_result("fullname", student.fullname)
        touca.add_result("birth_date", student.dob)
        touca.add_result("courses", student.courses)

        touca.post()

if __name__ == "__main__":
    main()
```
{% endtab %}
{% endtabs %}

Notice in the code above that in addition to calling `post`, we are passing parameters `api-key` and `api-url` to the `configure` function. We are asking the library to submit results to suite `students-db` of team `acme` and consider them as results for version `v1.0` of our code under test.

### Decoupling test cases

Now that our SDK is configured to communicate with a Touca server, we can retrieve the list of test cases from the server too. In the code above, we replaced our hard-coded list of usernames with `get_testcases`. This way, we can manage our test cases through the Touca server user interface that provides insights and statistics about each test case and lets us add notes and tags to them.

### Cleaning up

At this point, we can build and run our test tool from the command line, without passing any arguments. The application is going to authenticate to the Touca server using our API Key, get the list of test cases and run them one by one to collect test results and submit them to the server.

All regression test tools using Touca SDKs follow this same pattern. We may want to abstract away common operations such as configuring the library and posting results after each test is executed. Fortunately, Touca SDKs come with a versatile test framework.

{% tabs %}
{% tab title="C++" %}
```cpp
#include "code_under_test.hpp"
#include "touca/touca.hpp"
#include "touca/touca_main.hpp"

void touca::main(const std::string& username)
{
    touca::scoped_timer scoped_timer("parse_profile");
    const auto& student = parse_profile(username);
    touca::add_result("fullname", student.fullname);
    touca::add_result("birth_date", student.dob);
    touca::add_result("courses", student.courses);
}
```
{% endtab %}

{% tab title="Python" %}
```python
import touca
from code_under_test import parse_profile

@touca.Workflow
def is_prime(testcase: str):
    with touca.scoped_timer("parse_profile"):
        student = parse_profile(username)
    touca.add_result("fullname", student.fullname)
    touca.add_result("birth_date", student.dob)
    touca.add_result("courses", student.courses)
    
if __name__ == "__main__":
    touca.run()
```
{% endtab %}
{% endtabs %}

The framework not only abstracts away common operations, it provides added functionality such as error handling, logging, and progress reporting. It provides an extensible set of command line options that help us specify `api-key` and `api-url` as environment variables or command line arguments.

{% tabs %}
{% tab title="C++" %}
```bash
TOUCA_API_KEY=<YOUR_API_KEY> ./students_db_test \
    --api-url https://api.touca.io/@/<YOUR_TEAM>/students-db \
    --version v2.0
```
{% endtab %}

{% tab title="Python" %}
```
TOUCA_API_KEY=<YOUR_API_KEY> python3 ./examples/starter.py \
    --api-url https://api.touca.io/@/<YOUR_TEAM>/students-db \
    --version v2.0
```
{% endtab %}
{% endtabs %}

