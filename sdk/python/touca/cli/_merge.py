# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import os
from argparse import ArgumentParser, ArgumentTypeError

from loguru import logger
from touca.cli._common import run_cmd
from touca.cli._operation import Operation


def utils_merge(touca_cli, logdir, srcDir, dstDir):
    if not os.path.exists(srcDir):
        logger.error(f"expected directory {srcDir} to exist")
        return False
    os.makedirs(dstDir)
    logger.info(f"merging result directory {srcDir} into {dstDir}")
    runCmd = [touca_cli, "merge", f"--src={srcDir}", f"--out={dstDir}"]
    dstDirName = os.path.basename(srcDir)
    file_out = os.path.join(logdir, dstDirName) + "-merge.log"
    exit_status = run_cmd(runCmd, file_out=file_out, file_err=file_out)
    if 0 != exit_status:
        logger.warning(f"failed to merge {srcDir}")
        if exit_status is not None:
            logger.warning(f"program Touca Utils returned code {exit_status}")
        return False
    return True


class Merge(Operation):
    def __init__(self, options: dict):
        self.__options = options

    def name(self) -> str:
        return "merge"

    def parser(self) -> ArgumentParser:
        parser = ArgumentParser()
        parser.add_argument(
            "--src",
            required=True,
            help="path to directory with original Touca archives directories",
        )
        parser.add_argument(
            "--out",
            required=True,
            help="path to directory where the merged archives should be created",
        )
        parser.add_argument(
            "--cli", required=True, help='path to "touca_cli" C++ executable'
        )
        parser.add_argument("--logdir", help="full path to log directory")
        return parser

    def parse(self, args):
        parsed, _ = self.parser().parse_known_args(args)
        for key in ["src", "out"]:
            if key not in vars(parsed).keys() or vars(parsed).get(key) is None:
                raise ArgumentTypeError(f"missing key: {key}")
        self.__options = {**self.__options, **vars(parsed)}

    def run(self) -> bool:
        inDir = os.path.expanduser(self.__options.get("src"))
        outDir = os.path.expanduser(self.__options.get("out"))

        if not os.path.exists(inDir):
            logger.error(f"directory {inDir} does not exist")
            return False
        if not os.path.exists(outDir):
            os.makedirs(outDir)
        for fselement in os.listdir(inDir):
            srcDir = os.path.join(inDir, fselement)
            if not os.path.isdir(srcDir):
                continue
            if srcDir.endswith("-merged"):
                continue
            dstDirName = os.path.basename(srcDir) + "-merged"
            dstDir = os.path.join(outDir, dstDirName)
            if os.path.exists(dstDir):
                continue
            logger.info(f"merging {srcDir}")
            if not utils_merge(
                self.__options.get("cli"), self.__options.get("logdir"), srcDir, dstDir
            ):
                logger.error(f"failed to merge {srcDir}")
                return False
            logger.info(f"merged {srcDir}")
        logger.info("merged all result directories")
        return True
