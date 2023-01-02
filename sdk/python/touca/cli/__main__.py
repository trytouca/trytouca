# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
import sys
from argparse import SUPPRESS, ArgumentParser
from typing import List

from rich.logging import RichHandler
from touca import __version__
from touca.cli.check import CheckCommand
from touca.cli.common import CliCommand
from touca.cli.config import ConfigCommand
from touca.cli.execute import TestCommand
from touca.cli.help import HelpCommand, update_parser
from touca.cli.plugin import PluginCommand, user_plugins
from touca.cli.profile import ProfileCommand
from touca.cli.results import ResultsCommand
from touca.cli.run import RunCommand
from touca.cli.server import ServerCommand


def _build_parser(commands: List[CliCommand]) -> ArgumentParser:
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
            add_help=True,
            name=command.name,
            help=command.help,
            description=command.help,
            prog=f"touca {command.name}",
        )
        update_parser(subparser, command)
    return parser


def _print_unknown_command(command: CliCommand):
    parser = ArgumentParser(prog=f"touca {command.name}", description=command.help)
    update_parser(parser, command)
    parser.print_help(file=sys.stderr)


class VersionCommand(CliCommand):
    name = "version"
    help = "Check your Touca CLI version"

    def run(self):
        print(f"v{__version__}")


def main(args=sys.argv[1:]):
    commands: List[CliCommand] = [
        HelpCommand,
        TestCommand,
        ConfigCommand,
        ProfileCommand,
        CheckCommand,
        ServerCommand,
        ResultsCommand,
        PluginCommand,
        RunCommand,
        VersionCommand,
        *user_plugins(),
    ]
    parser = _build_parser(commands)
    parsed, remaining = parser.parse_known_args(args)
    options = vars(parsed)

    logging.basicConfig(
        format="%(message)s",
        handlers=[RichHandler(show_path=False, show_time=False)],
        level=logging.INFO,
    )

    command = next(
        (x for x in commands if x.name == options.get("command")), HelpCommand
    )
    if command is HelpCommand or any(arg in remaining for arg in ["-h", "--help"]):
        options.update({"parser": parser, "commands": commands})

    try:
        if callable(getattr(command, "run", None)):
            command(options).run()
        elif hasattr(command, "subcommands"):
            if not options.get("subcommand"):
                _print_unknown_command(command)
                return True
            subcommand = next(
                (
                    sub
                    for sub in getattr(command, "subcommands", [])
                    if sub.name == options.get("subcommand")
                ),
                None,
            )
            if not subcommand:
                _print_unknown_command(command)
                return True
            subcommand(options).run()
    except Exception as err:
        from sys import version_info
        from traceback import format_exception

        if (3, 10) <= version_info:
            for x in format_exception(err):
                logging.debug(x.strip())

        # logging.error(err)
        print(err, file=sys.stderr)
        return True

    return False


if __name__ == "__main__":
    sys.exit(main())
