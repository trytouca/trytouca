# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import os
import time
from argparse import ArgumentParser
from distutils.version import LooseVersion

from loguru import logger
from touca._transport import Transport
from touca.cli._common import Operation


def utils_post(src_dir, api_key, api_url):
    src_dir += "-merged"
    if not os.path.exists(src_dir):
        logger.error(f"expected directory {src_dir} to exist")
        return False
    binaries = [
        os.path.join(root, filename)
        for root, _, filenames in os.walk(src_dir)
        for filename in filenames
        if filename.endswith(".bin")
    ]
    binaries.sort(key=LooseVersion)
    if not binaries:
        logger.warning(f"{src_dir} has no result files")
        return False
    logger.debug(f"posting files in {src_dir}")
    transport = Transport({"api-key": api_key, "api-url": api_url})
    transport.authenticate()
    for binary in binaries:
        logger.debug(f"posting {binary}")
        with open(binary, "rb") as file:
            content = file.read()
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
        parser.add_argument(
            "--src",
            required=True,
            help="path to directory with binary archive files",
        )
        parser.add_argument("--api-key", help="Touca API Key")
        parser.add_argument("--api-url", help="Touca API URL")

    def run(self):
        src_dir = os.path.abspath(os.path.expanduser(self.__options.get("src")))
        if not os.path.exists(src_dir):
            raise ValueError(f"directory {src_dir} does not exist")
        api_key = self.__options.get("api-key")
        api_url = self.__options.get("api-url")

        if not os.path.exists(src_dir):
            logger.error(f"directory {src_dir} does not exist")
            return False
        batchNames = []
        for batchName in os.listdir(src_dir):
            batchDir = os.path.join(src_dir, batchName)
            if not os.path.isdir(batchDir):
                continue
            if not batchDir.endswith("-merged"):
                continue
            batchNames.append(batchName[:-7])

        if not batchNames:
            logger.info(f"found no valid result directory to post")
            return True

        # sort list of versions lexicographically
        batchNames.sort(key=LooseVersion)

        logger.info(f"posting batches one by one")
        for batchName in batchNames:
            batchDir = os.path.join(src_dir, batchName)
            logger.info(f"posting {batchDir}")
            if not utils_post(batchDir, api_key, api_url):
                logger.error(f"failed to post {batchDir}")
                return False
            time.sleep(60)
        logger.info("posted all result directories")
        return True
