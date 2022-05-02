# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import sys
from pathlib import Path
from argparse import ArgumentParser
from distutils.version import LooseVersion
from loguru import logger
from touca._transport import Transport
from touca.cli._common import Operation


def _post(src_dir: Path, transport: Transport):
    src_dir = src_dir.with_name(src_dir.name + "-merged")
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


class Post(Operation):
    name = "post"
    help = "Submit binary archive files to remote server"

    def __init__(self, options: dict):
        self.__options = options

    @classmethod
    def parser(self, parser: ArgumentParser):
        parser.add_argument("src", help="path to directory with binary files")
        parser.add_argument("--api-key", help="Touca API Key", dest="api-key")
        parser.add_argument("--api-url", help="Touca API URL", dest="api-url")

    def run(self):
        from touca._options import update_options

        options = {
            k: self.__options.get(k)
            for k in ["api-key", "api-url"]
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

        src_dir = Path(self.__options.get("src")).expanduser().resolve()
        if not src_dir.exists():
            logger.error(f"directory {src_dir} does not exist")
            return False

        batchNames = []
        for batch_dir in src_dir.glob("*"):
            if not batch_dir.is_dir():
                continue
            if not batch_dir.name.endswith("-merged"):
                continue
            batchNames.append(batch_dir.name[:-7])

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

        logger.info(f"posting batches one by one")
        for batchName in batchNames:
            batchDir = src_dir.joinpath(batchName)
            logger.info(f"posting {batchDir}")
            if not _post(batchDir, transport):
                logger.error(f"failed to post {batchDir}")
                return False
        logger.info("posted all result directories")
        return True
