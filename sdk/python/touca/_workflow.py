#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import os
import sys
from typing import Any, Dict
from ._client import Client


def _parse_cli_options(options: Dict[str, Any]):
    from argparse import ArgumentParser
    from ._version import __version__

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
    parser.add_argument("--team", metavar='',
        help="Slug of team to which test results belong")

    group = parser.add_mutually_exclusive_group()
    group.add_argument("--testcase", metavar="",
        dest='testcases', action="append",
        help="Single testcase to feed to the workflow")
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
    parser.add_argument("--save-as-json", metavar="",
        action="store", default=False,
        help="Save a copy of test results on local filesystem in JSON format")
    parser.add_argument("--save-as-binary", metavar="",
        action="store", default=True,
        help="Save a copy of test results on local filesystem in binary format")
    parser.add_argument("--offline", metavar="",
        action="store", default=False,
        help="Disables all communications with the Touca server")
    parser.add_argument("--overwrite", metavar="",
        action="store", default=False,
        help="Overwrite result directory for testcase if it already exists")
    # fmt: on

    # remove entries with value None from the map
    parsed = dict(filter(lambda x: x[1], vars(parser.parse_args()).items()))
    options.update(parsed)


def _parse_options(options: dict):
    from ._options import update_options

    _parse_cli_options(options)
    if "testcase_file" in options:
        with open(options["testcase_file"], "rt") as file:
            keep = lambda x: x and not x.startswith("#")
            entries = list(filter(keep, file.read().splitlines()))
            options["testcases"] = entries
    update_options(options, options)


def _initialize(options: dict):
    keys = ["output_directory", "suite", "version"]
    os.makedirs(os.path.join(*map(options.get, keys)), exist_ok=True)

    if not Client.instance().configure(**options):
        raise RuntimeError(Client.instance().configuration_error())
    if not options.get("testcases"):
        if options.get("offline"):
            raise RuntimeError("cannot proceed without a testcase")
        options["testcases"] = Client.instance().get_testcases()


class Workflow:
    """ """

    def __init__(self, func):
        from functools import update_wrapper

        update_wrapper(self, func)
        self.func = func
        if not hasattr(Workflow, "_workflows"):
            Workflow._workflows = []
        Workflow._workflows.append(self)

    def __call__(self, testcase: str):
        return self.func(testcase)

    def _execute(self, options: dict):
        for testcase in options.get("testcases"):
            errors = []
            Client.instance().declare_testcase(testcase)

            try:
                self.__call__(testcase)
            except RuntimeError as err:
                errors.append(str(err))
            except:
                errors.append("unknown error")

            if not errors and options.get("save_as_binary"):
                Client.instance().save_binary("some.bin", [testcase])

            if not errors and options.get("save_as_json"):
                Client.instance().save_json("some.json", [testcase])

            if not options.get("offline"):
                Client.instance().post()

            Client.instance().forget_testcase(testcase)

        if not options.get("offline"):
            Client.instance().seal()

    @staticmethod
    def run():
        try:
            options = {}
            _parse_options(options)
            _initialize(options)
            print(
                "\nTouca Regression Test Framework\n"
                f"Suite: {options.get('suite')}\n"
                f"Revision: {options.get('version')}\n"
            )
            for workflow in Workflow._workflows:
                workflow._execute(options)

        except (RuntimeError, ValueError) as err:
            sys.exit(f"regression test failed: {err}")
        except:
            sys.exit("regression test failed due to unknown error")
