# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from abc import ABC, abstractmethod
from pathlib import Path


class Operation(ABC):
    @abstractmethod
    def run(self) -> bool:
        pass


class ResultsTree:
    suites = {}

    def __init__(self, src: Path):
        if not src.exists():
            return
        if src.is_file():
            self._process(src)
            return
        for binary_file in src.rglob("*.bin"):
            self._process(binary_file)

    def _process(self, binary_file: Path):
        batch_dir = binary_file.parent
        suite_dir = batch_dir.parent
        batch_name = batch_dir.name
        suite_name = suite_dir.name
        if suite_name not in self.suites:
            self.suites[suite_name] = {}
        if batch_name not in self.suites[suite_name]:
            self.suites[suite_name][batch_name] = []
        self.suites[suite_name][batch_name].append(binary_file)

    def is_empty(self):
        return len(self) == 0

    def __len__(self):
        return sum(sum(len(x) for x in bs.values()) for bs in self.suites.values())


def invalid_subcommand(cls):
    import sys
    from argparse import ArgumentParser

    parser = ArgumentParser(prog=f"touca {cls.name}", description=cls.help)
    cls.parser(parser)
    parser.print_help(file=sys.stderr)
    return False
