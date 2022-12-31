# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser
from typing import List

from touca.cli._common import Operation, invalid_subcommand
from touca.cli.results import (
    CliCommand,
    CompressCommand,
    EditCommand,
    ExtractCommand,
    ListCommand,
    MergeCommand,
    PostCommand,
    RemoveCommand,
)


class Results(Operation):
    name = "results"
    help = "Manage local test results"
    subcommands: List[CliCommand] = [
        CompressCommand,
        EditCommand,
        ExtractCommand,
        ListCommand,
        MergeCommand,
        PostCommand,
        RemoveCommand,
    ]

    def __init__(self, options: dict):
        self.__options = options

    @classmethod
    def parser(self, parser: ArgumentParser):
        parsers = parser.add_subparsers(dest="subcommand")
        for cmd in Results.subcommands:
            cmd.parser(parsers.add_parser(cmd.name, help=cmd.help))

    def run(self):
        command = self.__options.get("subcommand")
        if not command:
            return invalid_subcommand(Results)
        subcommand = next(i for i in Results.subcommands if i.name == command)
        if not subcommand:
            return invalid_subcommand(Results)
        subcommand.run(self.__options)
        return True
