# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser
from typing import List

from touca.cli.common import CliCommand, UnknownSubcommandError
from touca.cli.results.compress import CompressCommand
from touca.cli.results.edit import EditCommand
from touca.cli.results.extract import ExtractCommand
from touca.cli.results.list import ListCommand
from touca.cli.results.merge import MergeCommand
from touca.cli.results.post import PostCommand
from touca.cli.results.remove import RemoveCommand


class ResultsCommand(CliCommand):
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

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parsers = parser.add_subparsers(dest="subcommand")
        for cmd in cls.subcommands:
            cmd.parser(parsers.add_parser(cmd.name, help=cmd.help))

    def run(self):
        command = self.options.get("subcommand")
        if not command:
            raise UnknownSubcommandError(ResultsCommand)
        subcommand = next(i for i in ResultsCommand.subcommands if i.name == command)
        if not subcommand:
            raise UnknownSubcommandError(ResultsCommand)
        subcommand(self.options).run()
