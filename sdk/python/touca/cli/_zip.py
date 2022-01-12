# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import os
from argparse import ArgumentParser, ArgumentTypeError

import py7zr
from loguru import logger
from touca.cli._operation import Operation


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
    def __init__(self, options: dict):
        self.__options = options

    def name(self) -> str:
        return "zip"

    def parser(self) -> ArgumentParser:
        parser = ArgumentParser()
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
        return parser

    def parse(self, args):
        parsed, _ = self.parser().parse_known_args(args)
        for key in ["src", "out"]:
            if key not in vars(parsed).keys() or vars(parsed).get(key) is None:
                raise ArgumentTypeError(f"missing key: {key}")
        self.__options = {**self.__options, **vars(parsed)}

    def run(self) -> bool:
        srcDir = os.path.abspath(os.path.expanduser(self.__options.get("src")))
        outDir = os.path.abspath(os.path.expanduser(self.__options.get("out")))
        if not os.path.exists(srcDir):
            logger.error(f"directory {srcDir} does not exist")
            return False
        for fselement in os.listdir(srcDir):
            fspath = os.path.join(srcDir, fselement)
            if not os.path.isdir(fspath):
                continue
            logger.debug(f"compressing {fspath}")
            if not os.path.exists(outDir):
                os.makedirs(outDir)
            if not compress7z(fspath, outDir):
                logger.error(f"failed to compress {fspath}")
                return False
            logger.info(f"compressed {srcDir}")
        logger.info("compressed all sub-directories")
        return True
