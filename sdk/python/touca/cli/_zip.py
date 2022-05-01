# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import os
from argparse import ArgumentParser, ArgumentTypeError

import py7zr
from loguru import logger
from touca.cli._common import Operation


def compress7z(srcDir, outputDir):
    dstFile = os.path.join(outputDir, os.path.basename(srcDir)) + ".7z"
    if os.path.exists(dstFile):
        logger.warning(f"compressed file {dstFile} already exists")
        return False
    logger.info(f"compressing {srcDir} into {dstFile}")
    try:
        with py7zr.SevenZipFile(dstFile, "w") as archive:
            archive.writeall(srcDir, arcname=os.path.basename(srcDir))
    except py7zr.ArchiveError as err:
        logger.warning(f"failed to compress {srcDir}")
        return False
    return True


class Zip(Operation):
    name = "zip"
    help = "Compress binary archive files"

    def __init__(self, options: dict):
        self.__options = options

    @classmethod
    def parser(self, parser: ArgumentParser):
        parser.add_argument(
            "--src",
            required=True,
            help="path to directory with original Touca binary archives",
        )
        parser.add_argument(
            "--out",
            required=True,
            help="path to directory with compressed Touca binary archives",
        )

    def run(self) -> bool:
        srcDir = os.path.abspath(os.path.expanduser(self.__options.get("src")))
        outDir = os.path.abspath(os.path.expanduser(self.__options.get("out")))
        if not os.path.exists(srcDir):
            logger.error(f"directory {srcDir} does not exist")
            return False
        for fs_element in os.listdir(srcDir):
            fs_path = os.path.join(srcDir, fs_element)
            if not os.path.isdir(fs_path):
                continue
            logger.debug(f"compressing {fs_path}")
            if not os.path.exists(outDir):
                os.makedirs(outDir)
            if not compress7z(fs_path, outDir):
                logger.error(f"failed to compress {fs_path}")
                return False
            logger.info(f"compressed {srcDir}")
        logger.info("compressed all sub-directories")
        return True
