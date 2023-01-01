# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from touca.cli.common import CliCommand
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
    subcommands = [
        ListCommand,
        MergeCommand,
        PostCommand,
        CompressCommand,
        ExtractCommand,
        RemoveCommand,
        EditCommand,
    ]
