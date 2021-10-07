#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from unittest import TestSuite, TestCase, TextTestRunner
import touca


class ToucaTestCase(TestCase):
    def __init__(self, case: TestCase):
        super().__init__()
        self.case = case

    def runTest(self):
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
    def run(self, result, debug=False):
        super().run(result, debug)


class ToucaTestRunner(TextTestRunner):
    def run(self, test: TestSuite):
        test._tests = [ToucaTestCase(x) for x in test._tests]
        return super().run(test)
