# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import sys
from typing import List
from touca.cli._common import Operation, invalid_subcommand
from touca._options import (
    config_file_parse,
    find_home_path,
    find_profile_path,
)


class Config(Operation):
    name = "config"
    help = "Manage active configuration file"

    @classmethod
    def parser(cls, parser):
        parsers = parser.add_subparsers(dest="subcommand")
        parsers.add_parser(
            "home",
            description="Print path to active configuration file",
            help="Print path to active configuration file",
        )
        parsers.add_parser(
            "show",
            description="Print content of active configuration file",
            help="Print content of active configuration file",
        )
        parsers_1 = parsers.add_parser(
            "set",
            description="Set a value for a configuration option",
            help="Set a value for a configuration option",
        )
        parsers_1.add_argument(
            "key", nargs="+", help="option to be added to the config file"
        )
        parsers_2 = parsers.add_parser(
            "get",
            description="Get value of a configuration option",
            help="Get value of a configuration option",
        )
        parsers_2.add_argument("key", help="name of the option to print")
        parsers_3 = parsers.add_parser(
            "rm",
            description="Remove a configuration option",
            help="Remove a configuration option",
        )
        parsers_3.add_argument("key", help="name of the option to be removed")

    def __init__(self, options: dict):
        self.__options = options

    def _config_file_set(self, key: str, value: str, section="settings") -> None:
        from configparser import ConfigParser

        path = find_profile_path()
        path.mkdir(path.parent, parents=True, exist_ok=True)
        config = ConfigParser()
        if path.exists():
            config.read_string(path.read_text())
        if not config.has_section(section):
            config.add_section(section)
        config.set(section, key, value)
        with open(path, "wt") as file:
            config.write(file)

    def _command_home(self):
        print(find_home_path())
        return True

    def _command_show(self):
        path = find_profile_path()
        if path.exists():
            print(path.read_text().strip())
        return True

    def _command_get(self):
        key = self.__options.get("key")
        config = config_file_parse()
        if config and config.has_option("settings", key):
            print(config.get("settings", key))
            return True
        return False

    def _command_set(self):
        error = """
Argument \"{}\" has invalid format.

Please specify the value of the configuration option in the form of "key=value".
For example, to set Touca API Key in the configuration file you could write:

touca config set api-key=3c335732-bf44-4b28-9be8-f30c00e7960f
"""
        values: List[str] = self.__options.get("key")
        pairs = [x.split("=", maxsplit=1) for x in values]
        invalid = list(filter(lambda x: len(x) != 2, pairs))
        if invalid:
            print(str.format(error, invalid[0][0]), file=sys.stderr)
            return True
        for key, value in pairs:
            self._config_file_set(key, value)
        return True

    def _command_rm(self):
        key = self.__options.get("key")
        config_file_path = find_profile_path()
        config = config_file_parse()
        if config and config.has_option("settings", key):
            config.remove_option("settings", key)
        with open(config_file_path, "wt") as config_file:
            config.write(config_file)
        return True

    def run(self) -> bool:
        commands = {
            "home": self._command_home,
            "show": self._command_show,
            "get": self._command_get,
            "set": self._command_set,
            "rm": self._command_rm,
        }
        command = self.__options.get("subcommand")
        if not command:
            return invalid_subcommand(Config)
        if command in commands:
            return commands.get(command)()
        return False
