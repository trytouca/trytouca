# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import argparse
import logging
import sys
from typing import List

from touca import __version__
from touca._options import find_home_path
from touca._printer import Printer
from touca.cli._common import Operation
from touca.cli._config import Config
from touca.cli._execute import Execute
from touca.cli._merge import Merge
from touca.cli._plugin import Plugin, user_plugins
from touca.cli._post import Post
from touca.cli._profile import Profile
from touca.cli._run import Run
from touca.cli._unzip import Unzip
from touca.cli._update import Update
from touca.cli._zip import Zip
from touca.cli.server import Server
from rich.logging import RichHandler


def _find_latest_pypi_version():
    from json import loads
    from urllib.request import urlopen

    with urlopen("https://pypi.org/pypi/touca/json") as response:
        data = loads(response.read())
        return data["info"]["version"]


def _warn_outdated_version():
    from packaging import version

    latest_version = _find_latest_pypi_version()
    if version.parse(latest_version) <= version.parse(__version__):
        return
    fmt = (
        "You are using touca version {}; however, version {} is available."
        + "\nConsider upgrading by running 'pip install --upgrade touca'."
    )
    Printer.print_warning(fmt, __version__, latest_version)


class Help(Operation):
    name = "help"
    help = "Shows this help message"

    def __init__(self, options):
        self._options = options

    @classmethod
    def parser(self, parser: argparse.ArgumentParser):
        parser.add_argument(
            "subcommand", help="subcommand to get help about", nargs="?"
        )

    def run(self, parser: argparse.ArgumentParser, subcommands: List[Operation]):
        subcommand_name = self._options.get("subcommand")
        subcommand = next((x for x in subcommands if x.name == subcommand_name), None)
        if not subcommand:
            parser.print_help()
            return False
        subcommand_parser = argparse.ArgumentParser(
            prog=f"touca {subcommand_name}",
            add_help=False,
            epilog="See https://touca.io/docs/cli for more information.",
        )
        subcommand.parser(subcommand_parser)
        subcommand_parser.print_help()
        return False


class Version(Operation):
    name = "version"
    help = "Check your Touca CLI version"

    def __init__(self, options):
        pass

    def run(self):
        print(f"v{__version__}")
        return True


def main(args=None):
    subcommands = [
        Config,
        Help,
        Merge,
        Plugin,
        Post,
        Profile,
        Run,
        Server,
        Execute,
        Unzip,
        Update,
        Version,
        Zip,
        *user_plugins(),
    ]
    parser = argparse.ArgumentParser(
        prog="touca",
        add_help=False,
        description="Work seamlessly with Touca from the command line.",
        epilog="See https://touca.io/docs/cli for more information.",
    )
    parser.add_argument(
        "-v",
        "--version",
        action="version",
        version=f"%(prog)s v{__version__}",
        help=argparse.SUPPRESS,
    )
    parsers = parser.add_subparsers(dest="command")
    for operation in subcommands:
        subparser = parsers.add_parser(
            name=operation.name,
            prog=f"touca {operation.name}",
            description=operation.help,
            help=operation.help,
            add_help=True,
        )
        if callable(getattr(operation, "parser", None)):
            operation.parser(subparser)
    parsed, remaining = parser.parse_known_args(sys.argv[1:] if args is None else args)
    options = vars(parsed)

    command = next((x for x in subcommands if x.name == options.get("command")), None)
    if (
        not command
        or command is Help
        or any(arg in remaining for arg in ["-h", "--help"])
    ):
        return Help(options).run(parser, subcommands)
    operation = command(options)

    home_dir = find_home_path()
    home_dir.mkdir(parents=True, exist_ok=True)

    logging.basicConfig(
        datefmt="[%X]",
        format="%(message)s",
        handlers=[RichHandler()],
        level=logging.INFO,
    )

    if not operation.run():
        return True

    _warn_outdated_version()
    return False


if __name__ == "__main__":
    sys.exit(main())
