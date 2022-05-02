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

import os
import shutil
import sys
import textwrap
from argparse import Action, ArgumentParser
from datetime import datetime, timedelta
from enum import IntEnum
from typing import Any, Dict, List
from touca._client import Client
from touca._printer import Printer


def prepare_parser(parser: ArgumentParser):
    class ExtendAction(Action):
        def __call__(self, parser, namespace, values, option_string=None):
            items = getattr(namespace, self.dest) or []
            items.extend(values)
            setattr(namespace, self.dest, items)

    parser.register("action", "extend", ExtendAction)
    parser.add_argument("--api-key", help="Touca API Key", dest="api-key")
    parser.add_argument(
        "--api-url",
        help="Touca API URL",
        dest="api-url",
        default="https://api.touca.io",
    )
    parser.add_argument(
        "--revision",
        help="Version of the code under test",
        dest="version",
    )
    parser.add_argument(
        "--suite",
        help="Slug of suite to which test results belong",
    )
    parser.add_argument(
        "--team",
        help="Slug of team to which test results belong",
    )
    parser.add_argument(
        "--workflow",
        help="Name of the workflow to run",
    )

    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--testcase",
        "--testcases",
        dest="testcases",
        action="extend",
        nargs="+",
        help="One or more testcases to feed to the workflow",
    )
    group.add_argument(
        "--testcase-file",
        dest="testcase-file",
        help="Single file listing testcases to feed to the workflows",
    )

    parser.add_argument(
        "--config-file",
        help="Path to a configuration file",
        dest="file",
    )
    parser.add_argument(
        "--output-directory",
        help="Path to a local directory to store result files",
        dest="output-directory",
    )

    parser.add_argument(
        "--log-level",
        dest="log-level",
        choices=["debug", "info", "warn"],
        default="info",
        help="Level of detail with which events are logged",
    )
    parser.add_argument(
        "--save-as-binary",
        dest="save-as-binary",
        const=True,
        default=False,
        nargs="?",
        help="Save a copy of test results on local filesystem in binary format",
    )
    parser.add_argument(
        "--save-as-json",
        dest="save-as-json",
        const=True,
        default=False,
        nargs="?",
        help="Save a copy of test results on local filesystem in JSON format",
    )
    parser.add_argument(
        "--offline",
        const=True,
        default=False,
        nargs="?",
        help="Disables all communications with the Touca server",
    )
    parser.add_argument(
        "--overwrite",
        const=True,
        default=False,
        nargs="?",
        help="Overwrite result directory for testcase if it already exists",
    )
    parser.add_argument(
        "--colored-output",
        dest="colored-output",
        const=True,
        default=True,
        nargs="?",
        help="Use color in standard output",
    )


def _parse_cli_options(args) -> Dict[str, Any]:
    parser = ArgumentParser(
        description="Touca Regression Test",
        epilog="Visit https://touca.io/docs for more information",
    )
    prepare_parser(parser)
    parsed = vars(parser.parse_known_args(args)[0]).items()
    parsed = dict(filter(lambda x: x[1] is not None, parsed))
    # fix options with boolean values
    for k in [
        "save-as-binary",
        "save-as-json",
        "offline",
        "overwrite",
        "colored-output",
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
        return
    if "testcase-file" in options:
        with open(options["testcase-file"], "rt") as file:
            keep = lambda x: x and not x.startswith("#")

            entries = list(filter(keep, file.read().splitlines()))
            options["testcases"] = entries
            return
    if options.get("offline"):
        elements = ["output-directory", "suite", "version"]
        version_dir = os.path.join(*map(options.get, elements))
        if not os.path.exists(version_dir):
            raise _ToucaError(_ToucaErrorCode.NoCaseMissingRemote)
        entries = os.listdir(version_dir)
        if not entries:
            raise _ToucaError(_ToucaErrorCode.NoCaseMissingRemote)
        options["testcases"] = entries
        return
    if any(k not in options for k in ["api-key", "api-url"]):
        raise _ToucaError(_ToucaErrorCode.NoCaseMissingRemote)
    options["testcases"] = Client.instance().get_testcases()
    if not options.get("testcases"):
        raise _ToucaError(_ToucaErrorCode.NoCaseEmptyRemote)


def _initialize(options: dict):
    from touca._options import find_home_path, update_options

    # Let the lower-level library consolidate the provided config options
    # including applying environment variables and processing long-format
    # api_url.
    update_options(options, options)

    # Check that team and suite are provided.
    missing = [k for k in ["team", "suite", "version"] if k not in options]
    if missing:
        raise _ToucaError(_ToucaErrorCode.MissingSlugs, ", ".join(missing))

    # Create directory to write logs and test results into
    options["output-directory"] = options.get(
        "output-directory", os.path.join(find_home_path(), "results")
    )
    os.makedirs(options.get("output-directory"), exist_ok=True)

    # Configure the lower-level Touca library
    if not Client.instance().configure(**options):
        raise RuntimeError(Client.instance().configuration_error())

    _update_testcase_list(options)


def _skip(options: dict, testcase: str):
    elements = ["output-directory", "suite", "version"]
    casedir = os.path.join(*map(options.get, elements), testcase)
    if options.get("save-as-binary"):
        return os.path.exists(os.path.join(casedir, "touca.bin"))
    if options.get("save-as-json"):
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
        Workflow._workflows.append((func.__name__, self))

    def __call__(self, testcase: str):
        return self.__func(testcase)


def _filter_selected_workflow(options, workflows):
    if "workflow" not in options:
        return workflows
    filtered = [(k, v) for k, v in workflows if options["workflow"] == k]
    if not filtered:
        raise Exception("workflow: " + options["workflow"] + " does not exist")
    return filtered


def _run_workflow(options, workflow):
    offline = options.get("offline") or any(
        k not in options for k in ["api-key", "api-url"]
    )
    timer = _Timer()
    stats = _Statistics()
    printer = Printer(options)
    printer.print_header()
    timer.tic("__workflow__")

    for idx, testcase in enumerate(options.get("testcases")):
        elements = ["output-directory", "suite", "version"]
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
            workflow.__call__(testcase)

        except BaseException as err:
            errors.append(": ".join([err.__class__.__name__, str(err)]))
        except:
            errors.append("Unknown Error")

        timer.toc(testcase)
        status = "pass" if not errors else "fail"
        stats.inc(status)

        if not errors and options.get("save-as-binary"):
            Client.instance().save_binary(
                os.path.join(casedir, "touca.bin"), [testcase]
            )

        if not errors and options.get("save-as-json"):
            Client.instance().save_json(os.path.join(casedir, "touca.json"), [testcase])

        if not errors and not offline:
            Client.instance().post()

        printer.print_progress(timer, testcase, idx, status, errors)

        Client.instance().forget_testcase(testcase)

    timer.toc("__workflow__")
    printer.print_footer(stats, timer)

    if not offline:
        Client.instance().seal()


def run_workflows(args, workflows):
    from copy import deepcopy

    workflows = _filter_selected_workflow(args, workflows)
    Printer.print_app_header()
    for name, workflow in workflows:
        options = deepcopy(args)
        options["suite"] = name
        try:
            _initialize(options)
            _run_workflow(options, workflow)
        except RuntimeError as error:
            Printer.print_warning("Error when running workflow {}: {}", name, error)
    Printer.print_app_footer()


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
    if not hasattr(Workflow, "_workflows") or not Workflow._workflows:
        raise _ToucaError(_ToucaErrorCode.MissingWorkflow)
    try:
        cli_options = _parse_cli_options(sys.argv[1:])
        run_workflows(cli_options, Workflow._workflows)
    except _ToucaError as err:
        sys.exit(err)
    except Exception as err:
        sys.exit(f"Test failed: {err}")
