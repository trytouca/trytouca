# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser
from pathlib import Path
import sys
from touca._options import config_file_parse
from touca._runner import prepare_parser, run_workflows, Workflow
from touca.cli._common import Operation


def is_test_module(module: str):
    with open(module, "rt") as file:
        return "@touca.Workflow" in file.read()


def find_test_modules(testdir: str):
    return [p for p in Path(testdir).glob("**/*.py") if is_test_module(p)]


def extract_workflows(modules: list):
    import sys
    import importlib
    import inspect

    for module in modules:
        relpath = Path(module).relative_to(Path.cwd())
        syspath = Path(relpath.parent).absolute()
        sys.path.append(f"{syspath}/")
        mod = importlib.import_module(relpath.stem)
        for (name, member) in inspect.getmembers(mod):
            if isinstance(member, Workflow):
                yield name, member
        sys.path.remove(f"{syspath}/")


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
        dir_test = Path(self.__options.get("testdir")[0]).resolve()
        args = self._find_arguments()
        modules = find_test_modules(dir_test)
        workflows = list(extract_workflows(modules))
        try:
            run_workflows(args, workflows)
        except Exception as err:
            print(f"test failed: {err}", file=sys.stderr)
            return False
        return True
