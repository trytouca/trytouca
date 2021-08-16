<div align="center">
  <a href="https://touca.io" target="_blank" rel="noopener">
    <img alt="Touca Logo" height="48px" src="https://touca.io/logo/touca-logo-w-text.svg" />
  </a>
  <h1>Touca SDK for JavaScript</h1>
  <p>
    <a href="https://www.npmjs.com/package/@touca/node" target="_blank" rel="noopener"><img alt="npm version" src="https://img.shields.io/npm/v/@touca/node?color=blue" /></a>
    <a href="https://github.com/trytouca/touca-js/actions" target="_blank" rel="noopener"><img alt="Build Status" src="https://img.shields.io/github/workflow/status/trytouca/touca-js/touca-js-main" /></a>
    <a href="https://app.codecov.io/gh/trytouca/touca-js" target="_blank" rel="noopener"><img alt="Code Coverage" src="https://img.shields.io/codecov/c/github/trytouca/touca-js" /></a>
    <a href="https://app.codacy.com/gh/trytouca/touca-js" target="_blank" rel="noopener"><img alt="Code Quality" src="https://img.shields.io/codacy/grade/dca09feb49f142468bdd864a8015a53f" /></a>
    <a href="https://github.com/trytouca/touca-js/blob/main/LICENSE" target="_blank" rel="noopener"><img alt="License" src="https://img.shields.io/github/license/trytouca/touca-js" /></a>
  </p>
  <p>
    <a href="https://app.touca.io" target="_blank" rel="noopener">Get Started</a>
    <span> &middot; </span>
    <a href="https://docs.touca.io/api/js-sdk" target="_blank" rel="noopener">Documentation</a>
  </p>
</div>

Touca helps engineering teams see the true impact of their code changes
on the behavior and performance of their software, as they write code.

![Touca Server](https://gblobscdn.gitbook.com/assets%2F-MWzZns5gcbaOLND3iQY%2F-MbwEQRnyNCcNhCOZail%2F-MbwFdJnPRjj4AxZb5a9%2Fpic1.png?alt=media\&token=53187b81-7358-4701-95e6-b3e420dd10bd)

## 👀 Sneak Peak

Let us imagine the following function as our code under test.

```ts
function is_prime(input: number): boolean;
```

We can use unit testing in which we hard-code a set of input numbers
and list our expected return value for each input. Or we can use Touca
to describe the behavior and performance of software. Touca compares our
description against that of a previous version of our software and shows
any differences in near real-time.

```ts
import { touca } from '@touca/node';
import { is_prime } from './code_under_test';

touca.workflow('is_prime_test', (testcase: string) => {
  const number = Number.parseInt(testcase);
  touca.add_result('is_prime_output', is_prime(number));
});

touca.run();
```

Where `@touca/node` is the package name for our Touca SDK for JavaScript.

```bash
npm install @touca/node
```

We can run this test with any number of inputs from the command line:

```bash
node dist/is_prime_test.js
  --api-key <TOUCA_API_KEY>
  --api-url <TOUCA_API_URL>
  --revision v1.0
  --testcase 13 17 51 97 161 167
```

Where `TOUCA_API_KEY` and `TOUCA_API_URL` can be obtained from the
Touca server at [app.touca.io](https://app.touca.io).
This command produces the following output:

```text
Touca Test Framework
Suite: is_prime_test
Revision: v1.0

 (  1 of 6  ) 13                   (pass, 80 ms)
 (  2 of 6  ) 17                   (pass, 63 ms)
 (  3 of 6  ) 51                   (pass, 60 ms)
 (  4 of 6  ) 97                   (pass, 127 ms)
 (  5 of 6  ) 161                  (pass, 79 ms)
 (  6 of 6  ) 167                  (pass, 140 ms)

Processed 4 of 4 testcases
Test completed in 565 ms
```

## 📖 Documentation

*   If you are new to Touca, the best place to start is our
    [Quickstart Guide][docs-quickstart] on our documentation website.
*   For information on how to use our JavaScript SDK,
    see our [JavaScript SDK Documentation][docs-js].
*   If you cannot wait to start writing your first test with Touca,
    see our [JavaScript API Reference][docs-js-api].

## 🙋 Ask for Help

We want Touca to work well for you. If you need help, have any questions, or
like to provide feedback, send us a note through the Intercom at [touca.io]
or email us at <hello@touca.io>.

## 💸 What's Next?

Touca client libraries are free and open-source. Our cloud-hosted version of
Touca server at [touca.io] has a free forever plan. You can create an account
and explore Touca server capabilities on your own. But we want to help you
get on-boarded and answer any questions you may have in the process.
So we ask that you consider scheduling a [1:1 chat][calendly] with us.
We like to learn more about you, understand your software and its requirements,
and help you decide if Touca would be useful to you and your team.

## License

This repository is released under the Apache-2.0 License. See [`LICENSE`][license].

[touca.io]: https://touca.io

[calendly]: https://calendly.com/ghorbanzade/30min

[license]: https://github.com/trytouca/touca-js/blob/main/LICENSE

[docs-quickstart]: https://docs.touca.io/getting-started/quickstart

[docs-js]: https://docs.touca.io/api/js-sdk

[docs-js-api]: https://app.touca.io/docs/clients/js/api.html
