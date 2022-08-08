# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path

from colorama import Style
from touca.cli._common import Operation, invalid_subcommand

logger = logging.getLogger("touca.cli.server")


class Server(Operation):
    name = "server"
    help = "Manage local instance of touca server."

    @classmethod
    def parser(self, parser: ArgumentParser):
        parsers = parser.add_subparsers(dest="subcommand")
        parser_install = parsers.add_parser(
            "install",
            description="Install touca server",
            help="Install and run touca server.",
        )
        parser_install.add_argument(
            "--dev",
            action="store_true",
            dest="dev",
            help="Install for development.",
        )
        group_misc = parser.add_argument_group("Miscellaneous")
        group_misc.add_argument(
            "--dry-run",
            action="store_true",
            dest="dry-run",
            help="Check what your command would do when run without this option",
        )

    def __init__(self, options: dict):
        self.__options = options

    def _ask(self, question: str, default: str = ""):
        output = input(f"{question}\n> ")
        return output if output else default

    def _ask_name(self):
        print("Hi, Thank you for trying Touca!")
        output = self._ask("What is your first name?", "stranger")
        print(f"Nice to meet you, {output}!")
        return output

    def _ask_install_dir(self):
        default = Path.home().joinpath(".touca/server")
        output = self._ask(
            "Where should we install Touca? "
            f'{Style.DIM}(default is "{default}"){Style.RESET_ALL}',
            default,
        )
        print(f"Installing into {output}")
        return output

    def _command_install(self):
        user_name = self._ask_name()
        install_dir = self._ask_install_dir()
        return False

    def run(self) -> bool:
        print(self.__options)
        commands = {"install": self._command_install}
        command = self.__options.get("subcommand")
        if not command:
            return invalid_subcommand(Server)
        if command in commands:
            return commands.get(command)()
        return False
