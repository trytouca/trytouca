# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path
from typing import Dict, List

from touca._options import find_home_path
from touca.cli.common import CliCommand

logger = logging.Logger("touca.cli.results.extract")


def _extract(src_file: Path, dst_dir: Path):
    from py7zr import SevenZipFile, is_7zfile

    if not is_7zfile(src_file):
        logger.debug(f"{src_file} is not an archive file")
        return
    if dst_dir.exists():
        logger.error(f"results directory already exists: {dst_dir}")
        return
    logger.info(f"extracting {src_file} into {dst_dir}")
    try:
        with SevenZipFile(src_file, "r") as archive:
            archive.extractall(path=dst_dir)
    except Exception:
        logger.error(f"failed to extract archive: {src_file}")
        return


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
        from rich.progress import Progress

        src_dir = Path(self.options.get("src_dir")).resolve()
        out_dir = Path(self.options.get("out_dir")).resolve()

        if not src_dir.exists():
            raise RuntimeError(f"Directory {src_dir} does not exist")
        tree: Dict[str, List[Path]] = {}
        for version_file in sorted(src_dir.rglob("*.7z")):
            version_file = version_file
            suite_name = version_file.parent.name
            if suite_name not in tree:
                tree[suite_name] = []
            tree[suite_name].append(version_file)
        if not tree:
            raise RuntimeError(f'Did not find any compressed file in "{src_dir}".')
        for suite_name, version_files in tree.items():
            with Progress() as progress:
                task_name = f"[magenta]{suite_name}[/magenta]"
                suite_size = sum(f.stat().st_size for f in version_files)
                task = progress.add_task(task_name, total=suite_size)
                for version_file in version_files:
                    dst_dir = out_dir.joinpath(suite_name, version_file.stem)
                    _extract(version_file, dst_dir)
                    progress.update(task, advance=version_file.stat().st_size)
