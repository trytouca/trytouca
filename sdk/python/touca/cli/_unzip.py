# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser
from pathlib import Path
import py7zr
from loguru import logger
from touca.cli._common import Operation


def _extract(src, dst):
    try:
        logger.info(f"extracting file {src} into {dst}")
        with py7zr.SevenZipFile(src, "r") as archive:
            archive.extractall(path=dst)
    except Exception:
        logger.warning(f"failed to extract {src}")
        return False
    return True


class Unzip(Operation):
    name = "unzip"
    help = "Extract compressed binary archive files"

    def __init__(self, options: dict):
        self.__options = options

    @classmethod
    def parser(self, parser: ArgumentParser):
        parser.add_argument("src", help="directory with compressed files")
        parser.add_argument("out", help="directory to extract binary files into")

    def run(self):
        src = Path(self.__options.get("src")).expanduser().resolve()
        out = Path(self.__options.get("out")).expanduser().resolve()

        if not src.exists():
            logger.error(f"directory {src} does not exist")
            return False
        for src_dir in src.glob("*"):
            if not py7zr.is_7zfile(src_dir):
                logger.debug(f"{src_dir} is not an archive file")
                continue
            dstDir = out.joinpath(src_dir.stem)
            if dstDir.exists():
                logger.debug(f"unzipped directory already exists: {dstDir}")
                continue
            out.mkdir(parents=True, exist_ok=True)
            if not _extract(src_dir, out):
                return False
            logger.info(f"extracted {src_dir}")
        logger.info("extracted all archives")
        return True
