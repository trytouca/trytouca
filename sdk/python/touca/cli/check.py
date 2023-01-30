# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import logging
import sys
from argparse import ArgumentParser
from pathlib import Path
from typing import Dict, List, Union

import touca
from touca._runner import run_workflows
from touca.cli.common import CliCommand

logger = logging.getLogger("touca.cli.check")


def _get_file_content(file: Path):
    try:
        return file.read_text()
    except ValueError:
        return file.read_bytes()


def _slugify(name: str):
    return name.replace(".", "_").replace("/", "_").replace("-", "_")


def _parse(files: List[Path], testcase: Union[str, None]):
    from os.path import commonpath
    from collections import defaultdict

    output: Dict[str, Dict[str, Path]] = {}
    excluded = [".DS_Store"]
    files = [
        file.resolve() for file in files if file.is_file() and file.name not in excluded
    ]
    common = commonpath(files)
    tree = defaultdict(list)
    for file in files:
        item = (
            testcase
            if testcase
            else file.name
            if len(files) == 1 or file.parent == Path(common)
            else str(file.parent.relative_to(common))
        )
        tree[_slugify(item)].append(file)
    for k, v in tree.items():
        common = commonpath(v)
        output[k] = {
            _slugify("output" if len(v) == 1 else str(f.relative_to(common))): f
            for f in v
        }
    return output


class CheckCommand(CliCommand):
    name = "check"
    help = "Submit external test output to Touca server"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument(
            "--suite",
            help="name of the suite to associate with this output",
            required=True,
        )
        parser.add_argument(
            "--testcase",
            help="name of the testcase to associate with this output",
            required=False,
        )
        if sys.stdin.isatty():
            parser.add_argument(
                "src",
                help="path to file or directory to submit",
            )

    def _run(self, *, callback, testcases):
        workflow = {
            "callback": callback,
            "suite": self.options.get("suite"),
            "testcases": testcases,
        }
        run_workflows({"workflows": [workflow], "arguments": []})

    def _submit_stdin(self):
        def _submit(_):
            touca.check("output", sys.stdin.read())

        testcase = self.options.get("testcase")
        self._run(
            callback=_submit,
            testcases=[testcase if testcase else "stdout"],
        )

    def _submit_testcases_map(self, files):
        testcases = _parse(files, self.options.get("testcase"))

        def _submit(testcase: str):
            for key, file in testcases[testcase].items():
                touca.check(key, _get_file_content(file))

        self._run(callback=_submit, testcases=list(testcases.keys()))

    def run(self):
        if not sys.stdin.isatty():
            return self._submit_stdin()
        src = Path(self.options.get("src"))
        if src.is_file():
            return self._submit_testcases_map([src])
        if src.is_dir():
            return self._submit_testcases_map(sorted(src.rglob("*")))
        logger.error("specified path is neither a directory nor a file")
