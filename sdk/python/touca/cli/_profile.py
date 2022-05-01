# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import os
from argparse import Action, ArgumentParser
from pathlib import Path

from touca._options import config_file_parse
from touca._runner import run_workflows
from touca._runner import Workflow
from touca.cli._operation import Operation


class Profile(Operation):
    name = "profile"
    help = "Create and manage configuration files"

    def __init__(self, options: dict):
        self.__options = options
        pass

    def parser(self):
        parser = ArgumentParser(
            prog="touca profile", description=Profile.help, add_help=True
        )
        subparsers = parser.add_subparsers(dest="subcommand")
        subparsers.add_parser(
            "list",
            description="List available profiles",
            help="List available profiles",
        )
        parser_set = subparsers.add_parser(
            "set", description="Change active profile", help="Change active profile"
        )
        parser_set.add_argument("name", help="name of the profile")
        parser_delete = subparsers.add_parser(
            "delete",
            description="Delete profile with specified name",
            help="Delete profile with specified name",
        )
        parser_delete.add_argument("name", help="name of the profile")
        parser_copy = subparsers.add_parser(
            "copy",
            description="Copy content of a given profile to a new or existing profile",
            help="Copy content of a profile to a new or existing profile",
        )
        parser_copy.add_argument("src", help="name of the profile to copy from")
        parser_copy.add_argument("dst", help="name of the new profile")
        return parser

    def parse(self, args):
        parsed, _ = self.parser().parse_known_args(args)
        self.__options = {**self.__options, **vars(parsed)}

    def run(self):
        print(self.__options)
        return True
