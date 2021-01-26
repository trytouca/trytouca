
# Basic API

> This section is meant to introduce basic function API of this client library.
> We encourage you to consult with our [Quickstart](./Quickstart.md)
> document to learn how to use Weasel to develop regression test tools.

Let us imagine that we like to setup continuous regression testing for the
following Code Under Test:

```cpp
bool is_prime(const unsigned number);
```

As a first step, we can create a regression test executable that has access
to the entry-point of our Code Under Test.
See our [Integration Guide](docs/Integration.md) to learn how to
integrate Weasel as a third-party dependency with your code.

```cpp
#include "weasel/weasel.hpp"
```

Our goal is to run this regression test tool every time we make changes to
our software. For each version, we can invoke our Code Under Test any number
of times with different inputs and capture any data that indicates its
behavior or performance.

```cpp
    for (const auto& input_number : { 1, 2, 3, 4, 7, 673, 7453, 14747 }))
    {
        weasel::declare_testcase(std::to_string(input_number));
        weasel::scoped_timer timer("is_prime runtime");
        weasel::add_result("is_prime", is_prime(input_number));
    }
```

But all Weasel functions are disabled by default until we configure the
library which is meant to be done only in our regression test tool.
This behavior allows us to move our data caputring functions inside the
implementation of our Code Under Test if we liked to do so. When our software
is running in a production environment, the client is not configured and
all its functions remain no-op.

```cpp
    weasel::configure({
      { "api-key", "<your-api-key>" },
      { "api-url", "<your-api-url>" },
      { "version", "<your-software-version>" }
    });
```

Once all our desired test results are added to the testcase(s), we may save
them on the local filesystem and/or submit them to the Weasel platform.

```cpp
    weasel::save_binary("tutorial.bin");
    weasel::save_json("tutorial.json");
    weasel::post();
```

The Platform compares the test results submitted for a given version against
a baseline version known to behave as we expect. If differences are found
Weasel notifies us so we can decide if those differences are expected are
symptoms of an unintended side-effect of our change.

Putting this all together, our very basic regression test tool may look like
the following:

```cpp
#include "weasel/weasel.hpp"

int main()
{
    weasel::configure({
      { "api-key", "<your-api-key>" },
      { "api-url", "<your-api-url>" },
      { "version", "<your-software-version>" }
    });

    for (const auto& input_number : { 1, 2, 3, 4, 7, 673, 7453, 14747 }))
    {
        weasel::declare_testcase(std::to_string(input_number));
        weasel::scoped_timer timer("is_prime runtime");
        weasel::add_result("is_prime", is_prime(input_number));
    }

    weasel::save_binary("tutorial.bin");
    weasel::save_json("tutorial.json");
    weasel::post();
}
```

We just scratched the surface of how Weasel can help us setup continuous
regression testing for our software. We encourage you to explore Weasel documentation to learn how to get started.
