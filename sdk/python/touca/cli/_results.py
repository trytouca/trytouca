import logging
from argparse import ArgumentParser
from pathlib import Path
from shutil import rmtree

from touca._options import find_home_path
from touca._printer import print_table
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
        results_dir = find_home_path().joinpath("results")

        parsers_list = parsers.add_parser(
            "list", help="show a summary of test results"
        )  # noqa: E501
        parsers_remove = parsers.add_parser(
            "remove", help="remove test results"
        )  # noqa: E501

        for pars in (parsers_list, parsers_remove):
            src = pars.add_argument(
                "src",
                help=f"path to directory with results files. defaults to {results_dir}",
                nargs="?",
                default=results_dir,
            )
            suite = pars.add_argument("suite", help="name of suite")
            version = pars.add_argument("version", help="version of suite")

    def _command_list(self):
        suite = self.__options.get("suite")
        version = self.__options.get("version")
        src = (
            Path(self.__options.get("src"))
            .joinpath(suite)
            .joinpath(version)
            .expanduser()
            .resolve()
        )
        if not src.exists():
            logger.error(f"{src} is not exists.")
            return False

        suites = ResultsTree(src).suites
        test_cases = suites[suite][version]

        table_header = ["#", "Test Case", "Path"]
        table_body = []
        for num, (test_case, path) in enumerate(test_cases.items()):
            table_body.append([str(num), test_case, path[0].as_posix()])

        print_table(table_header, table_body)
        return True

    def _command_remove(self):
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
        src = Path(self.__options.get("src")).expanduser().resolve()
        results_tree = ResultsTree(src)

        if results_tree.is_empty:
            logger.error(f"{src} is not exists.")
            return False

        commands = {"list": self._command_list, "remove": self._command_remove}
        command = self.__options.get("subcommand")

        if not command:
            return invalid_subcommand(Results)
        if command in commands:
            return commands.get(command)()
        return False
