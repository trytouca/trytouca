# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

"""
Touca Test Runner for Python is designed to make writing regression test
workflows easy and straightforward. The test framework abstracts away many
of the common expected features such as logging, error handling and reporting
test progress.

The following example demonstrates how to use this framework::

    import touca
    from code_under_test import find_student, calculate_gpa

    @touca.workflow
    def test_students(testcase: str):
        student = find_student(testcase)
        touca.assume("username", student.username)
        touca.check("fullname", student.fullname)
        touca.check("birth_date", student.dob)
        touca.check("gpa", calculate_gpa(student.courses))

    if __name__ == "__main__":
        touca.run()

It is uncommon to run multiple regression test workflows as part of a single
suite. However, the pattern above allows introducing multiple workflows by
defining functions with ``@touca.workflow`` decorators.
"""

import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

from touca._client import Client
from touca._printer import Printer

_workflows: List[dict] = []


class _Statistics:
    def __init__(self):
        from collections import defaultdict

        self._v = defaultdict(int)

    def inc(self, name: str):
        self._v[name] += 1

    def count(self, name: str):
        return self._v.get(name, 0)


class _Timer:
    def __init__(self):
        self._tics = {}
        self._times: Dict[str, timedelta] = {}

    def tic(self, name: str):
        self._tics[name] = datetime.utcnow()

    def toc(self, name: str):
        self._times[name] = datetime.utcnow() - self._tics.get(name)

    def count(self, name: str):
        return int(self._times.get(name).microseconds / 1e3)


class Workflow:
    def __init__(self, func):
        from functools import update_wrapper

        update_wrapper(self, func)
        _workflows.append({"callback": func, "suite": func.__name__})


def workflow(method=None, testcases=None):
    """
    Registers the decorated function as a regression test workflow to be
    executed, once, for each test case.

    The following example demonstrates how to use this decorator::

        @touca.workflow
        def test_students(testcase: str):
            student = find_student(testcase)
            touca.assume("username", student.username)
            touca.check("fullname", student.fullname)
            touca.check("birth_date", student.dob)
            touca.check("gpa", calculate_gpa(student.courses))
    """
    from functools import wraps
    from inspect import isgenerator, isgeneratorfunction

    @wraps(method)
    def wrapper(wrapped_method):
        tcs = None
        if type(testcases) is list:
            tcs = testcases
        elif isgenerator(testcases):
            tcs = list(testcases)
        elif isgeneratorfunction(testcases):
            tcs = list(testcases())
        options = {"callback": wrapped_method, "suite": wrapped_method.__name__}
        if tcs is not None:
            options["testcases"] = tcs
        _workflows.append(options)

    return wrapper(method) if method else wrapper


def _warn_if_testcase_is_empty(printer: Printer):
    cases = list(Client.instance()._cases.values())
    if all(not case._results and not list(case._metrics()) for case in cases):
        printer.print_line("\n   Warnings:")
        for line in ["No test results were captured for this test case."]:
            printer.print_line(f"      - {line}\n")


def _run_workflow(options: dict):
    Client.instance().configure(**options)
    printer = Printer(
        colored_output=options.get("colored_output"),
        testcase_width=max(len(k) for k in options.get("testcases")),
        testcase_count=len(options.get("testcases")),
    )
    printer.print_header(options.get("suite"), options.get("version"))
    timer = _Timer()
    stats = _Statistics()
    timer.tic("__workflow__")

    for idx, testcase in enumerate(options.get("testcases")):
        case_dir = Path(
            *map(options.get, ["output_directory", "suite", "version"]),
            testcase,
        )
        skip = (
            case_dir.joinpath("touca.bin").exists()
            if options.get("save_binary")
            else case_dir.joinpath("touca.json").exists()
            if options.get("save_json")
            else False
        )
        if skip and not options.get("overwrite_results"):
            printer.print_progress(timer, testcase, idx, "skip")
            stats.inc("skip")
            continue
        if case_dir.exists():
            shutil.rmtree(case_dir)
            case_dir.mkdir()

        Client.instance().declare_testcase(testcase)
        timer.tic(testcase)

        errors: List[str] = []
        try:
            options.get("callback")(testcase)
        except BaseException as err:
            errors.append(": ".join([err.__class__.__name__, str(err)]))
        except:
            errors.append("Unknown Error")

        timer.toc(testcase)
        status = "pass" if not errors else "fail"
        stats.inc(status)

        if not errors and options.get("save_binary"):
            Client.instance().save_binary(case_dir.joinpath("touca.bin"), [testcase])
        if not errors and options.get("save_json"):
            Client.instance().save_json(case_dir.joinpath("touca.json"), [testcase])
        if not errors and not options.get("offline"):
            Client.instance().post()
        printer.print_progress(timer, testcase, idx, status, errors)
        _warn_if_testcase_is_empty(printer)
        Client.instance().forget_testcase(testcase)

    timer.toc("__workflow__")
    printer.print_footer(stats, timer, options)
    if not options.get("offline"):
        Client.instance().seal()


def run_workflows(opts):
    from copy import deepcopy

    from touca._options import update_runner_options

    options = deepcopy(opts)
    update_runner_options(options, Client.instance()._transport)
    if any(options.get(x) for x in ["save_binary", "save_json"]) and options.get(
        "output_directory"
    ):
        Path(options.get("output_directory")).mkdir(parents=True, exist_ok=True)
    Printer.print_app_header()
    for workflow_options in options.pop("workflows"):
        workflow_options.update(options)
        try:
            _run_workflow(workflow_options)
        except RuntimeError as error:
            Printer.print_warning(
                "Error when running suite {}: {}", workflow_options.get("suite"), error
            )
    Printer.print_app_footer()


def run(**options):
    """
    Runs registered workflows, one by one, for available test cases.

    This function is intended to be called once from the main module as
    shown in the example below::

        if __name__ == "__main__":
            touca.run()

    :raises SystemExit:
        When configuration options specified as command line arguments,
        environment variables, or in a configuration file, have unexpected
        values or are in conflict with each other. Capturing this exception
        is not required.
    """
    from sys import exit

    options.setdefault("workflows", [])
    options["workflows"].extend(_workflows)
    try:
        if not run_workflows(options):
            exit(1)
    except Exception as err:
        exit(f"\nTest failed:\n{err}\n")
