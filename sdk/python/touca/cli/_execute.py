# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import os
from argparse import ArgumentParser
from pathlib import Path

from touca._options import find_config_dir
from touca._runner import run_workflows
from touca._runner import Workflow
from touca.cli._operation import Operation

# TODO: write comment block and explain why reading file content is bad
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
    def __init__(self, options: dict):
        self.__options = options
        pass

    def name(self) -> str:
        return "execute"

    def parser(self) -> ArgumentParser:
        parser = ArgumentParser()
        parser.add_argument(
            "--testdir",
            default=[""],
            nargs=1,
            help="path to directory with touca tests",
        )
        parser.add_argument(
            "--revision",
            metavar="",
            dest="version",
            help="Version of the code under test",
        )
        group = parser.add_mutually_exclusive_group()
        group.add_argument(
            "--testcase",
            "--testcases",
            metavar="",
            dest="testcases",
            action="append",
            nargs="+",
            help="One or more testcases to feed to the workflow",
        )
        group.add_argument(
            "--testcase-file",
            metavar="",
            help="Single file listing testcases to feed to the workflows",
        )
        return parser

    def parse(self, args):
        parsed, _ = self.parser().parse_known_args(args)
        parsed = vars(parsed)
        test_dir = parsed.get("testdir")[0]
        self.__options["testdir"] = (
            test_dir
            if Path.is_absolute(Path(test_dir))
            else os.path.join(os.getcwd(), test_dir)
        )
        self.__options["version"] = parsed.get("version")
        if parsed.get("testcases"):
            self.__options["testcases"] = [
                i for k in parsed.get("testcases") for i in k
            ]
        if parsed.get("testcase_file"):
            self.__options["testcase_file"] = parsed.get("testcase_file")

    def _find_arguments(self):
        from configparser import ConfigParser

        args = []
        config_file_path = os.path.join(find_config_dir(), "profiles", "default")
        if os.path.exists(config_file_path):
            with open(config_file_path, "rt") as config_file:
                file_content = config_file.read()
            config = ConfigParser()
            config.read_string(file_content)
            for k, v in config["default"].items():
                args.append(f"--{k}")
                args.append(v)

        if "testcases" in self.__options:
            args.append("--testcases")
            args.extend(self.__options.get("testcases"))
        if "testcase_file" in self.__options:
            args.append("--testcase-file")
            args.append(self.__options.get("testcase_file"))
        if "version" in self.__options:
            args.append("--revision")
            args.append(self.__options.get("version"))

        return args

    def run(self) -> bool:
        args = self._find_arguments()
        modules = find_test_modules(self.__options.get("testdir"))
        workflows = list(extract_workflows(modules))
        run_workflows(args, workflows)
        return True
