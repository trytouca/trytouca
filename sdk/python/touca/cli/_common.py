# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, List


class Operation(ABC):
    @abstractmethod
    def run(self) -> bool:
        pass


class ResultsTree:
    suites: Dict[str, Dict[str, List[Path]]] = {}

    def __init__(self, src: Path, filter: str = None):
        filters = filter.split("/") if filter else []
        filters.extend([None, None])
        if not src.exists():
            return
        if src.is_file():
            self._process(src, filters)
            return
        for binary_file in sorted(src.rglob("*.bin")):
            self._process(binary_file, filters)

    def _process(self, binary_file: Path, filters: List[str]):
        testcase_dir = binary_file.parent
        version_dir = testcase_dir.parent
        version_name = version_dir.name
        suite_dir = version_dir.parent
        suite_name = suite_dir.name

        if filters[0] is not None and filters[0] != suite_name:
            return
        if filters[1] is not None and filters[1] != version_name:
            return

        if suite_name not in self.suites:
            self.suites[suite_name] = {}
        if version_name not in self.suites[suite_name]:
            self.suites[suite_name][version_name] = []
        self.suites[suite_name][version_name].append(binary_file)

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
