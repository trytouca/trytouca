# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path
from shutil import rmtree

from touca._options import find_home_path
from touca._printer import print_tree
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

        for pars in (parser_ls, parser_rm):
            src = pars.add_argument(
                "src",
                help=f"path to directory with results files. defaults to {results_dir}",
                nargs="?",
                default=results_dir,
            )

        suite = parser_rm.add_argument("suite", help="name of suite")
        version = parser_rm.add_argument("version", help="version of suite")

        filter = parser_ls.add_argument(
            "--filter", "-f", help="list filter by suite or/and version", default=None
        )

    def _command_ls(self):
        filter_arg = self.__options.get("filter")
        src = self.__options.get("src")
        tree_body = []
        if filter_arg is None:
            for suite in src.iterdir():
                suites = ResultsTree(suite).suites
                tree_body.append(suites)
                print_tree(label="Touca", body=tree_body)
            return True

        filter_path = src.joinpath(filter_arg)
        suite = ResultsTree(filter_path).suites
        print_tree(label=filter_arg, body=suite)
        return True

    def _command_rm(self):
        suite = self.__options.get("suite")
        version = self.__options.get("version")
        src = (
            Path(self.__options.get("src"))
            .joinpath(suite)
            .joinpath(version)
            .expanduser()
            .resolve()
        )

        try:
            rmtree(src.as_posix())
            logger.info(f"{suite}/{version} just removed.")
            return True
        except KeyError:
            logger.error(f'suite: "{suite}" or/and version: "{version}" are incorrect.')
            return False

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
