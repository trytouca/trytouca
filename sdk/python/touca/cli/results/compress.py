# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path
from typing import Dict

from py7zr import SevenZipFile
from rich.progress import Progress
from touca._options import find_home_path
from touca.cli.results.common import CliCommand, build_results_tree

logger = logging.Logger("touca.cli.results.compress")


class CompressCommand(CliCommand):
    name = "compress"
    help = "Compress touca archive files"

    @staticmethod
    def parser(parser: ArgumentParser):
        home_dir = find_home_path()
        parser.add_argument(
            "src_dir",
            nargs="?",
            default=home_dir.joinpath("results"),
            help=f"Path to test results directory. Defaults to {home_dir.joinpath('results')}.",
        )
        parser.add_argument(
            "out_dir",
            nargs="?",
            default=home_dir.joinpath("zip"),
            help=f"Directory to store compressed files. Defaults to {home_dir.joinpath('zip')}",
        )

    @staticmethod
    def run(options: Dict):
        src_dir = Path(options.get("src_dir")).resolve()
        out_dir = Path(options.get("out_dir")).resolve()
        results_tree = build_results_tree(src_dir)
        for suite_name, versions in results_tree.items():
            zip_dir = out_dir.joinpath(suite_name)
            if not zip_dir.exists():
                zip_dir.mkdir(parents=True, exist_ok=True)
            for version_name, binary_files in versions.items():
                zip_file = zip_dir.joinpath(version_name + ".7z")
                with Progress() as progress:
                    task_batch = progress.add_task(
                        f"[magenta]{suite_name}/{version_name}[/magenta]",
                        total=len(binary_files),
                    )
                    if zip_file.exists():
                        logger.debug(f"Compressed file {zip_file} already exists")
                        progress.update(task_batch, advance=len(binary_files))
                        continue
                    logger.debug(f"Creating {zip_file}")
                    try:
                        with SevenZipFile(zip_file, "w") as archive:
                            for binary_file in binary_files:
                                archive.write(
                                    binary_file,
                                    arcname=binary_file.relative_to(
                                        src_dir.joinpath(suite_name, version_name)
                                    ),
                                )
                                progress.update(task_batch, advance=1)
                    except Exception:
                        raise RuntimeError(f'Failed to compress "{zip_file}".')
