# Legacy C++ Test Framework

Touca SDK for C++ includes an older but more customizable test framework that is
suitable for building test applications with extra functionality. This document
describes why this _legacy_ test framework exists, what it includes, and how it
works.

## Sneak Peak

[Previously](./quickstart.md), we learned how to write a Touca test for a simple
software that checks whether a given number is prime.

```cpp
#include "is_prime.hpp"
#include "touca/touca_main.hpp"

void touca::main(const std::string& testcase)
{
    const auto number = std::stoul(testcase);
    touca::scoped_timer timer("is_prime");
    touca::add_result("is_prime", is_prime(number));
}
```

We can rewrite the same test using Touca's legacy test framework for C++ which
allows customizing almost every feature of the framework, including logging,
command line arguments, application configuration parameters etc.

```cpp
#include "code_under_test.hpp"
#include "touca/touca.hpp"
#include "touca/framework.hpp"
#include "touca/framework/suites.hpp"

using wf = touca::framework;

class MyWorkflow : public wf::Workflow
{
public:
    std::shared_ptr<wf::Suite> suite() const override
    {
        return std::make_shared<wf::FileSuite>("suite.txt");
    }

    wf::Errors execute(const wf::Testcase& testcase) const override
    {
        const auto number = std::stoul(testcase);
        touca::scoped_timer timer("is_prime");
        touca::add_result("is_prime", is_prime(number));
        return {};
    }
};

int main(int argc, char* argv[])
{
    MyWorkflow workflow;
    return wf::main(argc, argv, workflow);
}
```

## Entry-point

The legacy test framework for C++ has an entry-point function
`touca::framework::main` that is meant to be called from the main function of
our test application to take over running our application for any given
workflow.

```cpp
int main(int argc, char* argv[])
{
    MyWorkflow workflow;
    return wf::main(argc, argv, workflow);
}
```

## The Workflow Class

The Workflow class helps us describe our test workflow. It encapsulates any
logic that distinguishes our test tool from other test tools. This class is
given to the `main` function of the test framework that calls its different
member functions in a specific order. Most member functions have a trivial
default implementation that you can override and customize.

See our Reference API documentation for a complete list of the member functions
of the Workflow class and the order in which they are called.

There are two member function that _must_ be implemented:

- `Workflow::execute` is meant to describe how a particular test case should be
  executed. This is the function that we override to pass our test cases to the
  code under test.

- `Workflow::suite` is meant to describe how a list of our test cases should be
  obtained when we run the test tool. Since many test tools may use the same
  approach to obtain this list, we describe this logic in a separate instance of
  the `Suite` class.

## The Suite Class

Touca test framework allows us to formulate how the list of our test cases
should be obtained by deriving from class `touca::framework::Suite`.

In our `is_prime` example, we used a list of eight numbers as our set of inputs
to the code under test. The following code snippet shows one way to represent
this list by deriving from the Suite class:

```cpp
class MySuite final : public touca::framework::Suite
{
public:
    MySuite() : Suite()
    {
        for (const auto number: { 1, 2, 3, 4, 7, 673, 7453, 14747 })
        {
            push(std::to_string(number));
        }
    }
};
```

We can use this class to implement `Workflow::suite`.

```cpp
std::shared_ptr<touca::framework::Suite> suite() const override
{
    return std::make_shared<MySuite>();
}
```

To allow changing our test cases without the need to rebuild our test tool, we
can list our test cases in an external file to be read and parsed at runtime.
The test framework includes a few prepared implementations of the `Suite` class.

```cpp
std::shared_ptr<touca::framework::Suite> suite() const override
{
    return std::make_shared<touca::framework::FileSuite>("suite.txt");
}
```

## Running the Test

We can test any revision of our code under test by passing command-line options
`--revision` and `--config-file` as shown below:

```bash
$ ./regression_test -c ./config.json -r 1.0
```

Where `config.json` may have the following content:

{% code title="config.json" %}

```javascript
{
  "framework": {
    "output-dir": "./output",
    "save-as-binary": "true",
    "save-as-json": "false"
  },
  "touca": {
    "api-key": "0eb962f2-84cd-4a01-9721-c339dc335972",
    "api-url": "https://api.touca.io/@/myteam/is_prime"
  }
}
```

{% endcode %}

And `suite.txt` simply lists our Test Cases:

{% code title="suite.txt" %}

```text
1
2
3
4
7
673
7453
14747
```

{% endcode %}

We can expect the test to produce an output similar to what is shown below:

```text
Touca Test Framework
Suite: is_prime
Revision: 1.0

 (  1 of 8  ) 1                                (pass, 0 ms)
 (  2 of 8  ) 2                                (pass, 0 ms)
 (  3 of 8  ) 3                                (pass, 0 ms)
 (  4 of 8  ) 4                                (pass, 0 ms)
 (  5 of 8  ) 7                                (pass, 0 ms)
 (  6 of 8  ) 673                              (pass, 0 ms)
 (  7 of 8  ) 745                              (pass, 0 ms)
 (  8 of 8  ) 14747                            (pass, 0 ms)

Processed 8 of 8 testcases
Test completed in 0 ms
```

## Customizing

Touca test framework allows us to provide a custom implementation for the member
functions of the Workflow class. The set of supported configuration options are
customizable too. In this section, we briefly demonstrate how these features can
be used.

The example provided in the previous section extracts the list of Test Cases
from a text file with a fixed filename `suite.txt`. Let us try to make this
filename configurable.

One way to make this file configurable is to add it to the list of configuration
parameters specified in our application configuration file.

{% code title="config.json" %}

```javascript
{
  "framework": {
    "output-dir": "./output",
    "save-as-binary": "true",
    "save-as-json": "false"
  },
  "touca": {
    "api-key": "0eb962f2-84cd-4a01-9721-c339dc335972",
    "api-url": "https://api.touca.io/@/myteam/is_prime"
  },
  "workflow": {
    "suite-file": "./suite.txt"
  }
}
```

{% endcode %}

Doing so makes this configuration parameter available in any member function of
the `Workflow` class through the `_options` member variable. This allows us to
change the implementation of member function `suite()` to the following:

```cpp
std::shared_ptr<wf::Suite> wf::suite() const override
{
    return std::make_shared<wf::FileSuite>(_options.at("suite-file"));
}
```

This change makes `suite-file` a required configuration option. We can ensure
that this option is always provided by implementing the member function
`Workflow::validate_options`.

```cpp
bool wf::validate_options() const override
{
    return _options.count("suite-file");
}
```

If we decide to declare this parameter as a command-line option, it suffices
that we implement the member function `Workflow::parse_options` and append the
value parsed from the command line arguments to the member variable `_options`
by calling `Workflow::add_option`. If we do so, it also makes sense to implement
`Workflow::describe_options` to provide a simple string that is shown to the
user if they run the Test Tool with the option `--help`.
