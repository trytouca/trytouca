# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path
from typing import Dict, List

import py7zr
from touca._options import find_home_path
from touca._printer import print_results_tree
from touca.cli._common import Operation, ResultsTree, invalid_subcommand

from rich.progress import Progress

logger = logging.Logger("touca.cli.results")


def _build_zip_tree(src_dir: Path) -> Dict[str, List[Path]]:
    if not src_dir.exists():
        return
    suites: Dict[str, List[Path]] = {}
    for zip_file in sorted(src_dir.rglob("*.7z")):
        version_file = zip_file
        suite_name = zip_file.parent.name
        if suite_name not in suites:
            suites[suite_name] = []
        suites[suite_name].append(version_file)
    return suites


def _compress_batch(src_dir, binary_files: List[Path], zip_file, update):
    if zip_file.exists():
        logger.debug(f"Compressed file {zip_file} already exists")
        update(len(binary_files))
        return True
    logger.debug(f"Creating {zip_file}")
    try:
        with py7zr.SevenZipFile(zip_file, "w") as archive:
            for binary_file in binary_files:
                archive.write(binary_file, arcname=binary_file.relative_to(src_dir))
                update(1)
    except py7zr.ArchiveError:
        logger.warning(f"Failed to archive {zip_file}")
        return False
    return True


def _extract_batch(zip_file: Path, dst_dir: Path):
    logger.info(f"Extracting {zip_file} into {dst_dir}")
    try:
        with py7zr.SevenZipFile(zip_file, "r") as archive:
            archive.extractall(path=dst_dir)
    except Exception:
        logger.warning(f"failed to extract {zip_file}")
        return False
    return True


class Results(Operation):
    name = "results"
    help = "Show suite results"

    def __init__(self, options: dict):
        self.__options = options

    @classmethod
    def parser(self, parser: ArgumentParser):
        home_dir = find_home_path()
        parsers = parser.add_subparsers(dest="subcommand")
        parser_ls = parsers.add_parser("ls", help="list local touca archive files")
        parser_rm = parsers.add_parser("rm", help="remove local touca archive files")
        parser_zip = parsers.add_parser("zip", help="compress touca archive files")
        parser_unzip = parsers.add_parser(
            "unzip", help="extract compressed binary archives"
        )
        for parser in (parser_ls, parser_rm):
            parser.add_argument(
                "--src",
                dest="src_dir",
                default=home_dir.joinpath("results"),
                help=f"Path to test results directory. Defaults to {home_dir.joinpath('results')}.",
            )
            parser.add_argument(
                "--filter",
                default=None,
                help="Limit results to a given suite or version. Value should be in form of suite[/version].",
            )
        parser_rm.add_argument(
            "--dry-run",
            action="store_true",
            dest="dry_run",
            help="Check what your command would do when run without this option",
        )
        parser_zip.add_argument(
            "src_dir",
            nargs="?",
            default=home_dir.joinpath("results"),
            help=f"Path to test results directory. Defaults to {home_dir.joinpath('results')}.",
        )
        parser_zip.add_argument(
            "out_dir",
            nargs="?",
            default=home_dir.joinpath("zip"),
            help=f"Directory to store compressed files. Defaults to {home_dir.joinpath('zip')}",
        )
        parser_unzip.add_argument(
            "src_dir",
            nargs="?",
            default=home_dir.joinpath("zip"),
            help=f"Directory with compressed files. Defaults to {home_dir.joinpath('zip')}.",
        )
        parser_unzip.add_argument(
            "out_dir",
            nargs="?",
            default=home_dir.joinpath("results"),
            help=f"Directory to extract binary files into. Defaults to {home_dir.joinpath('results')}",
        )

    def _command_ls(self):
        filter = self.__options.get("filter", None)
        src_dir = self.__options.get("src_dir")
        results_tree = ResultsTree(src_dir, filter)
        print_results_tree(results_tree.suites)
        return True

    def _command_rm(self):
        from shutil import rmtree

        filter = self.__options.get("filter", None)
        src_dir = self.__options.get("src_dir")
        results_tree = ResultsTree(src_dir, filter)
        dry_run = self.__options.get("dry_run", False)

        if dry_run:
            for versions in results_tree.suites.values():
                for binary_files in versions.values():
                    for binary_file in binary_files:
                        logger.info(f"will remove {binary_file}")
            return True

        with Progress() as progress:
            for suite, versions in results_tree.suites.items():
                for version, binary_files in versions.items():
                    task_name = f"[magenta]{suite}/{version}[/magenta]"
                    task_batch = progress.add_task(task_name, total=len(binary_files))
                    for binary_file in binary_files:
                        logger.debug(f"removing {binary_file}")
                        binary_file.unlink()
                        progress.update(task_batch, advance=1)
                    rmtree(src_dir.joinpath(suite, version))
                rmtree(src_dir.joinpath(suite))
        return True

    def _command_unzip(self):
        src_dir = Path(self.__options.get("src_dir")).resolve()
        out_dir = Path(self.__options.get("out_dir")).resolve()

        if not src_dir.exists():
            logger.error(f"Directory {src_dir} does not exist")
            return False
        zip_tree = _build_zip_tree(src_dir)
        if not zip_tree:
            logger.error(f"did not find any compressed file in {src_dir}")
            return False
        with Progress() as progress:
            for suite_name, version_files in zip_tree.items():
                task_name = f"[magenta]{suite_name}[/magenta]"
                suite_size = sum(f.stat().st_size for f in version_files)
                task_suite = progress.add_task(task_name, total=suite_size)
                for zip_file in version_files:
                    if not py7zr.is_7zfile(zip_file):
                        logger.debug(f"{zip_file} is not an archive file")
                        continue
                    dst_dir = out_dir.joinpath(suite_name, zip_file.stem)
                    if dst_dir.exists():
                        logger.debug(f"unzipped directory already exists: {dst_dir}")
                        continue
                    if not _extract_batch(zip_file, dst_dir):
                        return False
                    progress.update(task_suite, advance=zip_file.stat().st_size)
                    logger.info(f"extracted {zip_file}")
        logger.info("extracted all archives")
        return True

    def _command_zip(self):
        src_dir = Path(self.__options.get("src_dir")).resolve()
        out_dir = Path(self.__options.get("out_dir")).resolve()
        results_tree = ResultsTree(src_dir, None)

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
                    if not _compress_batch(
                        src_dir.joinpath(suite_name, version_name),
                        binary_files,
                        zip_file,
                        update=update,
                    ):
                        logger.error(f"failed to compress {src_dir}")
                        return False
        return True

    def run(self):
        commands = {
            "ls": self._command_ls,
            "rm": self._command_rm,
            "zip": self._command_zip,
            "unzip": self._command_unzip,
        }
        command = self.__options.get("subcommand")
        if not command:
            return invalid_subcommand(Results)
        if command in commands:
            return commands.get(command)()
        return False
