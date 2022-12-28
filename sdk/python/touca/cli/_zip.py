# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path

import py7zr
from rich.progress import Progress
from touca._options import find_home_path
from touca.cli._common import Operation, ResultsTree

logger = logging.getLogger("touca.cli.zip")


def _compress_batch(binary_files, zip_file, update):
    if zip_file.exists():
        logger.debug(f"Compressed file {zip_file} already exists")
        update(len(binary_files))
        return True
    logger.debug(f"Creating {zip_file}")
    try:
        with py7zr.SevenZipFile(zip_file, "w") as archive:
            for binary_file in binary_files:
                archive.write(binary_file, arcname=binary_file.name)
                update(1)
    except py7zr.ArchiveError:
        logger.warning(f"Failed to archive {zip_file}")
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

        for suite_name, versions in results_tree.suites.items():
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
                    update = lambda x: progress.update(task_batch, advance=x)
                    if not _compress_batch(binary_files, zip_file, update=update):
                        logger.error(f"failed to compress {src_dir}")
                        return False
        return True
