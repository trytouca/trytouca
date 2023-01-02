# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser
from typing import List

from touca._printer import Printer
from touca._transport import __version__
from touca.cli.common import CliCommand


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


def update_parser(parser: ArgumentParser, command: CliCommand):
    if callable(getattr(command, "parser", None)):
        command.parser(parser)
        return
    if not hasattr(command, "subcommands"):
        return
    subparsers = parser.add_subparsers(dest="subcommand")
    for cmd in getattr(command, "subcommands"):
        subparser = subparsers.add_parser(cmd.name, help=cmd.help)
        if callable(getattr(cmd, "parser", None)):
            cmd.parser(subparser)


class HelpCommand(CliCommand):
    name = "help"
    help = "Learn how to use different commands"

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
            if not cmd:
                break
            commands.append(cmd)
            available_commands = getattr(cmd, "subcommands", [])
        if not commands:
            parser.print_help()
            _warn_outdated_version()
            return
        help_parser = ArgumentParser(
            add_help=False,
            description=commands[-1].help,
            prog=f"touca {' '.join(args)}",
            epilog="See https://touca.io/docs/cli for more information.",
        )
        update_parser(help_parser, commands[-1])
        help_parser.print_help()
