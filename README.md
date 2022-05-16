# Touca

[![License](https://img.shields.io/github/license/trytouca/trytouca?color=blue)](https://github.com/trytouca/trytouca/blob/main/LICENSE)
[![Documentation Website](https://img.shields.io/static/v1?label=docs&message=touca.io/docs&color=blue)](https://touca.io/docs)
[![Product Demo](https://img.shields.io/static/v1?label=demo&message=touca.io/demo&color=blue)](https://touca.io/demo)
[![Community](https://img.shields.io/static/v1?label=community&message=touca.io/discord&color=blue)](https://touca.io/discord)

Touca is an open-source regression testing solution, built for engineers.

- Track regressions between different software versions
- Understand how your software evolves in behavior and performance

[![Touca Server](https://touca.io/images/touca-screenshot-suite-page.jpg)](https://touca.io/images/touca-screenshot-suite-page.jpg)

## Start for free

### Option 1: Self-host locally

Run the following command to locally self-host our server.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trytouca/trytouca/main/ops/install.sh)"
```

### Option 2: Use our cloud instance

Sign up for free at https://app.touca.io.

## Value Proposition

Touca is very effective in addressing common problems in the following
situations:

- When we need to test our workflow with a large number of inputs.
- When the output of our workflow is too complex, or too difficult to describe
  in our unit tests.
- When interesting information to check for regression is not exposed through
  the interface of our workflow.

The highlighted design features of Touca can help us test these workflows at any
scale.

- Decoupling our test input from our test logic, can help us manage our long
  list of inputs without modifying the test logic. Managing that list on a
  remote server accessible to all members of our team, can help us add notes to
  each test case, explain why they are needed and track how their performance
  changes over time.
- Submitting our test results to a remote server, instead of storing them in
  files, can help us avoid the mundane tasks of managing and processing of those
  results. The Touca server retains test results and makes them accessible to
  all members of the team. It compares test results using their original data
  types and reports discovered differences in real-time to all interested
  members of our team. It allows us to audit how our software evolves over time
  and provides high-level information about our tests.

## Documentation

If you are new to Touca, the best place to start is the
[Quickstart Guide](https://touca.io/docs/basics/quickstart) on our documentation
website.

## Community

We hang on [Discord](https://touca.io/discord). Come say hi! We love making new
friends. If you need help, have any questions, or like to contribute or provide
feedback, that's the best place to be.

## License

This repository is released under the Apache-2.0 License. See
[`LICENSE`](https://github.com/trytouca/trytouca/blob/main/LICENSE).
