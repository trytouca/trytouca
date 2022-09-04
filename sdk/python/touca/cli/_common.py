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
        test_case_dir = binary_file.parent
        version_dir = test_case_dir.parent
        suite_dir = version_dir.parent
        test_case_name = test_case_dir.name
        version_name = version_dir.name
        suite_name = suite_dir.name

        if suite_name not in self.suites:
            self.suites[suite_name] = {}

        if version_name not in self.suites[suite_name]:
            self.suites[suite_name][version_name] = {}

        if test_case_name not in self.suites[suite_name][version_name]:
            self.suites[suite_name][version_name][test_case_name] = []

        self.suites[suite_name][version_name][test_case_name].append(binary_file)

    @property
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
