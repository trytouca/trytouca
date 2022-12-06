# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import sys
from argparse import ArgumentParser
from pathlib import Path

from touca._options import config_file_parse
from touca._runner import Workflow, prepare_parser, run_workflows
from touca.cli._common import Operation
import logging


def is_test_module(module: str):
    with open(module, "rt") as file:
        content = file.read()
        return any(x in content for x in ["@touca.workflow", "@touca.Workflow"])


def find_test_modules(testdir: str):
    return [p for p in Path(testdir).glob("**/*.py") if is_test_module(p)]


def load_workflows(modules: list):
    import importlib
    import sys

    for module in modules:
        relpath = Path(module).relative_to(Path.cwd())
        syspath = Path(relpath.parent).absolute()
        sys.path.append(f"{syspath}/")
        importlib.import_module(relpath.stem)
        sys.path.remove(f"{syspath}/")


class Execute(Operation):
    name = "test"
    help = "Run your Touca tests"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument(
            "--testdir",
            nargs=1,
            help="path to regression tests directory",
        )
        prepare_parser(parser)

    def __init__(self, options: dict):
        self.__options = {k: v for k, v in options.items() if v is not None}

    def _find_arguments(self):
        args = self.__options
        flags = [
            "save-as-binary",
            "save-as-json",
            "offline",
            "overwrite",
            "colored-output",
        ]
        config_content = config_file_parse()
        if config_content:
            for key in config_content.options("settings"):
                func = config_content.getboolean if key in flags else config_content.get
                args.update({key: func("settings", key)})
        return args

    def run(self):
        logging.disable(logging.CRITICAL)
        dir_test = Path(self.__options.get("testdir", [Path.cwd()])[0]).resolve()
        args = self._find_arguments()
        modules = find_test_modules(dir_test)
        load_workflows(modules)
        try:
            return run_workflows(args, Workflow._workflows)
        except Exception as err:
            print(f"test failed: {err}", file=sys.stderr)
            return False
