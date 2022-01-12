# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import os
from argparse import ArgumentParser, ArgumentTypeError

import py7zr
from loguru import logger
from touca.cli._operation import Operation


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
    def __init__(self, options: dict):
        self.__options = options

    def name(self) -> str:
        return "unzip"

    def parser(self) -> ArgumentParser:
        parser = ArgumentParser()
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
            if not py7zr.is_7zfile(fspath):
                logger.debug(f"{fspath} is not an archive file")
                continue
            dstDir = os.path.join(outDir, os.path.splitext(os.path.basename(fspath))[0])
            if os.path.exists(dstDir):
                logger.debug(f"unzipped directory already exists: {dstDir}")
                continue
            if not os.path.exists(outDir):
                os.makedirs(outDir)
            if not extract7z(fspath, outDir):
                return False
            logger.info(f"extracted {fspath}")
        logger.info("extracted all archives")
        return True
