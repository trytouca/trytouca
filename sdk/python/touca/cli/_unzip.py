# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import os
from argparse import ArgumentParser
import py7zr
from loguru import logger
from touca.cli._common import Operation


def extract7z(srcFile, dstDir):
    try:
        logger.info(f"extracting file {srcFile} into {dstDir}")
        with py7zr.SevenZipFile(srcFile, "r") as archive:
            archive.extractall(path=dstDir + "/")
    except Exception:
        logger.warning(f"failed to extract {srcFile}")
        return False
    return True


class Unzip(Operation):
    name = "unzip"
    help = "Extract compressed binary archive files"

    def __init__(self, options: dict):
        self.__options = options

    @classmethod
    def parser(self, parser: ArgumentParser):
        parser.add_argument(
            "--src",
            required=True,
            help="path to directory with compressed Touca binary archives",
        )
        parser.add_argument(
            "--out",
            required=True,
            help="path to directory with extracted Touca binary archives",
        )
        return parser

    def run(self):
        srcDir = os.path.abspath(os.path.expanduser(self.__options.get("src")))
        outDir = os.path.abspath(os.path.expanduser(self.__options.get("out")))
        if not os.path.exists(srcDir):
            logger.error(f"directory {srcDir} does not exist")
            return False
        for fs_element in os.listdir(srcDir):
            fs_path = os.path.join(srcDir, fs_element)
            if not py7zr.is_7zfile(fs_path):
                logger.debug(f"{fs_path} is not an archive file")
                continue
            dstDir = os.path.join(
                outDir, os.path.splitext(os.path.basename(fs_path))[0]
            )
            if os.path.exists(dstDir):
                logger.debug(f"unzipped directory already exists: {dstDir}")
                continue
            if not os.path.exists(outDir):
                os.makedirs(outDir)
            if not extract7z(fs_path, outDir):
                return False
            logger.info(f"extracted {fs_path}")
        logger.info("extracted all archives")
        return True
