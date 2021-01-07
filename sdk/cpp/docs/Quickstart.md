# Getting Started

This document walks you through creating your first Regression Test Tool
that integrates with the Weasel Client Library for C++ to submit results
to the Weasel Platform.

## Using Weasel Client Library

Weasel is designed for easy integration with any production code of any size.
Regardless of its order of complexity, any code under test can be considered
as a function that takes *some* set of inputs and performs *some* operation,
possibly producing *some* output.
For simplicity, let us assume that our code under test is a function that
takes a number and determines whether it is prime or not.

```cpp
/**
 * @file code_under_test.hpp
 */

bool is_prime(const unsigned number);
```

We are not providing any implementation here since any Code Under Test is
expected to change over time. We assume that different Revisions of this
function may have different implementations but will share the same expected
behavior.

Our objective is to create a simple Regression Test Tool that we can build
and run for any Revision of the Code Under Test to identify any change in
the actual behavior of the function.

### Anatomy of a Test Tool

Like any Test Tool, a Regression Test Tool is a standalone application that
can invoke our Code Under Test once or several times with one or more sets
of inputs.

The lifecycle of our Test Tool can be thought to have three phases:

1. **Initialization**: We configure our application resources and prepare
   a list of our Test Cases.

2. **Execution**: We execute our Workflow Under Test, once per each Test Case,
   and capture any data that characterize some aspect of the *behavior* or
   *performance* of our Workflow.

3. **Reporting**: We can print our captured data on the screen, or write them
   into a file. When using Weasel, we also have the option to submit them to
   the Weasel Platform.

When using any of the Weasel Client Libraries, we configure the Weasel Client
in the initialization phase, capture Test Results and Metrics during the
execution phase, and submit our captured data to the Weasel platform during
the reporting phase.

### Integrating the Client

Weasel Client Library for C++ is cross-platform and supports all popular
compilers. It offers a build script that simplifies its build process into
one single terminal command. See our "Build Instructions" document to learn
how to build the library with your preferred toolchain and integrate it with
your software development ecosystem.

Once the Client Library is linked to our Test Tool, we can start making use
of it by including its entry-point header file. 

```cpp
#include "weasel/weasel.hpp"
```

### Configuring the Client

Weasel Client requires a one-time call of function `weasel::configure`. This
configuration effectively activates all other Weasel functions for capturing
data and submission of results. Therefore, this function must be called from
our Test Tool, and not from our Code Under Test.
This design enables us to leave the calls to Weasel data capturing functions
in our production code without having to worry about their performance impact.

An ideal context to configure the Weasel Client is the `main` function of our
Test Tool during the application's initialization phase.

```cpp
weasel::configure({
    { "version", "1.0" },
    { "suite", "<YOUR SUITE SLUG>" },
    { "team", "<YOUR TEAM SLUG>" },
    { "api-key", "<YOUR API KEY>"},
    { "api-url", "https://getweasel.com/api" }
});
```

As shown above, configuring the client is as simple as calling `configure`
with our configuration parameters in string format. The example above uses
a set of configuration parameters that ensures the client is properly
configured for any operation.

* `"version"` is an identifier for the implementation of our Workflow at a
  particular point in time. This parameter is expected to be different for
  different implementations of the Code Under Test.

* `"suite"` is an identifier for our Regression Test Workflow.
  It is used on the Weasel Platform to distinguish our captured data from the
  captured data submitted by other Weasel-based regression test applications.
  This parameter is expected to remain the same for different implementations
  of the Code Under Test.

* `"team"` is an identifier for the group of users who work on the Code Under
  Test and are potentially interested in reviewing the submitted test results.

* `"api-key"` is a user-specific token for authenticating to the Weasel
  Platform API. You can access your API Key from the "Account Settings" page
  on the Weasel Web Application.

* `"api-url"` includes the URL to the Weasel Platform API as well as the slugs
  for the Team and Suite to which our test results should be associated.

Consult with our Reference API documentation for a complete list of valid
configuration parameters and an explanation of their effects.

**Note**: We suggest that you assume configuring the Weasel client is a
time-consuming procedure that may take up to a tens of milliseconds.

### Declaring Test Cases

In the example above, our `is_prime` function which serves as our Code Under
Test takes a non-negative number as its input. Naturally, it makes sense for
our Regression Test Tool to test any implementation of `is_prime` with a set
of prime and non-prime numbers. Let us suppose that we choose the following
set of input numbers for our test.

```cpp
const auto input_numbers = { 1, 2, 3, 4, 7, 673, 7453, 14747 };
```

We can give each input number to our `is_prime` function and capture data
about its behavior and performance. Since we have multiple input numbers,
we need a way to distinguish our captured data for each input.

With Weasel, we do so by matching each input number with a Test Case of a
unique name. For the example above, we can use the string representation of
each input number as the name of its Test Case.

Before passing each input to the Code Under Test, we can declare our Test Case
by calling `weasel::declare_testcase` to indicate that any subsequent calls
to Weasel's data capturing functions should associate the captured data with
the declared Test Case.

```cpp
for (const auto& input_number : input_numbers))
{
    weasel::declare_testcase(std::to_string(input_number));
    // ... execution
}
```

Note that the choice of the entity to define as a Test Case is for us, as
authors of the Test Tool, to make. As a rule of thumb, the definition must be
such that the Code Under Test is expected to yield a consistent behavior
in different Revisions.

Similar to `weasel::configure`, `weasel::declare_testcase` should be called
from our Test Tool, and not from our Code Under Test.

### Adding Results

Once a Test Case is declared, we can start executing the Code Under Test that
takes the input associated with the Test Case and performs *some* operation
on it. As we do so, we can capture as test results, values of any variable in
the code that we intend to test for regression between different Revisions.

In our example, our Code Under Test is a single function `is_prime` with a
straightforward output indicating whether our number is prime or not. Since
this output demonstrates the overall behavior of our Code Under Test, it is
worth capturing as a Test Result.

```cpp
weasel::add_result("is_prime", is_prime(input_number));
```

The return value of function `is_prime` is captured in its original type along
with a unique identifier as the name of this data point, as reported on the
Weasel Platform.

Since we are capturing the return output of our function, we are calling
`weasel::add_result` to the implementation of our Test Tool but we are not
bound to do so. We can add any of Weasel's data capturing functions to any
function that may be executed when we run our Workflow Under Test.

```cpp
bool is_prime(const unsigned number)
{
    const auto is_even = number % 2 == 0;
    weasel::add_result("is_even", is_even);
    if (is_even) {
      return false;
    }
    // ...
}
```

When our Code Under Test is running in production mode, all the data capturing
functions of the Weasel library will be ineffective and will have no impact on
the behavior of the software. In our Test Tool, our call to `weasel::configure`
activates the data capturing functions, allowing us to extract information
about the internal state of the production functions without the need to expose
them.

We can add any number of test results for each Test Case. The Library offers
variants of function `weasel::add_result` like `weasel::add_array_element`
and `weasel::add_hit_count` that make it convenient to capture data in various
code patterns. You can find a complete list of these functions in our API
Reference document.

Weasel data capturing functions preserve the type of the original data and
compare the captured results in their original type. Weasel's type system has
built-in support for many commonly-used types of the C++ standard library and
can easily be extended to support custom data types; as we will see in the
next section.

### Supporting Custom Types

In the code snippet above, variable `is_even` had a primitive data type.
But let us assume that we were interested to capture a variable in a more
complex Code Under Test that had a custom user-defined type `Date` with the
following structure.

```cpp
struct Date
{
    unsigned short _year;
    unsigned short _month;
    unsigned short _day;
};
```

Using the natively supported types, we can add a value of type `Date` as
three separate testresults that each cover indivial member variables.
But this practice is cumbersome and impractical for real-world complex data
types.
To solve this, we can extend Weasel type system to support type `Date`
by defining a partial template specialization function for it.

```cpp
template <>
struct weasel::convert::Conversion<Date>
{
    std::shared_ptr<types::IType> operator()(const Date& value)
    {
        auto out = std::make_shared<types::Object>("Date");
        out->add("year", value._year);
        out->add("month", value._month);
        out->add("day", value._day);
        return out;
    }
};
```

Once the client library learns how to handle a custom type, it automatically
supports handling it as sub-component of other types.
As an example, with the above-mentioned partial template specialization
function for type `Date`, we can start adding testresults of type
`std::vector<Date>` or type `std::map<string, Date>`.
Additionally, supporting type `Date` enables objects of this type to be used
as smaller components of even more complex types.

Consult with the Weasel Type System section in Reference API documentation
for more explanation and examples for supporting custom types.

### Adding Assertions

There are always certain variables in the Code Under Test that are expected
hardly ever to change for the same input between different Revisions of the
software unless basic assumptions about the behavior of the Code Under Test
are violated. When such variables do change, inspecting the change is of the
highest priority and changes in other Test Results are usually less noteworthy.

Weasel offers a special feature for tracking these variables by capturing
them as `"assertions"`. Assertions are treated differently by the Weasel
Platform: The platform especially highlights assertions if they are different
between two test versions and removes them from user focus if they remain
unchanged. Therefore, assertions are particularly helpful for verifying
assumptions about input data and their properties without overwhelming the
Test Result reports.

Even though our `is_prime` example is too primitive, we can capture the input
number as an assertion making sure that the Test Case always represents that
number.

```cpp
weasel::add_assertion("input_number", input_number);
```

Type handling of Assertions is similar to type handling of Results as
mentioned in the previous section.

### Adding Metrics

Besides Test Results, Weasel enables testing the *performance* of our Code
Under Test to track if the changes introduced in a given Revision make the
Workflow slower or faster for any subset of Test Cases. We refer to the
captured performance data as Metrics. Weasel offers a variety of patterns
to collect Metrics for any part of our software.

In our `is_prime` example, we may want to track the overall runtime of our
function. The code snippet below shows one way of collecting that information.

```cpp
int main()
{
    // ...
    weasel::start_timer("overall runtime");
    weasel::add_result("is_prime", is_prime(input_number));
    weasel::stop_timer("overall runtime");
    // ...
}
```

Alternatively, we can add a `weasel::scoped_timer` to the `is_prime` function
implementation:

```cpp
bool is_prime(const unsigned number)
{
    weasel::scoped_timer timer("overall runtime");
    weasel::add_assertion("input_number", input_number);
    // ...
}
```

The Reference API documents a complete list of Weasel functions for capturing
Metrics.

### Posting Results

Once we execute our Code Under Test and capture our test results, we have the
option to submit them to the Weasel Platform using the function `weasel::post`.
Doing so allows us to inspect the captured data and compare them with our
previously captured expected data.

```cpp
weasel::post();
```

It is possible to call `weasel::post` multiple times during the runtime of our
Test application. Testcases already submitted to the Weasel Platform whose
results have not changed, will not be resubmitted. It is also possible to add
results to an already submitted Test Case. Any subsequent call to `weasel::post`
will resubmit the modified Test Cases.

We generally recommend that `weasel::post` be called every time the Code Under
Test is executed for a given Test Case. This practice enables getting real-time
feedback by comparing results with the Suite baseline.

See the Reference API documentation for further information about function
`weasel::post`.

### Storing Results

If we like to do so, we can store our captured data for one or more declared
Test Cases on the local filesystem for further processing or later submission
to the Weasel Platform.

Captured Data may be stored in either JSON or binary format using functions
`weasel::save_json` or `weasel::save_binary` respectively. While JSON files
are preferable for quick inspections, only binary files may be posted to the
Weasel platform at a later time.

```cpp
weasel::save_binary("tutorial.bin");
weasel::save_json("tutorial.json");
```

### The Final Test Tool

Putting things together, the code snippet below demonstrates the fundamental
structure of the Regression Test Tool using Weasel Client Library for C++.

```cpp
/**
 * @file regression_test.hpp
 */

#include "code_under_test.hpp"
#include "weasel/weasel.hpp"

int main()
{
    weasel::configure({
        { "version", "<REVISION>" },
        { "suite", "<YOUR SUITE SLUG>" },
        { "team", "<YOUR TEAM SLUG>" },
        { "api-key", "<YOUR API KEY>"},
        { "api-url", "https://getweasel.com/api" }
    });

    for (const auto& input_number : { 1, 2, 3, 4, 7, 673, 7453, 14747 }))
    {
        weasel::declare_testcase(std::to_string(input_number));
        weasel::add_assertion("input_number", input_number);
        weasel::start_timer("overall runtime");
        weasel::add_result("is_prime", is_prime(input_number));
        weasel::stop_timer("overall runtime");
    }

    weasel::save_binary("tutorial.bin");
    weasel::save_json("tutorial.json");
    weasel::post();
}
```

Evidently, the code above is missing many features of a useful Test Tool:

* The Test Cases are hard-coded. Running the Code Under Test with a different
  set of Test Cases requires rebuilding the Test Tool.

* Version is hard-coded. Manually changes the Revision number every time a
  change is introduced to the Code Under Test is not practical.

* API Key is hard-coded. Weasel API Key should be considered private user
  information. It is preferable that it is read from a file or set as an
  environment variable.

* The application is missing appropriate error handling and error checking.
  A serious Test Tool should handle any potential exception thrown by the
  Code Under Test for any Test Case. Also, function `weasel::configure`
  may throw if it is passed invalid or missing configuration parameters.

In addition to the issues above, a typical Regression Test Tool for a
non-trivial Code Under Test may demand supporting command-line options
and configuration files, reporting its progress to the standard output,
logging events generated by the Code Under Test, and many other usual
application features.

While it is possible to implement these features in the application above,
Weasel provides a separate Test Framework for C++ that helps abstract away
many of the common features so developers can focus on testing the Code
Under Test. We cover this Test Framework in the "Tutorials" document.
