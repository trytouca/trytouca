# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

"""Touca plugin for Django test framework."""

from django.test.runner import DiscoverRunner
from unittest import TestSuite, TestCase, TextTestRunner
import touca


class _TestCase(TestCase):
    """Specialized TestCase to be handled by the Touca runner for Django."""

    def __init__(self, case: TestCase):
        """Clone a given ``TestCase`` instance for added functionality."""
        super().__init__()
        self.case = case

    def runTest(self):
        """
        Execute test case.

        Includes a simplified version of the default logic in the Touca test
        framework to be run for each test case.
        """
        touca.declare_testcase(self.case._testMethodName)
        self.case.run()
        instance = touca._client.Client.instance()
        active_case = instance._cases.get(instance._active_testcase_name())
        if instance._transport and (
            len(active_case._results) or len(active_case._tics)
        ):
            touca.post()
        if instance.is_configured():
            touca.forget_testcase(self.case._testMethodName)


class _TestRunner(TextTestRunner):
    """Specialized ``TextTestRunner`` to be used by the Touca runner for Django."""

    def run(self, test: TestSuite):
        """Run a given test suite."""
        test._tests = [_TestCase(x) for x in test._tests]
        return super().run(test)


class Runner(DiscoverRunner):
    """Custom test runner to use with Django test framework."""

    def __init__(
        self, api_key=None, api_url=None, revision=None, offline=None, **kwargs
    ):
        """
        Create a test runner instance derived from Django's ``DiscoverRunner``.

        To be passed to the Django test framework via the ``--testrunner``
        command line option.
        """
        from os import environ

        super().__init__(**kwargs)
        self.touca_options = {
            "api-key": environ.get("TOUCA_API_KEY", api_key),
            "api-url": environ.get("TOUCA_API_URL", api_url),
            "version": environ.get("TOUCA_TEST_VERSION", revision),
            "offline": True if offline in [True, "True", "true"] else False,
        }
        self.touca_options = {
            k: v for k, v in self.touca_options.items() if v is not None
        }

    def setup_test_environment(self, **kwargs):
        """Configure the Touca client after performing default setup."""
        super(Runner, self).setup_test_environment(**kwargs)
        touca.configure(**self.touca_options)

    def run_tests(self, test_labels, extra_tests=None, **kwargs):
        """Run Django test cases with extra Touca functionalities."""
        self.test_runner = _TestRunner
        super().run_tests(test_labels, extra_tests, **kwargs)

    @classmethod
    def add_arguments(cls, parser):
        """
        Add common Touca command-line options to Django test framework.

        Extends the set of command-line options supported by the Django test
        framework to allow for changing Touca behavior from the command-line.
        """
        DiscoverRunner.add_arguments(parser)
        parser.add_argument("--api-key", dest="api-key", help="Touca API Key")
        parser.add_argument("--api-url", dest="api-url", help="Touca API URL")
        parser.add_argument("--revision", dest="revision", help="Touca Test Version")
        parser.add_argument(
            "--offline",
            action="store",
            default=False,
            help="Disables all communications with the Touca server",
        )
