# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from configparser import ConfigParser
from pathlib import Path
from argparse import ArgumentParser
import sys
from typing import List
from touca.cli._common import Operation, invalid_subcommand
from touca._options import find_home_path, find_profile_path


class Profile(Operation):
    name = "profile"
    help = "Create and manage configuration files"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parsers = parser.add_subparsers(dest="subcommand")
        parsers.add_parser(
            "list",
            description="List available profiles",
            help="List available profiles",
        )
        parsers_1 = parsers.add_parser(
            "set", description="Change active profile", help="Change active profile"
        )
        parsers_1.add_argument("name", help="name of the profile")
        parsers_2 = parsers.add_parser(
            "delete",
            description="Delete profile with specified name",
            help="Delete profile with specified name",
        )
        parsers_2.add_argument("name", help="name of the profile")
        parsers_3 = parsers.add_parser(
            "copy",
            description="Copy content of a given profile to a new or existing profile",
            help="Copy content of a profile to a new or existing profile",
        )
        parsers_3.add_argument("src", help="name of the profile to copy from")
        parsers_3.add_argument("dst", help="name of the new profile")

    def __init__(self, options: dict):
        self.__options = options

    def _profile_names(self) -> List[str]:
        profiles = Path(find_home_path(), "profiles").glob("*")
        return [p.name for p in profiles if p.is_file()]

    def _update_profile_in_settings_file(self, profile_name: str):
        settings_path = Path(find_home_path(), "settings")
        config = ConfigParser()
        if settings_path.exists():
            config.read_string(settings_path.read_text())
        if not config.has_section("settings"):
            config.add_section("settings")
        config.set("settings", "profile", profile_name)
        with open(settings_path, "wt") as settings_file:
            config.write(settings_file)

    def _command_list(self):
        for profile in self._profile_names():
            print(profile)
        return True

    def _command_set(self):
        profile_name = self.__options.get("name")
        if profile_name not in self._profile_names():
            profile_path = Path(find_home_path(), "profiles", profile_name)
            profile_path.parent.mkdir(parents=True, exist_ok=True)
            config = ConfigParser()
            config.add_section("settings")
            with open(profile_path, "wt") as config_file:
                config.write(config_file)
        self._update_profile_in_settings_file(profile_name)
        return True

    def _command_delete(self):
        profile_name = self.__options.get("name")
        profile_path = Path(find_home_path(), "profiles", profile_name)
        if profile_name == "default":
            print("refusing to remove default configuration file", file=sys.stderr)
            return False
        if not profile_path.exists():
            print("profile does not exist", file=sys.stderr)
            return False
        if profile_path == find_profile_path():
            self._update_profile_in_settings_file("default")
        profile_path.unlink()
        return True

    def _command_copy(self):
        from shutil import copyfile

        profiles_dir = Path(find_home_path(), "profiles")
        src = self.__options.get("src")
        dst = self.__options.get("dst")
        profile_path = Path(profiles_dir, src)
        if not profile_path.exists():
            print(f'profile "{src}" does not exist', file=sys.stderr)
            return False
        copyfile(profile_path, Path(profiles_dir, dst))
        return True

    def run(self):
        commands = {
            "list": self._command_list,
            "set": self._command_set,
            "delete": self._command_delete,
            "copy": self._command_copy,
        }
        command = self.__options.get("subcommand")
        if not command:
            return invalid_subcommand(Profile)
        if command in commands:
            return commands.get(command)()
        return False
