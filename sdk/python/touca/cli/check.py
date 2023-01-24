# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
import sys
from argparse import ArgumentParser
from pathlib import Path

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

    def _submit_file(self, file: Path):
        def _submit(_):
            touca.check("output", _get_file_content(file))

        testcase = self.options.get("testcase")
        self._run(
            callback=_submit,
            testcases=[testcase if testcase else _slugify(file.name)],
        )

    def _submit_directory(self, directory: Path):
        from os.path import commonpath

        files = [file.resolve() for file in directory.rglob("*") if file.is_file()]
        common = commonpath(files)
        slugs = {_slugify(str(f.relative_to(common))): f for f in files}

        def _submit(testcase: str):
            if self.options.get("testcase"):
                for slug, file in slugs.items():
                    touca.check(slug, _get_file_content(file))
            else:
                touca.check("output", _get_file_content(slugs.get(testcase)))

        testcase = self.options.get("testcase")
        self._run(
            callback=_submit,
            testcases=[testcase] if testcase else list(slugs.keys()),
        )

    def run(self):
        if not sys.stdin.isatty():
            return self._submit_stdin()
        src = Path(self.options.get("src"))
        if src.is_file():
            return self._submit_file(src)
        if src.is_dir():
            return self._submit_directory(src)
        logger.error("specified path is neither a directory nor a file")
