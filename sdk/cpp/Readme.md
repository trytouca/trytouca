<div align="center">
  <a href="https://getweasel.com" target="_blank" rel="noopener">
    <img alt="Weasel Logo" height="48px" src="https://getweasel.com/assets/logo/weasel-logo-w-text.svg">
  </a>
  <h1>Client Library for C++</h1>
  <p>
    <a href="https://getweasel.com" target="_blank" rel="noopener">Get Started</a>
    <span> &middot; </span>
    <a href="https://docs.getweasel.com" target="_blank" rel="noopener">Documentation</a>
    <span> &middot; </span>
    <a href="https://getweasel.slack.com" target="_blank" rel="noopener">Community</a>
    <span> &middot; </span>
    <a href="https://github.com/getweasel/weasel-cpp/blob/main/LICENSE">License</a>
  </p>
</div>

Weasel is a continuous regression testing solution that helps engineering
teams understand the impact of their daily code changes on the behavior or
performance of their software workflows.

Checkout https://getweasel.com to learn more and get started.

## Features

* **Say Goodbye to Snapshot Files**  
  Weasel offers client libraries that help you capture test results or
  performance benchmarks from anywhere within your workflow and submit
  them to a remote Weasel Platform where they are stored and compared
  against your baseline.

* **Capture without Compromise**  
  Unlike snapshot files that often store the output of a given version
  of your workflows, Weasel gives you fine-grained control over what
  variables and return values to capture as test result.

* **Lossless Comparison**  
  Weasel client libraries preserve the types of your captured data. The
  platform compares test results of any two versions of your workflow
  in their original data type.

* **Scale without Worry**  
  Managing result files for hundreds of test cases is not feasible at
  scale. Let the Weasel Platform manage your test results, compare them
  against previous versions, and report any found differences in an easy
  to understand format.

And many more! Checkout a [recorded product demo][YouTube] or
[schedule a meeting][Calendly] with us to discuss if Weasel can
help your team refactor code, safer and more efficiently.

## Documentation

* [Quickstart Guide](docs/BasicApi.md)
* [Integration Guide](docs/Integration.md)
* [Using the Client Library](docs/Quickstart.md)
* [Using the Test Framework](docs/Tutorials.md)
* [Build Instructions](docs/Build.md)

Other Useful Links:

* [Public Product Roadmap][Roadmap]
* [Sample Regression Test Tools][weasel-examples]
* [Online Documentation][Documentation]
* [C++ Reference API][weasel-cpp-api]

We want Weasel to work well for you.
If you need help, have any questions, like to contribute or to provide
feedback, join us on [Slack] or email us at [hello@getweasel.com].

[Slack]: https://getweasel.slack.com
[Calendly]: https://calendly.com/ghorbanzade/30min
[YouTube]: https://www.youtube.com/channel/UCwa-rweWShIJo_DYhp2rVew
[hello@getweasel.com]: mailto:hello@getweasel.com

[Roadmap]: https://bit.ly/3q4EOcI
[Documentation]: https://docs.getweasel.com
[weasel-cpp-api]: https://getweasel.com/docs/clients/cpp/api.html
[weasel-examples]: https://github.com/getweasel/examples
