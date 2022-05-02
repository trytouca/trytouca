# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from sys import stderr, stdout
from pathlib import Path
from argparse import ArgumentParser
from loguru import logger
from touca.cli._common import Operation


def _merge(touca_cli: Path, dir_src: Path, dir_dst: Path):
    from subprocess import Popen

    if not dir_src.exists():
        logger.error(f"expected directory {dir_src} to exist")
        return False
    dir_dst.mkdir(parents=True, exist_ok=True)
    logger.info(f"merging result directory {dir_src} into {dir_dst}")
    cmd = [touca_cli, "merge", f"--src={dir_src}", f"--out={dir_dst}"]
    proc = Popen(cmd, universal_newlines=True, stdout=stdout, stderr=stderr)
    exit_status = proc.wait()
    if 0 != exit_status:
        logger.warning(f"failed to merge {dir_src}")
        if exit_status is not None:
            logger.warning(f"touca_cli returned code {exit_status}")
        return False
    return True


class Merge(Operation):
    name = "merge"
    help = "Merge binary archive files"

    def __init__(self, options: dict):
        self.__options = options

    @classmethod
    def parser(self, parser: ArgumentParser):
        parser.add_argument(
            "--src",
            help="path to directory with original Touca archives directories",
            required=True,
        )
        parser.add_argument(
            "--out",
            help="path to directory where the merged archives should be created",
            required=True,
        )
        parser.add_argument(
            "--cli",
            help='path to "touca_cli" C++ executable',
            required=True,
        )

    def run(self):
        src = Path(self.__options.get("src")).expanduser().resolve()
        out = Path(self.__options.get("out")).expanduser().resolve()
        cli = Path(self.__options.get("cli")).expanduser().resolve()

        if not src.exists():
            logger.error(f"directory {src} does not exist")
            return False
        if not out.exists():
            out.mkdir(parents=True, exist_ok=True)

        for dir_src in src.glob("*"):
            if not dir_src.is_dir():
                continue
            if dir_src.name.endswith("-merged"):
                continue
            dir_dst = out.joinpath(dir_src.name + "-merged")
            if dir_dst.exists():
                continue
            logger.info(f"merging {dir_src}")
            if not _merge(cli, dir_src, dir_dst):
                logger.error(f"failed to merge {dir_src}")
                return False
            logger.info(f"merged {dir_src}")
        logger.info("merged all result directories")
        return True
