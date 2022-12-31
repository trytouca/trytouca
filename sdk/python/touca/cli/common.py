# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from abc import ABC, abstractmethod
from argparse import ArgumentParser
from sys import stderr
from typing import Dict


class CliCommand(ABC):
    def __init__(self, options: Dict):
        self.options = options

    @classmethod
    def parser(cls, parser: ArgumentParser) -> None:
        pass

    @abstractmethod
    def run(self) -> None:
        pass


class UnknownSubcommandError(Exception):
    def __init__(self, cls: CliCommand):
        parser = ArgumentParser(prog=f"touca {cls.name}", description=cls.help)
        cls.parser(parser)
        parser.print_help(file=stderr)
