
# Examples

## Basic Function API

This example intends to introduce basic function API of Weasel Client Library
for C++. It does not provide a comprehensive set of available functions, nor
does it reflect the best practices of building a regression testing tool.
Please consult with Weasel documentation when developing a regression test
tool for real-world production code.

```cpp
/**
 * @file code_under_test.hpp
 *
 * @brief Represents any production code whose workflow should be tested.
 */

/**
 * A simple function as a sample code under test.
 */
bool is_tall(const float height)
{
    if (height <= 0) {
      const auto& msg = "expected height to be positive";
      throw std::invalid_argument(msg);
    }
    return 6.0f < height;
}
```

```cpp
#include <code_under_test.hpp>
#include <weasel/weasel.hpp>

/**
 * @file regression_test.cpp
 *
 * @brief Sample test tool to check production code for any regressions.
 */

/**
 * It is preferrable that the regression test follows the same
 * workflow as the production code. If the production workflow
 * is defined to take input A, perfrom a series of operations
 * and produce output B, the test workflow should take a set of
 * inputs similar to A as its testcases and perform the same
 * series of operations on each as in production workflow.
 */
int main()
{
    // configure weasel client, once during application runtime,
    // preferrably during process startup, before adding results
    // or submitting them to Weasel Platform.
    //
    // this function, together with `declare_testcase`, activates
    // all other Weasel client functions. They are intended to be
    // called exclusively from regression testing workflows and
    // not from production code.

    weasel::configure({
      { "api-key", "03dda763-62ea-436f-8395-f45296e56e4b" },
      { "api-url", "https://getweasel.com/api/@/tutorial/tutorial" },
      { "version", "1.0" },
    });

    // declare a testcase to which subsequent test results should
    // belong. we can declare any number of testcases during the
    // runtime of this application.

    weasel::declare_testcase("hgranger");

    // once we declare a testcase, we can add test results to it,
    // associating each result with a unique keyname. Results may
    // be logged from any function and can be of any type.
    // Weasel type system has built-in support for commonly-used types
    // in standard library and is extensible to enable passing results
    // with custom types. Once results are posted to Weasel Platform,
    // they will be compared with results of prior versions in their
    // original data type to avoid any precision loss.
    // These logging functions may be called from production code;
    // they will be no-op when a testcase is not already declared.

    weasel::add_assertion("name", L"Hermione Jean Granger");
    weasel::add_result("height", 5.5f);
    weasel::add_result("wands", { "dragon heartstring" });
    weasel::add_result(L"weight", 120.0);

    try {
      weasel::add_result("is_tall", is_tall(5.5f));
    } catch (const std::exception& ex) {
      weasel::add_array_element("errors", ex.what());
    }

    // Once all your desired test results are added to the testcase(s),
    // you may save them on local disk in json or binary formats, and/or
    // post them to the Weasel platform. You can perform these operations
    // as many times as necessary during runtime of application and for
    // any subset of declared testcases. Similar to `configure` and
    // `declare_testcase`, these functions are not intended to be used
    // in production code.

    weasel::save_binary("tutorial.bin");
    weasel::save_json("tutorial.json");
    weasel::post();
}
```
