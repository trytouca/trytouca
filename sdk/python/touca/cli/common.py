# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

from abc import ABC
from configparser import ConfigParser
from typing import Dict

from touca._options import find_profile_path


class CliCommand(ABC):
    def __init__(self, options: Dict):
        self.options = options


def config_set(options: Dict[str, str]):
    path = find_profile_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    config = ConfigParser()
    if path.exists():
        config.read_string(path.read_text())
    if not config.has_section("settings"):
        config.add_section("settings")
    for key, value in options.items():
        config.set("settings", key, value)
        with open(path, "wt") as file:
            config.write(file)
