---
title: 'Our vision for the future of regression testing'
excerpt: 'Announcing the launch of Touca on Product Hunt'
publishDate: '2021-05-26T00:00:00.000Z'
readTime: 6
authorName: Pejman Ghorbanzade
authorPhoto: '/images/touca-author-pejman.jpg'
hidden: false
---

We are live on [Product Hunt](https://www.producthunt.com/posts/touca) today if
you like to support us.

---

We are excited to be sharing [Touca](https://touca.io/) with you today: a
continuous regression testing system that helps engineering teams compare
different versions of their software workflows and identify differences in
behavior and performance.

We want to reduce the risk of making code changes to mission-critical software
components. We think our product can greatly benefit businesses building
technologies like medical and financial software, machine learning algorithms,
robotics, and autonomous driving systems.

Touca started as a side project when I was working at a medical imaging software
company. We had to regularly test our software workflows with thousands of test
cases to ensure the safety and accuracy of our product. Our test process was so
long and labor-intensive that, sometimes, it took days to gain confidence that a
recent code change had no unintended side effects. This long feedback cycle made
the entire development process inefficient. Sometimes we decided against making
necessary changes to certain components just because it was too difficult to
retest them.

This problem is not specific to one company. Most software in industries like
finance, medical, AI, and robotics have similarly laborious testing processes
and are in the most need for continuous regression testing. But there appears to
be no clear solution that meets the requirements of these software. So I started
Touca, with a mission to make maintaining software 10x more efficient.

Touca helps you continuously test complex algorithms with any number of
real-world inputs. It offers client libraries that let you describe the behavior
and performance of your workflow, for each test case. The libraries submit this
information to a remote Touca Server that compares them with previously
submitted results and reports discovered differences in real-time so that you
can inspect them and take appropriate action.

Our approach solves common frustrations with using snapshot testing at scale.
Unlike snapshot testing frameworks that store the output of workflows for each
input into files and check those output files into version control systems,
Touca handles all test results remotely, preserves all data types for lossless
comparison, and gives full control over what variables you track, regardless of
whether they are exposed through the interface.

## Benefits

Touca enables you to do the following:

- Create easy-to-automate regression test tools in minutes
- Decouple your test cases from your test logic
- Inspect your test results as test cases are executed

You can do all the above (and much more) without the need to compare or manage
any test results. They are submitted to a self-hosted or cloud-hosted Touca
server, accessible to all members of your team.

> We use Touca to perform nightly regression tests of our critical workflows.
> When we make changes to complex software, we need to have confidence that
> there have been no unexpected consequences. Touca gives us that confidence by
> tracking millions of output values computed from thousands of input datasets
> and helping us understand exactly how those outputs have changed from one
> build to the next. That confidence gives us leverage to develop new features
> faster and with fewer problems.

\- Ben Jackson, Principal Software Engineer at
[Vital Images, Inc.](https://www.vitalimages.com/enterprise-imaging-solution/advanced-visualization)

### Current Limitations

We want to disclose one important limitation in the service that we are
launching today: While the Touca server is language agnostic, as of today, we
only provide one open-source
[SDK for C++](https://github.com/trytouca/touca-cpp). We wanted to start with a
language in which most existing mission-critical systems are written. Touca SDK
for Python is scheduled for release in June. We plan to release SDKs for Java
and JavaScript later this year.

## Our Vision

We want to significantly reduce the risk of making code changes to critical
software components. By automating the execution of component-level tests, and
the submission, processing, and management of their results, we want to reduce
the manual effort required to gain confidence in new code changes. We think a
shorter development feedback cycle makes maintaining software much more
efficient.

There are three fundamental ideas to our approach.

### Remote Hosting and Processing

_Leave only the decision-making to software engineers_. The distinctive feature
of our solution is provisioning a dedicated service for the storage and
processing of regression test results. This approach unlocks opportunities that
were not available in traditional regression testing methods that dealt with
test results as static files.

The remote server, deployed on cloud or on-premise, can process data once, and
make the results available to all members of the team. With access to the
submitted test results for different versions, it can provide insights into how
the software evolves. It can detect brittle tests and let engineers handle them
by defining custom comparison rules. By performing deep analysis of the
submitted data, the server can effectively work as an assistant to the members
of the engineering team, saving them time when interpreting the results.

Building software is teamwork. We think testing should be too. We notify
engineers of new differences and provide a platform for them to work together in
interpreting those differences and share comments and notes in the process. If
differences are approved, we notify the team to ensure they have an up-to-date
understanding of how their software is supposed to work.

Through integration with test execution servers, we can help teams trigger
one-time or recurring execution of their test cases through the server,
eliminating the manual efforts required to run them.

### Separation of test cases from the test logic

_Maintaining test code shouldn’t be a chore_. When writing unit tests, software
engineers are generally required to specify hard-coded expected values for each
test case. This common practice requires that a change in system behavior is
followed by adjustments of the expected values. This is because the input to
functions under test is closely coupled with the logic of the test: i.e. the
unit test code has hard-coded references to the input.

With Touca, the test cases are fully decoupled from the test logic. With no need
to set expected values, the test logic of a typical regression test can simply
invoke the code under test, one input at a time. Unlike unit tests, changes to
system requirements do not necessarily need changing the test logic.

We can go one step further and manage the test cases entirely through the remote
server. This way, team members can add notes to each test case and group them
through setting tags (e.g. “smoke test”) if they like to execute each group
separately.

### Real-time Feedback

_Show the true impact of any code change during the development process_: We
want to empower engineers to have full visibility on how their changes impact
the behavior and performance of their software. The faster we can provide this
insight, the more time and effort we can save from software engineers. Such
insight significantly reduces the likelihood of discovered defects in further
stages of the development cycle.

We think we can provide this insight in near real-time. We can leverage our
historical insight of previously submitted data to identify test cases with
higher chances of regression and prioritize their execution.

We can also go further in making this real-time feedback more valuable by adding
context to new differences such as including potentially relevant recent code
changes. We have many ideas for improving the overall developer experience and
will share them as we get closer to their implementation.

## Next Steps

We are just starting our journey towards making maintaining software 10x more
efficient. We acknowledge that this journey would be long and that we have so
much to learn in the process.

We don't think that any tool can independently solve software testing. As long
as software is developed by humans, they will be the first and last decision
makers on the quality of the product. But we believe that we have only scratched
the surface of how automation tools can help them make the right decisions,
faster and easier.

We look forward to solving interesting problems that can make life a little
easier for software engineers building and maintaining complex products.

---

_Thank you to Alex Plugaru, Beyang Liu, Daniel Feldman, Ivan Huerta, Nicolas
Carlo, Titus Winters, and many others for reading drafts of this post._
