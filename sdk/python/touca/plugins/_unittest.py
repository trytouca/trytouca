# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

"""Utility classes derived from Python's built-in unit testing framework."""

from unittest import TestSuite, TestCase, TextTestRunner
import touca


class ToucaTestCase(TestCase):
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


class ToucaTestSuite(TestSuite):
    """Specialized ``TestSuite``` to be used by the Touca runner for Django."""

    pass


class ToucaTestRunner(TextTestRunner):
    """Specialized ``TextTestRunner`` to be used by the Touca runner for Django."""

    def run(self, test: TestSuite):
        """Run a given test suite."""
        test._tests = [ToucaTestCase(x) for x in test._tests]
        return super().run(test)
