# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import importlib
import logging
import sys
from argparse import ArgumentParser
from pathlib import Path

from touca._options import prepare_parser
from touca._runner import _workflows, run_workflows
from touca.cli.common import CliCommand


def is_test_module(module: Path):
    return any(
        x in module.read_text("utf-8") for x in ["@touca.workflow", "@touca.Workflow"]
    )


def load_workflows(modules: list):
    for module in modules:
        relpath = Path(module).relative_to(Path.cwd())
        syspath = Path(relpath.parent).absolute()
        sys.path.append(f"{syspath}/")
        importlib.import_module(relpath.stem)
        sys.path.remove(f"{syspath}/")


class TestCommand(CliCommand):
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

    def run(self):
        self.options = {k: v for k, v in self.options.items() if v is not None}
        logging.disable(logging.CRITICAL)
        dir_test = Path(self.options.get("testdir", [Path.cwd()])[0]).resolve()
        modules = [m for m in Path(dir_test).rglob("*.py") if is_test_module(m)]
        load_workflows(modules)
        run_workflows({"workflows": _workflows})
