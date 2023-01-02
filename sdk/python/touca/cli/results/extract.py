# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path
from typing import Dict, List

from touca._options import find_home_path
from touca.cli.common import CliCommand

logger = logging.Logger("touca.cli.results.extract")


class ExtractCommand(CliCommand):
    name = "extract"
    help = "Extract compressed binary archives"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        home_dir = find_home_path()
        parser.add_argument(
            "src_dir",
            nargs="?",
            default=home_dir.joinpath("zip"),
            help=f"Directory with compressed files. Defaults to {home_dir.joinpath('zip')}.",
        )
        parser.add_argument(
            "out_dir",
            nargs="?",
            default=home_dir.joinpath("results"),
            help=f"Directory to extract binary files into. Defaults to {home_dir.joinpath('results')}",
        )

    def run(self):
        from py7zr import SevenZipFile, is_7zfile
        from rich.progress import Progress

        src_dir = Path(self.options.get("src_dir")).resolve()
        out_dir = Path(self.options.get("out_dir")).resolve()

        if not src_dir.exists():
            raise RuntimeError(f"Directory {src_dir} does not exist")
        if not src_dir.exists():
            return
        zip_tree: Dict[str, List[Path]] = {}
        for zip_file in sorted(src_dir.rglob("*.7z")):
            version_file = zip_file
            suite_name = zip_file.parent.name
            if suite_name not in zip_tree:
                zip_tree[suite_name] = []
            zip_tree[suite_name].append(version_file)
        if not zip_tree:
            raise RuntimeError(f'Did not find any compressed file in "{src_dir}".')
        with Progress() as progress:
            for suite_name, version_files in zip_tree.items():
                task_name = f"[magenta]{suite_name}[/magenta]"
                suite_size = sum(f.stat().st_size for f in version_files)
                task_suite = progress.add_task(task_name, total=suite_size)
                for zip_file in version_files:
                    if not is_7zfile(zip_file):
                        logger.debug(f"{zip_file} is not an archive file")
                        continue
                    dst_dir = out_dir.joinpath(suite_name, zip_file.stem)
                    if dst_dir.exists():
                        logger.debug(f"unzipped directory already exists: {dst_dir}")
                        continue
                    logger.info(f"Extracting {zip_file} into {dst_dir}")
                    try:
                        with SevenZipFile(zip_file, "r") as archive:
                            archive.extractall(path=dst_dir)
                    except Exception:
                        logger.warning(f"failed to extract {zip_file}")
                        return False
                    progress.update(task_suite, advance=zip_file.stat().st_size)
                    logger.info(f"Extracted {zip_file}.")
