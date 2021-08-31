.. image:: https://touca.io/logo/touca-logo-w-text.svg
    :alt: Touca Logo
    :height: 40px
    :target: https://touca.io

Touca SDK For Python
####################

.. image:: https://img.shields.io/pypi/v/touca
    :alt: PyPI
    :target: https://pypi.org/project/touca/

.. image:: https://img.shields.io/pypi/pyversions/touca
    :alt: PyPI - Python Version
    :target: https://pypi.org/project/touca/

.. image:: https://readthedocs.org/projects/touca-python/badge/?version=latest
    :alt: Documentation Status
    :target: https://touca-python.readthedocs.io/en/latest/?badge=latest

.. image:: https://img.shields.io/github/workflow/status/trytouca/touca-python/touca-python-main
    :alt: GitHub Workflow Status
    :target: https://github.com/trytouca/touca-python/actions/workflows/main.yml?query=branch%3Amain+event%3Apush

.. image:: https://img.shields.io/codecov/c/github/trytouca/touca-python
    :alt: Codecov
    :target: https://app.codecov.io/gh/trytouca/touca-python

.. image:: https://img.shields.io/codacy/grade/4c28f395f89442ffadc7cbd38a4db02b
    :alt: Codacy grade
    :target: https://app.codacy.com/gh/trytouca/touca-python

.. image:: https://img.shields.io/pypi/l/touca
    :alt: PyPI - License
    :target: https://github.com/trytouca/touca-python/blob/main/LICENSE

Touca helps you understand the true impact of your day to day code changes
on the behavior and performance of your overall software, as you write code.

.. image:: https://touca-public-assets.s3.us-east-2.amazonaws.com/touca-screenshot-suite-page.png
    :alt: Touca Server
    :target: https://touca-public-assets.s3.us-east-2.amazonaws.com/touca-screenshot-suite-page.png

Touca SDKs let you describe the behavior and performance of your code by
capturing values of interesting variables and runtime of important functions.
We remotely compare your description against a trusted version of your
software, visualize all differences, and report them in near real-time.

🧑‍🔧 Install
=============

You can install Touca with `pip <https://pypi.org/project/touca>`__:

.. code:: bash

    pip install touca

We formally support Python v3.6 and newer on Linux, macOS, and Windows platforms.

👀 Sneak Peak
=============

    For a more thorough guide of how to use Touca SDK for Python, check
    out the ``examples`` directory or visit our documentation website at
    `docs.touca.io <https://docs.touca.io>`__.

Let us imagine that we want to test a software workflow that reports
whether a given number is prime.

.. code:: python

    def is_prime(number: int):

We can use unit testing in which we hard-code a set of input numbers
and list our expected return value for each input. In this example,
the input and output of our code under test are a number and a boolean.
If we were testing a video compression algorithm, they may have been
video files. In that case:

-  Describing the expected output for a given video file would be difficult.
-  When we make changes to our compression algorithm, accurately reflecting those changes in our expected values would be time-consuming.
-  We would need a large number of input video files to gain confidence that our algorithm works correctly.

Touca makes it easier to continuously test workflows of any complexity
and with any number of test cases.

.. code:: python

    import touca
    from code_under_test import is_prime

    @touca.Workflow
    def test_is_prime(testcase: str):
        touca.add_result("is_prime", is_prime(int(testcase)))

    if __name__ == "__main__":
        touca.run()

Touca tests have two main differences compared to typical unit tests:

- We have fully decoupled our test inputs from our test logic. We refer to these inputs as "test cases". The SDK retrieves the test cases from the command line, or a file, or a remote Touca server and feeds them one by one to our code under test.
- We have removed the concept of *expected values*. With Touca, we only describe the *actual* behavior and performance of our code under test by capturing values of interesting variables and runtime of important functions, anywhere within our code. For each test case, the SDK submits this description to a remote server which compares it against the description for a trusted version of our code. The server visualizes any differences and reports them in near real-time.

We can run Touca tests with any number of inputs from the command line:

.. code:: bash

    python3 test_prime_app.py
      --api-key <TOUCA_API_KEY>
      --api-url <TOUCA_API_URL>
      --revision v1.0
      --testcase 13 17 51

Where ``TOUCA_API_KEY`` and ``TOUCA_API_URL`` can be obtained from the
Touca server at `app.touca.io <https://app.touca.io>`__.
This command produces the following output:

.. code::

    Touca Test Framework
    Suite: is_prime_test
    Revision: v1.0

    (  1 of 3  ) 13                   (pass, 127 ms)
    (  2 of 3  ) 17                   (pass, 123 ms)
    (  3 of 3  ) 51                   (pass, 159 ms)

    Processed 3 of 3 testcases
    Test completed in 565 ms

✨ Features
===========

Touca is very effective in addressing common problems in the following
situations:

-  When we need to test our workflow with a large number of inputs.
-  When the output of our workflow is too complex, or too difficult to describe in our unit tests.
-  When interesting information to check for regression is not exposed through the interface of our workflow.

The fundamental design features of Touca that we highlighted earlier
can help us test these workflows at any scale.

-  Decoupling our test input from our test logic, can help us manage our long list of inputs without modifying the test logic. Managing that list on a remote server accessible to all members of our team, can help us add notes to each test case, explain why they are needed and track how their performance changes over time.
-  Submitting our test results to a remote server, instead of storing them in files, can help us avoid the mundane tasks of managing and processing of those results. The Touca server retains test results and makes them accessible to all members of the team. It compares test results using their original data types and reports discovered differences in real-time to all interested members of our team. It allows us to audit how our software evolves over time and provides high-level information about our tests.

📖 Documentation
================

-  If you are new to Touca, the best place to start is our `Quickstart Guide <https://docs.touca.io/basics/quickstart>`__ on our documentation website.
-  For information on how to use our Python SDK, see our `Python SDK Documentation <https://docs.touca.io/sdk/python>`__.
-  If you cannot wait to start writing your first test with Touca, see our `Python API Reference <https://app.touca.io/docs/clients/python/api.html>`__.

🙋 Ask for Help
===============

We want Touca to work well for you. If you need help, have any
questions, or like to provide feedback, send us a note through
the Intercom at `touca.io <https://touca.io>`__ or email us at
`hello@touca.io <mailto:hello@touca.io>`__.

🚀 Next Steps
=============

Touca client libraries are free and open-source. Our cloud-hosted
Touca server at `touca.io <https://touca.io>`__ has a free forever plan.
You can create an account and explore Touca on your own. We are also happy
to `chat 1:1 <https://calendly.com/ghorbanzade/30min>`__ to help
you get on-boarded and answer any questions you may have in the process.
We'd love to learn more about you, understand your software and its requirements,
and help you decide if Touca would be useful to you and your team.

License
=======

This repository is released under the Apache-2.0 License. See
`LICENSE <https://github.com/trytouca/touca-python/blob/main/LICENSE>`__.
