# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.


import os
from argparse import ArgumentParser, ArgumentTypeError
from distutils.version import LooseVersion

from loguru import logger
from touca.cli._common import run_cmd
from touca.cli._operation import Operation


def utils_update(touca_cli, srcDir, outDir, teamslug, testsuite, logdir):
    srcDir += "-merged"
    if not os.path.exists(srcDir):
        logger.error(f"expected directory {srcDir} to exist")
        return False
    if not os.path.exists(outDir):
        os.makedirs(outDir)
    logger.info(f"updating result directory {srcDir}")
    runCmd = [
        touca_cli,
        "update",
        f"--src={srcDir}",
        f"--out={outDir}",
        f"--team={teamslug}",
        f"--suite={testsuite}",
    ]
    logger.info("running {}", " ".join(runCmd))
    dstDirName = os.path.basename(srcDir)
    file_out = os.path.join(logdir, dstDirName) + "-update.log"
    exit_status = run_cmd(runCmd, file_out=file_out, file_err=file_out)
    if 0 != exit_status:
        logger.warning(f"failed to update {srcDir}")
        if exit_status is not None:
            logger.warning(f"program Touca Utils returned code {exit_status}")
        return False
    logger.info(f"updateed {srcDir}")
    return True


class Update(Operation):
    def __init__(self, options: dict):
        self.__options = options

    def name(self) -> str:
        return "update"

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
            help="path to directory with updated Touca binary archives",
        )
        parser.add_argument("--team", help="new value for the team slug")
        parser.add_argument("--suite", help="new value for the suite slug")
        parser.add_argument(
            "--cli", required=True, help='path to "touca_cli" C++ executable'
        )
        parser.add_argument("--logdir", help="full path to a directory")
        return parser

    def parse(self, args):
        parsed, _ = self.parser().parse_known_args(args)
        for key in ["src", "out", "team", "suite", "cli", "logdir"]:
            if key not in vars(parsed).keys() or vars(parsed).get(key) is None:
                raise ArgumentTypeError(f"missing key: {key}")
        self.__options = {**self.__options, **vars(parsed)}

    def run(self) -> bool:
        srcDir = os.path.abspath(os.path.expanduser(self.__options.get("src")))
        outDir = os.path.abspath(os.path.expanduser(self.__options.get("out")))
        teamslug = self.__options.get("team")
        testsuite = self.__options.get("suite")

        if not os.path.exists(srcDir):
            logger.error(f"directory {srcDir} does not exist")
            return False
        batchNames = []
        for batchName in os.listdir(srcDir):
            batchDir = os.path.join(srcDir, batchName)
            if not os.path.isdir(batchDir):
                continue
            if not batchDir.endswith("-merged"):
                continue
            batchNames.append(batchName[:-7])

        if not batchNames:
            logger.info(f"found no valid result directory to update")
            return True

        # sort list of versions lexicographically
        batchNames.sort(key=LooseVersion)

        logger.info(f"updateing batches one by one")
        for batchName in batchNames:
            batchDir = os.path.join(srcDir, batchName)
            logger.info(f"updateing {batchDir}")
            if not utils_update(
                self.__options.get("cli"),
                batchDir,
                os.path.join(outDir, batchName),
                teamslug,
                testsuite,
                self.__options.get("logdir"),
            ):
                logger.error(f"failed to update {batchDir}")
                return False
        logger.info("updated all result directories")
        return True
