# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser
from configparser import ConfigParser
from pathlib import Path
from shutil import copyfile

from touca._options import find_home_path, find_profile_path
from touca._printer import print_table
from touca.cli.common import CliCommand


def _list_profiles():
    home_path = find_home_path()
    settings_path = home_path.joinpath("settings")
    if not settings_path.exists():
        return ["default"], "default"

    profiles_dir = home_path.joinpath("profiles")
    profile_names = [p.name for p in profiles_dir.glob("*") if p.is_file()]
    profile_names.sort()
    config = ConfigParser()
    config.read_string(settings_path.read_text())
    profile_active = (
        config.get("settings", "profile")
        if config.has_section("settings")
        else "default"
    )
    return profile_names, profile_active


def _make_profile(profile: Path):
    if profile.exists():
        return
    profile.parent.mkdir(parents=True, exist_ok=True)
    config = ConfigParser()
    config.add_section("settings")
    with open(profile, "wt") as config_file:
        config.write(config_file)


def _update_profile_in_settings_file(profile_name: str):
    settings_path = Path(find_home_path(), "settings")
    config = ConfigParser()
    if settings_path.exists():
        config.read_string(settings_path.read_text())
    if not config.has_section("settings"):
        config.add_section("settings")
    config.set("settings", "profile", profile_name)
    with open(settings_path, "wt") as settings_file:
        config.write(settings_file)


class CopyCommand(CliCommand):
    name = "cp"
    help = "Copy content of a profile to a new or existing profile"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument("src", help="name of the profile to copy from")
        parser.add_argument("dst", help="name of the new profile")

    def run(self):
        src = self.options.get("src")
        dst = self.options.get("dst")
        profiles_dir = Path(find_home_path(), "profiles")
        profile_path = Path(profiles_dir, src)
        if not profile_path.exists():
            raise RuntimeError(f'profile "{src}" does not exist')
        copyfile(profile_path, Path(profiles_dir, dst))


class ListCommand(CliCommand):
    name = "ls"
    help = "List available profiles"

    def run(self):
        profile_names, active_profile = _list_profiles()
        table_body = [
            [
                f"{idx + 1}",
                f"{name} [magenta](active)[/magenta]"
                if name == active_profile
                else name,
            ]
            for idx, name in enumerate(profile_names)
        ]
        print_table(["", "Name"], table_body)


class RemoveCommand(CliCommand):
    name = "rm"
    help = "Delete profile with specified name"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument("name", help="name of the profile")

    def run(self):
        profile_name = self.options.get("name")
        profile_path = Path(find_home_path(), "profiles", profile_name)
        if profile_name == "default":
            raise RuntimeError("refusing to remove default configuration file")
        if not profile_path.exists():
            raise RuntimeError("profile does not exist")
        if profile_path == find_profile_path():
            _update_profile_in_settings_file("default")
        profile_path.unlink()


class SetCommand(CliCommand):
    name = "set"
    help = "Change active profile"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument("name", help="name of the profile")

    def run(self):
        profile_name = self.options.get("name")
        profile_path = Path(find_home_path(), "profiles", profile_name)
        _make_profile(profile_path)
        _update_profile_in_settings_file(profile_name)


class ProfileCommand(CliCommand):
    name = "profile"
    help = "Create and manage configuration profiles"
    subcommands = [
        ListCommand,
        SetCommand,
        RemoveCommand,
        CopyCommand,
    ]
