# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from subprocess import Popen
from sys import stderr, stdout
from pathlib import Path
from argparse import ArgumentParser
from distutils.version import LooseVersion
from loguru import logger
from touca.cli._common import Operation


def _update(cli, srcDir: Path, outDir: Path, teamslug, testsuite):
    print(srcDir)
    srcDir = srcDir.with_name(srcDir.name + "-merged")
    if not srcDir.exists():
        logger.error(f"expected directory {srcDir} to exist")
        return False
    outDir.mkdir(parents=True, exist_ok=True)
    logger.info(f"updating result directory {srcDir}")
    cmd = [
        cli,
        "update",
        f"--src={srcDir}",
        f"--out={outDir}",
        f"--team={teamslug}",
        f"--suite={testsuite}",
    ]
    proc = Popen(cmd, universal_newlines=True, stdout=stdout, stderr=stderr)
    exit_status = proc.wait()
    if 0 != exit_status:
        logger.warning(f"failed to update {srcDir}")
        if exit_status is not None:
            logger.warning(f"program Touca Utils returned code {exit_status}")
        return False
    logger.info(f"updated {srcDir}")
    return True


class Update(Operation):
    name = "update"
    help = "Update metdata of binary archive files"

    def __init__(self, options: dict):
        self.__options = options

    @classmethod
    def parser(self, parser: ArgumentParser):
        parser.add_argument(
            "--src",
            help="path to directory with original Touca binary archives",
            required=True,
        )
        parser.add_argument(
            "--out",
            help="path to directory with updated Touca binary archives",
            required=True,
        )
        parser.add_argument(
            "--cli",
            help='path to "touca_cli" C++ executable',
            required=True,
        )
        parser.add_argument("--team", help="new value for the team slug")
        parser.add_argument("--suite", help="new value for the suite slug")

    def run(self):
        src = Path(self.__options.get("src")).expanduser().resolve()
        out = Path(self.__options.get("out")).expanduser().resolve()
        cli = Path(self.__options.get("cli")).expanduser().resolve()
        teamslug = self.__options.get("team")
        testsuite = self.__options.get("suite")

        if not src.exists():
            logger.error(f"directory {src} does not exist")
            return False
        batchNames = []
        for batchDir in src.glob("*"):
            print(batchDir)
            if not batchDir.is_dir():
                continue
            if not batchDir.name.endswith("-merged"):
                continue
            batchNames.append(batchDir.name[:-7])

        if not batchNames:
            logger.info(f"found no valid result directory to update")
            return True

        # sort list of versions lexicographically
        batchNames.sort(key=LooseVersion)

        logger.info(f"updating batches one by one")
        for batchName in batchNames:
            batchDir = src.joinpath(batchName)
            logger.info(f"updating {batchDir}")
            updated = _update(
                cli, batchDir, out.joinpath(batchName), teamslug, testsuite
            )
            if not updated:
                logger.error(f"failed to update {batchDir}")
                return False
        logger.info("updated all result directories")
        return True
