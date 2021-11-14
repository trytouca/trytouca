---
title: 'Announcing the Release of Touca SDK for Node.js'
excerpt:
  'We are excited to announce the open-source release of our Touca SDK for
  Node.js today, under the permissive Apache-2.0 license.'
publishDate: '2021-08-13T00:00:00.000Z'
readTime: 3
authorName: Pejman Ghorbanzade
authorPhoto: '/images/touca-author-pejman.jpg'
hidden: false
---

We are excited to announce the release of our Touca SDK for Node.js today. This
library is distributed as open-source under the permissive Apache-2.0 license.

---

Touca is a developer tools startup helping engineering teams see the true impact
of their code changes on the behavior and performance of their software, as they
write code.

On average, it takes 23 days for software engineers to gain confidence that
their code change works the way they intended. This long feedback cycle
significantly hinders developer productivity and makes the overall software
development process expensive and inefficient.

> Touca provides real-time feedback to software engineers about the side effects
> of their code changes as they are writing them.

The release of our JavaScript SDK is a step towards our goal, making our
technology accessible to more teams. We'd like to take a moment to explain how
Touca works and how you can use our new SDK today to continuously test your most
complex software workflows.

---

In unit testing, we run our unit of code with a list of inputs. For each input,
we specify the expected output as part of our test logic. We may need to revise
our test logic when our software requirements evolve or when we find other
interesting inputs that we should handle.

```ts
import { is_prime } from 'code_under_test';

test('test is_prime', () => {
  expect(is_prime(13)).toEqual(true);
  expect(is_prime(17)).toEqual(true);
  expect(is_prime(51)).toEqual(false);
  expect(is_prime(97)).toEqual(true);
  expect(is_prime(161)).toEqual(false);
});
```

Unit testing is very effective. But writing and maintaining unit tests for some
real-world software workflows can be difficult. Consider a video compression
algorithm:

1. Describing the expected output for a given video file would be difficult.
2. Accurately reflecting changes to our algorithm in our expected values would
   be time-consuming.
3. We would need a large number of input video files to gain confidence that our
   algorithm works correctly. Maintaining unit tests for each case would be
   expensive.

Touca is a developer-focused testing solution that help you see the true impact
of any code change on the overall behavior and performance of your software, as
you write code.

```ts
import { touca } from '@touca/node';
import { is_prime } from 'code_under_test';

touca.workflow('test is_prime', (testcase: string) => {
  const number = Number.parseInt(testcase);
  touca.check('is_prime_output', is_prime(number));
});

touca.run();
```

Unlike unit testing, a typical Touca test doesn't list the inputs to our code
under test. And it doesn't require specifying the expected values for each test
case.

Touca SDKs allow you to capture values of interesting variables and runtime of
important functions. The SDKs submit this data to a remote Touca server where
they are stored and automatically compared against the previously submitted
results for a trusted version of your code.

```ts
touca.start_timer();
const student = parse_profile(username);
touca.stop_timer();

touca.check('fullname', student.fullname);
touca.check('birth_date', student.dob);
touca.check('courses', student.courses);
```

Touca server, self-hosted or cloud-hosted, visualizes differences in behavior
and performance and reports them to you and your team so you can decide if those
differences are acceptable or symptoms of an unintended side-effect.

Since the Touca server stores your data, it knows the list of your test cases
and can provide insights about each. Touca tests can query this list during
initialization and run your test workflow once for each test case. This means:

- No more wasting time managing snapshot files
- No more building one-off tools for comparing them
- No more checking of snapshot files in version control
- No more relying on the output of your code So you can focus more on thinking
  and decision making.

---

We want to seamless integrate our technology with developer workflows to
significantly boost confidence of developers in the code they write, increase
their productivity, and help their teams ship better software, faster. You can
help us reach these goals. Here are a few ways:

- **Speak with us**: Share your ideas and daily workflows. See early prototypes
  of our future technology. Tell us what you think.
- **Spread the word**: Share Touca with your network or show it to one of your
  colleagues.
- **Help us grow**: Become an early user and try Touca for free. On average, we
  have shipped more than 20 fixes and improvements every month thanks to the
  valuable feedback from our early users.
- **Give us a star**: Consider giving our repositories a star on GitHub to help
  us introduce our technology to more software engineers.

---

_Thank you to our early adopters and all software engineers who took the time to
speak with us, and share about their development workflows. This SDK is a direct
result of their valuable feedback._
