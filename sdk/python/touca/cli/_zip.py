# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path

import py7zr
from rich.progress import Progress
from touca.cli._common import Operation, ResultsTree
from touca._options import find_home_path

logger = logging.getLogger("touca.cli.zip")


def _compress_batch(binary_files, compressed_file, update):
    if compressed_file.exists():
        logger.info(f"Compressed file {compressed_file} already exists")
        return True
    logger.debug(f"Creating {compressed_file}")
    try:
        with py7zr.SevenZipFile(compressed_file, "w") as archive:
            for binary_file in binary_files:
                archive.write(binary_file, arcname=binary_file.name)
                update()
    except py7zr.ArchiveError:
        logger.warning(f"Failed to archive {compressed_file}")
        return False
    return True


class Zip(Operation):
    name = "zip"
    help = "Compress binary archives"

    def __init__(self, options: dict):
        self.__options = options

    @classmethod
    def parser(self, parser: ArgumentParser):
        home_dir = find_home_path()
        parser.add_argument(
            "src",
            nargs="?",
            default=home_dir.joinpath("results"),
            help=f"Directory with binary files. Defaults to {home_dir.joinpath('results')}",
        )
        parser.add_argument(
            "out",
            nargs="?",
            default=home_dir.joinpath("zip"),
            help=f"Directory to store compressed files. Defaults to {home_dir.joinpath('zip')}",
        )

    def run(self):
        src_dir = Path(self.__options.get("src")).expanduser().resolve()
        out_dir = Path(self.__options.get("out")).expanduser().resolve()

        results_tree = ResultsTree(src_dir)
        if results_tree.is_empty():
            logger.error(f"Did not find any binary file in {src_dir}")
            return False

        for suite_name, batch_name, binary_files in self._iterate(results_tree):
            zip_dir = out_dir.joinpath(suite_name)
            if not zip_dir.exists():
                zip_dir.mkdir(parents=True, exist_ok=True)
            zip_file = zip_dir.joinpath(batch_name + ".7z")
            with Progress() as progress:
                task_batch = progress.add_task(
                    f"[magenta]{suite_name}/{batch_name}[/magenta]",
                    total=len(binary_files),
                )
                update = lambda: progress.update(task_batch, advance=1)
                if not _compress_batch(binary_files, zip_file, update=update):
                    logger.error(f"failed to compress {src_dir}")
                    return False
        return True

    def _iterate(self, result_tree: ResultsTree):
        for suite_name, batches in result_tree.suites.items():
            for batch_name, binary_files in batches.items():
                yield suite_name, batch_name, binary_files
