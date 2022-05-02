# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import os
from argparse import ArgumentParser
from pathlib import Path
from sys import stderr
from touca._options import config_file_parse
from touca._runner import prepare_parser, run_workflows, Workflow
from touca.cli._common import Operation


def is_test_module(module: str):
    with open(module, "rt") as file:
        return "@touca.Workflow" in file.read()


def find_test_modules(testdir: str):
    return [
        os.path.join(root, file)
        for root, _, files in os.walk(testdir)
        for file in files
        if file.lower().endswith(".py") and is_test_module(os.path.join(root, file))
    ]


def extract_workflows(modules: list):
    import sys
    import importlib
    import inspect

    for module in modules:
        relpath = Path(module).relative_to(os.getcwd())
        syspath = os.path.join(Path(relpath.parent).absolute(), "")
        sys.path.append(syspath)
        basepath = os.path.splitext(os.path.basename(relpath))[0]
        mod = importlib.import_module(basepath)
        for (name, member) in inspect.getmembers(mod):
            if isinstance(member, Workflow):
                yield name, member
        sys.path.remove(syspath)


class Execute(Operation):
    name = "test"
    help = "Execute available regression tests"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument(
            "--testdir",
            default=[""],
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
        self.__options["testdir"] = Path(self.__options.get("testdir")[0]).resolve()
        args = self._find_arguments()
        modules = find_test_modules(self.__options.get("testdir"))
        workflows = list(extract_workflows(modules))
        try:
            run_workflows(args, workflows)
        except Exception as err:
            print(f"test failed: {err}", file=stderr)
            return False
        return True
