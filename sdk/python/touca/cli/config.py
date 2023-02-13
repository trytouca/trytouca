# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser
from typing import List

from touca._options import find_home_path, find_profile_path, parse_config_profile
from touca._printer import print_table
from touca.cli.common import CliCommand, config_set


class HomeCommand(CliCommand):
    name = "home"
    help = "Print path to active configuration file"

    def run(self):
        print(find_home_path())


class ShowCommand(CliCommand):
    name = "show"
    help = "Print content of active configuration file"

    def run(self):
        config = parse_config_profile()
        if not config or not config.has_section("settings"):
            return
        table_header = ["", "Option", "Value"]
        table_body = [
            [f"{idx + 1}", k, v] for idx, [k, v] in enumerate(config.items("settings"))
        ]
        print_table(table_header, table_body)


class GetCommand(CliCommand):
    name = "get"
    help = "Get value of a configuration option"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument("key", help="name of the option to print")

    def run(self):
        key = self.options.get("key")
        config = parse_config_profile()
        if config and config.has_option("settings", key):
            print(config.get("settings", key))


class SetCommand(CliCommand):
    name = "set"
    help = "Set a value for a configuration option"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument(
            "key", nargs="+", help="option to be added to the config file"
        )

    def run(self) -> None:
        error = """
Argument \"{}\" has invalid format.

Please specify the value of the configuration option in the form of "key=value".
For example, to set Touca API Key in the configuration file you could write:

touca config set api-key=3c335732-bf44-4b28-9be8-f30c00e7960f
"""
        values: List[str] = self.options["key"]
        pairs = [x.split("=", maxsplit=1) for x in values]
        for pair in pairs:
            if len(pair) != 2:
                raise RuntimeError(str.format(error, pair[0]))
        config_set({k: v for k, v in pairs})


class RemoveCommand(CliCommand):
    name = "rm"
    help = "Remove a configuration option"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument("key", help="name of the option to be removed")

    def run(self):
        key = self.options.get("key")
        config_file_path = find_profile_path()
        config = parse_config_profile()
        if config and config.has_option("settings", key):
            config.remove_option("settings", key)
        with open(config_file_path, "wt") as config_file:
            config.write(config_file)


class ConfigCommand(CliCommand):
    name = "config"
    help = "Manage your active configuration profile"
    subcommands = [
        HomeCommand,
        ShowCommand,
        SetCommand,
        GetCommand,
        RemoveCommand,
    ]
