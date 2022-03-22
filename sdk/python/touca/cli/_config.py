# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import argparse
import sys
from typing import List
from enum import Enum
from touca.cli._operation import Operation
from touca._options import (
    config_file_get,
    config_file_set,
    config_file_home,
    config_file_load,
)


class Action(Enum):
    get = 1
    set = 2
    home = 3
    show = 4


class Config(Operation):
    def __init__(self, options: dict):
        self.__options = options

    def name(self) -> str:
        return "config"

    def parser(self) -> argparse.ArgumentParser:
        parser = argparse.ArgumentParser(prog="touca config")
        parser.add_argument(
            "action",
            nargs=1,
            choices={"set", "get", "home", "show"},
            help="path to directory with original Touca archives directories",
        )
        parser.add_argument(
            "args",
            nargs="*",
            help="path to directory where the merged archives should be created",
        )
        return parser

    def parse(self, args):
        parsed, _ = self.parser().parse_known_args(args)
        self.__options = {**self.__options, **vars(parsed)}

    def run(self) -> bool:
        action = Action[self.__options["action"][0]]
        if action == Action.get:
            key = self.__options["args"][0]
            value = config_file_get(key)
            if value:
                print(value)
        if action == Action.set:
            error = """
Argument \"{}\" has invalid format.

Please specify the value of the configuration option in the form of "key=value".
For example, to set Touca API Key in the configuration file you could write:

    touca config set api-key=3c335732-bf44-4b28-9be8-f30c00e7960f
"""
            values: List[str] = self.__options["args"]
            pairs = [x.split("=", maxsplit=1) for x in values]
            invalid = list(filter(lambda x: len(x) != 2, pairs))
            if invalid:
                print(str.format(error, invalid[0][0]), file=sys.stderr)
                return True
            for key, value in pairs:
                config_file_set(key, value)
        if action == Action.home:
            print(config_file_home())
        if action == Action.show:
            print(config_file_load().strip())
        return True
