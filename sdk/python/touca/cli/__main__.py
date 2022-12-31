# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
import sys
from argparse import SUPPRESS, ArgumentParser
from traceback import print_exc
from typing import List

from rich.logging import RichHandler
from touca import __version__
from touca._options import find_home_path
from touca._printer import Printer
from touca.cli.common import CliCommand, UnknownSubcommandError
from touca.cli.check import CheckCommand
from touca.cli.config import ConfigCommand
from touca.cli.execute import ExecuteCommand
from touca.cli.plugin import PluginCommand, user_plugins
from touca.cli.profile import ProfileCommand
from touca.cli.results import ResultsCommand
from touca.cli.run import RunCommand
from touca.cli.server import ServerCommand


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


class HelpCommand(CliCommand):
    name = "help"
    help = "Shows this help message"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument("subcommand", help="command to get help about", nargs="*")

    def run(self):
        available_commands: List[CliCommand] = self.options.get("commands")
        parser: ArgumentParser = self.options.get("parser")
        args = self.options.get("subcommand", [])
        commands: List[CliCommand] = []
        for arg in args:
            cmd = next((x for x in available_commands if x.name == arg), None)
            if not cmd or not callable(getattr(cmd, "parser", None)):
                break
            commands.append(cmd)
            available_commands = getattr(cmd, "subcommands", [])
        if not commands:
            parser.print_help()
            return
        help_parser = ArgumentParser(
            prog=f"touca {' '.join(args)}",
            description=commands[-1].help,
            add_help=False,
            epilog="See https://touca.io/docs/cli for more information.",
        )
        commands[-1].parser(help_parser)
        help_parser.print_help()


class VersionCommand(CliCommand):
    name = "version"
    help = "Check your Touca CLI version"

    def run(self):
        print(f"v{__version__}")


def main(args=None):
    commands: List[CliCommand] = [
        CheckCommand,
        ConfigCommand,
        HelpCommand,
        PluginCommand,
        ProfileCommand,
        ResultsCommand,
        RunCommand,
        ServerCommand,
        ExecuteCommand,
        VersionCommand,
        *user_plugins(),
    ]
    parser = ArgumentParser(
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
        help=SUPPRESS,
    )
    parsers = parser.add_subparsers(dest="command")
    for command in commands:
        subparser = parsers.add_parser(
            name=command.name,
            prog=f"touca {command.name}",
            description=command.help,
            help=command.help,
            add_help=True,
        )
        if callable(getattr(command, "parser", None)):
            command.parser(subparser)
    parsed, remaining = parser.parse_known_args(sys.argv[1:] if args is None else args)
    options = vars(parsed)

    command = next((x for x in commands if x.name == options.get("command")), None)
    if (
        not command
        or command is HelpCommand
        or any(arg in remaining for arg in ["-h", "--help"])
    ):
        options.update({"parser": parser, "commands": commands})
        HelpCommand(options).run()
        return False

    home_dir = find_home_path()
    home_dir.mkdir(parents=True, exist_ok=True)

    logging.basicConfig(
        format="%(message)s",
        handlers=[RichHandler(show_path=False, show_time=False)],
        level=logging.INFO,
    )

    try:
        command(options).run()
    except UnknownSubcommandError:
        return True
    except Exception:
        print_exc()
        return True

    _warn_outdated_version()
    return False


if __name__ == "__main__":
    sys.exit(main())
