# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path

from touca._options import find_home_path
from touca.cli.common import CliCommand
from touca.cli.results.common import build_results_tree

logger = logging.Logger("touca.cli.results.compress")


def compress(src_dir: Path, dst_file: Path, update=None):
    import tarfile

    if not src_dir.exists():
        raise RuntimeError(f'failed to compress "{src_dir}": directory is missing')
    if dst_file.exists():
        logger.debug(f"compressed file already exists: {dst_file}")
        return
    logger.info(f"compressing {src_dir} to {dst_file}")
    try:
        with tarfile.open(dst_file, "w:gz") as archive:
            for src_file in src_dir.rglob("*"):
                if update:
                    update(src_file.stat().st_size)
                archive.add(src_file, arcname=src_file.relative_to(src_dir))
    except Exception:
        raise RuntimeError(f'failed to compress "{src_dir}"')


class CompressCommand(CliCommand):
    name = "compress"
    help = "Compress touca archive files"

    @classmethod
    def parser(cls, parser: ArgumentParser):
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

    def run(self):
        from rich.progress import Progress

        src_dir = Path(self.options.get("src_dir")).resolve()
        out_dir = Path(self.options.get("out_dir")).resolve()
        results_tree = build_results_tree(src_dir)

        for suite_name, versions in results_tree.items():
            zip_dir = out_dir.joinpath(suite_name)
            zip_dir.mkdir(parents=True, exist_ok=True)
            for version_name, binary_files in versions.items():
                zip_file = zip_dir.joinpath(version_name + ".tar.gz")
                with Progress() as progress:
                    task_name = f"[magenta]{suite_name}/{version_name}[/magenta]"
                    version_size = sum(f.stat().st_size for f in binary_files)
                    task = progress.add_task(task_name, total=version_size)
                    version_dir = src_dir.joinpath(suite_name, version_name)
                    update = lambda x: progress.update(task, advance=x)
                    compress(version_dir, zip_file, update)
