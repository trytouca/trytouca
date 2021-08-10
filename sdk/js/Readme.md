<div align="center">
  <a href="https://touca.io" target="_blank" rel="noopener">
    <img alt="Touca Logo" height="48px" src="https://touca.io/logo/touca-logo-w-text.svg" />
  </a>
  <h1>Touca SDK for JavaScript</h1>
  <p>
    <a href="" target="_blank" rel="noopener"><img alt="Build Status" src="https://img.shields.io/github/workflow/status/trytouca/touca-js/touca-js-main" /></a>
    <a href="https://github.com/trytouca/touca-js/blob/main/LICENSE" target="_blank" rel="noopener"><img alt="License" src="https://img.shields.io/github/license/trytouca/touca-js" /></a>
    <a href="https://app.codecov.io/gh/trytouca/touca-js"><img src="https://img.shields.io/codecov/c/github/trytouca/touca-js"/></a>
  </p>
  <p>
    <a href="https://app.touca.io" target="_blank" rel="noopener">Get Started</a>
    <span> &middot; </span>
    <a href="https://docs.touca.io/api/js-sdk" target="_blank" rel="noopener">Documentation</a>
  </p>
</div>

Touca helps engineering teams understand the true impact of their code changes
on the behavior and performance of their software.
Test your most complex software workflows with any number of real-world inputs
to significantly reduce the risks of changing code in mission-critical systems.

![Touca Server](https://gblobscdn.gitbook.com/assets%2F-MWzZns5gcbaOLND3iQY%2F-MbwEQRnyNCcNhCOZail%2F-MbwFdJnPRjj4AxZb5a9%2Fpic1.png?alt=media&token=53187b81-7358-4701-95e6-b3e420dd10bd)

## ✨ Features

Touca is an automated regression testing system for testing complex
mission-critical workflows with any number of real-world inputs.

* **Say Goodbye to Snapshot Files**  
  Touca offers client libraries that help you capture test results or
  performance benchmarks from anywhere within your workflow and submit
  them to a remote Touca server where they are stored and compared
  against your baseline.

* **Capture without Compromise**  
  Unlike snapshot files that often store the output of a given version
  of your workflows, Touca gives you fine-grained control over what
  variables and return values to capture as test result.

* **Lossless Comparison**  
  Touca client libraries preserve the types of your captured data. The
  Touca server compares test results of any two versions of your workflow
  in their original data type.

* **Scale without Worry**  
  Managing result files for hundreds of test cases is not feasible at
  scale. Let the Touca server manage your test results, compare them
  against previous versions, and report any found differences in an easy
  to understand format.

And many more! Checkout a [recorded product demo][YouTube] to learn more.

## 📖 Documentation

* If you are new to Touca, the best place to start is our
  [Quickstart Guide][docs-quickstart] on our documentation website.
* For information on how to use this library, examples, and tutorials,
  checkout our [JavaScript SDK Documentation][docs-js].
* If you cannot wait to start writing your first test with Touca,
  checkout our [JavaScript API Reference][docs-js-api].

## 🙋 Ask for Help

We want Touca to work well for you. If you need help, have any questions, or
like to provide feedback, send us a note through the Intercom at Touca.io or
send us an email us at [hello@touca.io].

## 💸 What's Next?

Touca client libraries are free and open-source. Our cloud-hosted version of
Touca server at Touca.io has a free forever plan. You can create an account
and explore Touca server capabilities on your own. But we want to help you
get on-boarded and answer any questions you may have in the process.
So we ask that you schedule a no-pressure chat with us [here][Calendly].
We like to learn more about you, understand your software and its requirements,
and do our best to make Touca provide value to you and your team.

## License

This repository is released under the Apache-2.0 License. See [`LICENSE`][license].

[Calendly]: https://calendly.com/ghorbanzade/30min
[YouTube]: https://www.youtube.com/channel/UCAGugoQDJY3wdMuqETTOvIA
[hello@touca.io]: mailto:hello@touca.io
[license]: https://github.com/trytouca/touca-js/blob/main/LICENSE

[docs-quickstart]: https://docs.touca.io/getting-started/quickstart
[docs-submit]: https://docs.touca.io/guides/submit
[docs-js-integration]: https://docs.touca.io/api/js-sdk/integration
[docs-js]: https://docs.touca.io/api/js-sdk
[docs-js-api]: https://app.touca.io/docs/clients/js/api.html
