# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from pathlib import Path
from typing import Dict, List


def build_results_tree(src_dir: Path, filter: str = None, empty_ok=False):
    suites: Dict[str, Dict[str, List[Path]]] = {}
    filters = dict(zip(["suite", "version"], filter.split("/") if filter else []))

    def _process_results_tree(binary_file: Path, filters: List[str]):
        testcase_dir = binary_file.parent
        version_dir = testcase_dir.parent
        version_name = version_dir.name
        suite_dir = version_dir.parent
        suite_name = suite_dir.name

        if "suite" in filters and filters.get("suite") != suite_name:
            return
        if "version" in filters and filters.get("version") != version_name:
            return

        if suite_name not in suites:
            suites[suite_name] = {}
        if version_name not in suites[suite_name]:
            suites[suite_name][version_name] = []
        suites[suite_name][version_name].append(binary_file)

    if src_dir.exists():
        if src_dir.is_file():
            _process_results_tree(src_dir, filters)
        else:
            for binary_file in sorted(src_dir.rglob("*.bin")):
                _process_results_tree(binary_file, filters)

    if suites or empty_ok:
        return suites

    extra = f' that matches the specified filter "{filters}"' if filters else ""
    raise RuntimeError(f'Did not find any Touca archives in "{str(src_dir)}"{extra}.')
