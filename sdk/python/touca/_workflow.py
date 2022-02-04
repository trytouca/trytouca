# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

"""
Touca Test Framework for Python is designed to make writing regression test
workflows easy and straightforward. The test framework abstracts away many
of the common expected features such as logging, error handling and reporting
test progress.

The following example demonstrates how to use this framework::

    import touca
    from code_under_test import find_student, calculate_gpa

    @touca.Workflow
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
defining functions with ``@touca.Workflow`` decorators.
"""

import math
import os
import shutil
import sys
import textwrap
from colorama import Style, Fore, Back, init
from datetime import datetime, timedelta
from enum import IntEnum
from typing import Any, Dict, List
from ._client import Client

init()


def _parse_cli_options(args) -> Dict[str, Any]:
    from argparse import ArgumentParser

    # fmt: off
    parser = ArgumentParser(
        description="Touca Regression Test",
        epilog="Visit https://docs.touca.io for more information")
    parser.add_argument("--api-key", metavar='',
        help="API Key issued by the Touca Server")
    parser.add_argument("--api-url", metavar='',
        help="API URL issued by the Touca Server")

    parser.add_argument("--revision", metavar='',
        dest='version',
        help="Version of the code under test")
    parser.add_argument("--suite", metavar='',
        help="Slug of suite to which test results belong")
    parser.add_argument("--workflow", metavar='',
        help="Name of the workflow to run"
    )

    parser.add_argument("--team", metavar='',
        help="Slug of team to which test results belong")

    group = parser.add_mutually_exclusive_group()
    group.add_argument("--testcase", "--testcases", metavar="",
        dest='testcases', action="append", nargs="+",
        help="One or more testcases to feed to the workflow")
    group.add_argument("--testcase-file", metavar="",
        help="Single file listing testcases to feed to the workflows")

    parser.add_argument("--config-file", metavar='',
        dest='file',
        help="Path to a configuration file")
    parser.add_argument("--output-directory", metavar='',
        default=os.path.abspath("./results"),
        help="Path to a local directory to store result files")

    parser.add_argument("--log-level",
        choices=["debug", "info", "warn"], default="info",
        help="Level of detail with which events are logged")
    parser.add_argument("--save-as-binary", const=True, default=False, nargs="?",
        help="Save a copy of test results on local filesystem in binary format")
    parser.add_argument("--save-as-json", const=True, default=False, nargs="?",
        help="Save a copy of test results on local filesystem in JSON format")
    parser.add_argument("--offline", const=True, default=False, nargs="?",
        help="Disables all communications with the Touca server")
    parser.add_argument("--overwrite", const=True, default=False, nargs="?",
        help="Overwrite result directory for testcase if it already exists")
    parser.add_argument("--colored-output", const=True, default=True, nargs="?",
        help="Use color in standard output")

    # fmt: on

    parsed = vars(parser.parse_known_args(args)[0]).items()

    # remove entries with value None from the map
    parsed = dict(filter(lambda x: x[1] is not None, parsed))
    # fix options with boolean values
    for k in [
        "save_as_binary",
        "save_as_json",
        "offline",
        "overwrite",
        "colored_output",
    ]:
        parsed[k] = True if parsed.get(k) in [True, "True", "true"] else False

    return parsed


class _ToucaErrorCode(IntEnum):
    MissingWorkflow = 1
    MissingSlugs = 2
    NoCaseMissingRemote = 3
    NoCaseEmptyRemote = 4


class _ToucaError(Exception):

    _errors: Dict[int, str] = {
        _ToucaErrorCode.MissingWorkflow: """\
            No workflow is registered.
            """,
        _ToucaErrorCode.MissingSlugs: """\
            Options {} are required when using this test framework.
            """,
        _ToucaErrorCode.NoCaseMissingRemote: """\
            Cannot proceed without a test case.
            Either use '--testcase' or '--testcase-file' to pass test cases
            or use '--api-key' and '--api-url' to let the library query
            the Touca Server to obtain and reuse the list of test cases
            submitted to the baseline version of this suite.
            """,
        _ToucaErrorCode.NoCaseEmptyRemote: """\
            Cannot proceed without a test case.
            Neither '--testcase' nor '--testcase-file' were provided.
            Attempted to query the Touca Server to obtain and reuse the
            list of test cases submitted to the baseline version of this
            suite but this suite has no previous version.
            """,
    }
    _wrapper = textwrap.TextWrapper(break_on_hyphens=False, width=80)

    def __init__(self, code: _ToucaErrorCode, *fmt_args: List[Any]):
        self._code = code
        if code in _ToucaError._errors:
            text = _ToucaError._errors.get(code).format(*fmt_args)
            wrapped = _ToucaError._wrapper.fill(textwrap.dedent(text))
            self._message = wrapped
        else:
            self._message = "Unknown Error"
        super().__init__(self._message)

    def __str__(self):
        return self._message


def _update_testcase_list(options: dict):
    """
    Use provided config options to find the final list of test cases to use
    for running the workflows. The following implementation assumes options
    `--testcases` and `--testcase-file` are mutually exclusive.
    """
    if options.get("testcases"):
        options["testcases"] = [i for k in options.get("testcases") for i in k]
        return
    if "testcase_file" in options:
        with open(options["testcase_file"], "rt") as file:
            keep = lambda x: x and not x.startswith("#")

            entries = list(filter(keep, file.read().splitlines()))
            options["testcases"] = entries
            return
    if options.get("offline") or any(k not in options for k in ["api_key", "api_url"]):
        raise _ToucaError(_ToucaErrorCode.NoCaseMissingRemote)
    options["testcases"] = Client.instance().get_testcases()
    if not options.get("testcases"):
        raise _ToucaError(_ToucaErrorCode.NoCaseEmptyRemote)


def _initialize(options: dict):
    from ._options import update_options

    # Let the lower-level library consolidate the provided config options
    # including applying environment variables and processing long-format
    # api_url.
    update_options(options, options)

    # Check that team, suite and version are provided.
    missing = [k for k in ["team", "suite", "version"] if k not in options]
    if missing:
        raise _ToucaError(_ToucaErrorCode.MissingSlugs, ", ".join(missing))

    # Create directory to write logs and test results into
    keys = ["output_directory", "suite", "version"]
    os.makedirs(os.path.join(*map(options.get, keys)), exist_ok=True)

    # Configure the lower-level Touca library
    if not Client.instance().configure(**options):
        raise RuntimeError(Client.instance().configuration_error())

    # Update list of test cases
    _update_testcase_list(options)


def _skip(options: dict, testcase: str):
    elements = ["output_directory", "suite", "version"]
    casedir = os.path.join(*map(options.get, elements), testcase)
    if options.get("save_as_binary"):
        return os.path.exists(os.path.join(casedir, "touca.bin"))
    if options.get("save_as_json"):
        return os.path.exists(os.path.join(casedir, "touca.json"))
    return False


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
    """
    Base class meant to be used as a decorator.

    Registers the decorated function as a regression test workflow to be
    executed, once, for each test case.

    The following example demonstrates how this class should be used::

        @touca.Workflow
        def test_students(testcase: str):
            student = find_student(testcase)
            touca.assume("username", student.username)
            touca.check("fullname", student.fullname)
            touca.check("birth_date", student.dob)
            touca.check("gpa", calculate_gpa(student.courses))
    """

    def __init__(self, func):
        from functools import update_wrapper

        update_wrapper(self, func)
        self.__func = func
        if not hasattr(Workflow, "_workflows"):
            Workflow._workflows = []
        Workflow._workflows.append(self)

    def __call__(self, testcase: str):
        return self.__func(testcase)


class _Printer:
    def __init__(self, options):
        self.options = options
        self.testcase_width = max(len(k) for k in options.get("testcases"))
        self.testcase_count = len(options.get("testcases"))

    def print_line(self, fmt: str, *args, **kwargs):
        msg = fmt.format(*args, **kwargs) if args or kwargs else fmt
        if self.options.get("colored_output"):
            print(msg)
            return

        import re

        line = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])").sub("", msg)
        print(line)

    def print_header(self):
        revision = "/".join([self.options.get(k) for k in ["suite", "version"]])
        self.print_line("\nTouca Test Framework\nSuite: {:s}\n", revision)

    def print_progress(self, timer: _Timer, testcase, idx, status, errors=[]):
        states = {
            "pass": ("PASS", Back.GREEN),
            "skip": ("SKIP", Back.YELLOW),
            "fail": ("FAIL", Back.RED),
        }
        performance = (
            ""
            if status == "skip"
            else " {dim}({timer:d} ms){reset}".format(
                dim=Style.DIM,
                reset=Style.NORMAL,
                timer=timer.count(testcase),
            )
        )
        progress = " {number:>{width}d}{dim}.{reset}".format(
            dim=Style.DIM,
            reset=Style.NORMAL,
            number=idx + 1,
            count=self.testcase_count,
            width=int(math.log10(self.testcase_count)) + 1,
        )
        badge = "{bg_color} {text} {bg_reset}".format(
            bg_color=states.get(status)[1],
            bg_reset=Back.RESET,
            text=states.get(status)[0],
        )
        self.print_line(
            "{progress} {badge}  {testcase:<{testcase_width}s}{performance}",
            badge=badge,
            progress=progress,
            testcase=testcase,
            testcase_width=self.testcase_width + 3,
            performance=performance,
        )
        if errors:
            self.print_line("\n   {}Exception Raised:{}", Style.DIM, Style.NORMAL)
            self.print_line("\n".join(f"      - {error}\n" for error in errors))

    def print_footer(self, stats, timer):
        states = [
            ("pass", "passed", Fore.GREEN),
            ("skip", "skipped", Fore.YELLOW),
            ("fail", "failed", Fore.RED),
        ]
        messages = []
        for state in states:
            if not stats.count(state[0]):
                continue
            messages.append(f"{state[2]}{stats.count(state[0])} {state[1]}{Fore.RESET}")
        messages.append(f"{self.testcase_count} total")
        self.print_line(
            "\n{:s} {:s}",
            "Tests:".ljust(int(math.log10(self.testcase_count)) + 11),
            ", ".join(messages),
        )
        self.print_line(
            "{:s} {:.2f} s",
            "Time:".ljust(int(math.log10(self.testcase_count)) + 11),
            timer.count("__workflow__") / 1000,
        )
        self.print_line("\n✨   Ran all test suites.\n")


def _run(args):
    if not hasattr(Workflow, "_workflows") or not Workflow._workflows:
        raise _ToucaError(_ToucaErrorCode.MissingWorkflow)
    options = _parse_cli_options(args)
    _initialize(options)

    offline = options.get("offline") or any(
        k not in options for k in ["api_key", "api_url"]
    )
    timer = _Timer()
    stats = _Statistics()
    printer = _Printer(options)
    printer.print_header()
    timer.tic("__workflow__")

    filtered_workflows = Workflow._workflows
    if options.get("workflow"):
        filtered_workflows = [
            x for x in Workflow._workflows if options["workflow"] == x
        ]
    if len(filtered_workflows) == 0:
        raise Exception("workflow: " + options["workflow"] + " does not exist")

    for idx, testcase in enumerate(options.get("testcases")):
        elements = ["output_directory", "suite", "version"]
        casedir = os.path.join(*map(options.get, elements), testcase)

        if not options.get("overwrite") and _skip(options, testcase):
            printer.print_progress(timer, testcase, idx, "skip")
            stats.inc("skip")
            continue

        if os.path.exists(casedir):
            shutil.rmtree(casedir)
            os.makedirs(casedir)

        Client.instance().declare_testcase(testcase)
        timer.tic(testcase)

        errors = []
        try:
            for workflow in filtered_workflows:
                workflow.__call__(testcase)

        except BaseException as err:
            errors.append(": ".join([err.__class__.__name__, str(err)]))
        except:
            errors.append("Unknown Error")

        timer.toc(testcase)
        status = "pass" if not errors else "fail"
        stats.inc(status)

        if not errors and options.get("save_as_binary"):
            Client.instance().save_binary(
                os.path.join(casedir, "touca.bin"), [testcase]
            )

        if not errors and options.get("save_as_json"):
            Client.instance().save_json(os.path.join(casedir, "touca.json"), [testcase])

        if not errors and not offline:
            Client.instance().post()

        printer.print_progress(timer, testcase, idx, status, errors)

        Client.instance().forget_testcase(testcase)

    timer.toc("__workflow__")
    printer.print_footer(stats, timer)

    if not offline:
        Client.instance().seal()


def run():
    """
    Runs registered workflows, one by one, for available the test cases.

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
    try:
        _run(sys.argv[1:])
    except _ToucaError as err:
        sys.exit(err)
    except Exception as err:
        sys.exit(f"Test failed: {err}")
