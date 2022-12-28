# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path

from touca._options import find_home_path
from touca._printer import print_results_tree
from touca.cli._common import Operation, ResultsTree, invalid_subcommand

logger = logging.Logger("touca.cli.results")


class Results(Operation):
    name = "results"
    help = "Show suite results"

    def __init__(self, options: dict):
        self.__options = options

    @classmethod
    def parser(self, parser: ArgumentParser):
        parsers = parser.add_subparsers(dest="subcommand")
        parser_ls = parsers.add_parser("ls", help="list local touca archive files")
        parser_rm = parsers.add_parser("rm", help="remove local touca archive files")
        results_dir = find_home_path().joinpath("results")
        for parser in (parser_ls, parser_rm):
            parser.add_argument(
                "--src",
                dest="src_dir",
                help=f"path to test results directory. defaults to {results_dir}.",
                default=results_dir,
            )
            parser.add_argument(
                "--filter",
                help="limit results to a given suite or version. value should be in form of suite[/version].",
                default=None,
            )
        parser_rm.add_argument(
            "--dry-run",
            action="store_true",
            dest="dry_run",
            help="Check what your command would do when run without this option",
        )

    def _command_ls(self):
        filter = self.__options.get("filter", None)
        src_dir = self.__options.get("src_dir")
        results_tree = ResultsTree(src_dir, filter)
        print_results_tree(results_tree.suites)
        return True

    def _command_rm(self):
        from shutil import rmtree

        from rich.progress import Progress

        filter = self.__options.get("filter", None)
        src_dir: Path = self.__options.get("src_dir")
        dry_run = self.__options.get("dry_run", False)
        results_tree = ResultsTree(src_dir, filter)

        if dry_run:
            for versions in results_tree.suites.values():
                for binary_files in versions.values():
                    for binary_file in binary_files:
                        logger.info(f"will remove {binary_file}")
            return True

        with Progress() as progress:
            for suite, versions in results_tree.suites.items():
                for version, binary_files in versions.items():
                    task_name = f"[magenta]{suite}/{version}[/magenta]"
                    task_batch = progress.add_task(task_name, total=len(binary_files))
                    for binary_file in binary_files:
                        logger.debug(f"removing {binary_file}")
                        binary_file.unlink()
                        progress.update(task_batch, advance=1)
                    rmtree(src_dir.joinpath(suite, version))
                rmtree(src_dir.joinpath(suite))
        return True

    def run(self):
        commands = {
            "ls": self._command_ls,
            "rm": self._command_rm,
        }
        command = self.__options.get("subcommand")
        if not command:
            return invalid_subcommand(Results)
        if command in commands:
            return commands.get(command)()
        return False
