# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from abc import ABC, abstractmethod
from argparse import ArgumentParser
from typing import Dict
from sys import stderr


class CliCommand(ABC):
    @staticmethod
    @abstractmethod
    def parser(parser: ArgumentParser):
        pass

    @staticmethod
    @abstractmethod
    def run(options: Dict):
        pass


class Operation(ABC):
    @abstractmethod
    def run(self) -> bool:
        pass


def invalid_subcommand(cls):
    parser = ArgumentParser(prog=f"touca {cls.name}", description=cls.help)
    cls.parser(parser)
    parser.print_help(file=stderr)
    return False
