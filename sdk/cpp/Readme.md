# Weasel Client Library for C++

<div align="center">
  <a href="https://getweasel.com" target="_blank" rel="noopener noreferrer">
    <img alt="Weasel Logo" height="96px" src="https://getweasel.com/assets/logo/logo-bg-primary.svg">
  </a>
  <p>
    <a href="https://getweasel.com">Weasel Platform</a>
    <span> &middot; </span>
    <a href="https://getweasel.com/docs">Docs</a>
    <span> &middot; </span>
    <a href="https://getweasel.slack.com">Community</a>
    <span> &middot; </span>
    <a href="https://github.com/getweasel/weasel-cpp/blob/main/LICENSE">License</a>
  </p>
</div>

---

## Introduction

[Weasel][Platform] is a continuous regression testing solution that helps
engineering teams understand the impact of their daily code changes.

[Weasel][Platform] enables engineers to establish a baseline for any software
execution workflow that describes the approved behavior and performance of
that workflow.
When engineers make subsequent changes to the components involved in that
workflow, Weasel identifies and reports any potential change of behavior
or performance and helps engineers determine if such change matches their
expectations. Weasel allows engineers to keep track of the requirements
of each software component and helps them perform major refactors without
violating those requirements.

Visit the [Weasel Platform][Platform] to learn more and get started.

## Product Demo

Curious how Weasel works? Click [here][Calendly] to schedule a live product
demo any time that works best for you. You can also watch a recorded product
demo on [YouTube].

## Community

If you have questions about Weasel, like to contribute or to provide feedback,
come join us on [Slack] and say hi! We love to hear from you.

## Stay in Touch

You can subscribe to our [Newsletter] to receive monthly product updates and
track our progress.
You can also follow us on [Twitter] for status updates, new features etc.

## Resources

* [Public Product Roadmap][Roadmap]
* [Sample Regression Test Tools][weasel-examples]

---


## Getting Started

> This section is meant to introduce basic function API of this client library.
> We encourage you to consult with our [Quickstart](docs/Quickstart.md)
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
regression testing for our software. We encourage you to learn more using
the links provided in the next section.

## Documentation

* [Using the Client Library](docs/Quickstart.md)
* [Using the Test Framework](docs/Tutorials.md)
* [Integration Guide](docs/Integration.md)
* [Build Instructions](docs/Build.md)

External Links:

* [Online Documentation][Documentation]
* [Reference API][weasel-cpp-api]

[Platform]: https://getweasel.com
[Documentation]: https://getweasel.com/docs
[Slack]: https://getweasel.slack.com
[Conduct]: https://github.com/getweasel/.github/blob/main/Code_of_Conduct.md
[Calendly]: https://calendly.com/ghorbanzade/weasel
[YouTube]: https://www.youtube.com/channel/UCwa-rweWShIJo_DYhp2rVew
[Newsletter]: https://www.getrevue.co/profile/weasel
[Twitter]: https://twitter.com/getweasel
[Roadmap]: https://github.com/orgs/getweasel/projects/1
[weasel-cpp]: https://github.com/getweasel/weasel-cpp
[weasel-cpp-api]: https://getweasel.com/docs/clients/cpp/api.html
[weasel-examples]: https://github.com/getweasel/examples
