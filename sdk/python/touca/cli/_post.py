# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import sys
from pathlib import Path
from argparse import ArgumentParser
from distutils.version import LooseVersion
from loguru import logger
from touca._transport import Transport
from touca.cli._common import Operation


def _post(src_dir: Path, transport: Transport):
    src_dir = src_dir.with_name(src_dir.name)
    src_dir = (
        src_dir if src_dir.exists() else src_dir.with_name(src_dir.name + "-merged")
    )
    if not src_dir.exists():
        logger.error(f"expected directory {src_dir} to exist")
        return False
    binaries = list(src_dir.rglob("**/*.bin"))
    if not binaries:
        logger.warning(f"{src_dir} has no result files")
        return False
    logger.debug(f"posting files in {src_dir}")
    for binary in binaries:
        logger.debug(f"posting {binary}")
        content = binary.read_bytes()
        transport._send_request(
            method="POST",
            path=f"/client/submit",
            body=content,
            content_type="application/octet-stream",
        )
        logger.debug(f"posted {binary}")
    logger.info(f"posted {src_dir}")
    return True


def dry_run_post(src_dir: Path, batchNames: Path):
    logger.info(f"dry run is enabled")
    for batchName in batchNames:
        batchDir = src_dir.joinpath(batchName)
        batchDir = batchDir.with_name(batchDir.name)
        batchDir = (
            batchDir
            if batchDir.exists()
            else batchDir.with_name(batchDir.name + "-merged")
        )
        if not batchDir.exists():
            logger.error(f"expected directory {batchDir} to exist")
            return False
        binaries = list(batchDir.rglob("**/*.bin"))
        if not binaries:
            logger.warning(f"{batchDir} has no result files")
            return False
        for binary in binaries:
            logger.debug(f"{binary}")
    return True


class Post(Operation):
    name = "post"
    help = "Submit binary archive files to remote server"

    def __init__(self, options: dict):
        self.__options = options

    @classmethod
    def parser(self, parser: ArgumentParser):
        parser.add_argument("src", help="path to directory with binary files")
        parser.add_argument(
            "--api-key", help="Touca API Key", dest="api-key", required=False
        )
        parser.add_argument(
            "--api-url", help="Touca API URL", dest="api-url", required=False
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="See what files would be posted",
            dest="dry-run",
        )

    def run(self):
        from touca._options import update_options

        options = {
            k: self.__options.get(k)
            for k in ["api-key", "api-url", "dry-run"]
            if self.__options.get(k) is not None
        }
        options.update({"suite": "", "team": "", "version": ""})

        try:
            update_options(options, options)
        except ValueError as err:
            print(err, file=sys.stderr)
            return False

        api_key = options.get("api-key")
        api_url = options.get("api-url")
        dry_run = options.get("dry-run")
        src_dir = Path(self.__options.get("src")).expanduser().resolve()
        if not src_dir.exists():
            logger.error(f"directory {src_dir} does not exist")
            return False

        batchNames = []
        for batch_dir in src_dir.glob("*"):
            if not batch_dir.is_dir():
                continue
            batchNames.append(
                batch_dir.name[:-7]
                if batch_dir.name.endswith("-merged")
                else batch_dir.name
            )

        if not batchNames:
            logger.info(f"found no valid result directory to post")
            return True

        # sort list of versions lexicographically
        batchNames.sort(key=LooseVersion)

        transport = Transport({"api-key": api_key, "api-url": api_url})
        try:
            transport.authenticate()
        except ValueError as err:
            print(err, file=sys.stderr)
            return False

        if dry_run:
            return dry_run_post(src_dir, batchNames)

        logger.info(f"posting batches one by one")
        for batchName in batchNames:
            batchDir = src_dir.joinpath(batchName)
            logger.info(f"posting {batchDir}")
            if not _post(batchDir, transport):
                logger.error(f"failed to post {batchDir}")
                return False
        logger.info("posted all result directories")

        return True
