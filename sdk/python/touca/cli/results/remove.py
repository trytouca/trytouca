# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path
from shutil import rmtree

from rich.progress import Progress
from touca._options import find_home_path
from touca.cli.common import CliCommand
from touca.cli.results.common import build_results_tree

logger = logging.Logger("touca.cli.results.remove")


class RemoveCommand(CliCommand):
    name = "rm"
    help = "Remove local touca archive files"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        home_dir = find_home_path()
        parser.add_argument(
            "--src-dir",
            dest="src_dir",
            default=home_dir.joinpath("results"),
            help=f"Path to test results directory. Defaults to {home_dir.joinpath('results')}.",
        )
        parser.add_argument(
            "--filter",
            default=None,
            help="Limit results to a given suite or version. Value should be in form of suite[/version].",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            dest="dry_run",
            help="Check what your command would do when run without this option",
        )

    def run(self):
        filter = self.options.get("filter", None)
        src_dir = Path(self.options.get("src_dir"))
        results_tree = build_results_tree(src_dir, filter)

        if self.options.get("dry_run"):
            for versions in results_tree.values():
                for binary_files in versions.values():
                    for binary_file in binary_files:
                        logger.info(f"will remove {binary_file}")
            return

        with Progress() as progress:
            for suite, versions in results_tree.items():
                for version, binary_files in versions.items():
                    task_name = f"[magenta]{suite}/{version}[/magenta]"
                    task_batch = progress.add_task(task_name, total=len(binary_files))
                    for binary_file in binary_files:
                        logger.debug(f"removing {binary_file}")
                        binary_file.unlink()
                        progress.update(task_batch, advance=1)
                    rmtree(src_dir.joinpath(suite, version))
                if not list(src_dir.joinpath(suite).glob("*")):
                    rmtree(src_dir.joinpath(suite))
