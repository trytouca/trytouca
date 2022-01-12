# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import os
import time
from argparse import ArgumentError, ArgumentParser
from distutils.version import LooseVersion

from loguru import logger
from touca._transport import Transport
from touca.cli._operation import Operation


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
    transport = Transport({"api_key": api_key, "api_url": api_url})
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
    def __init__(self, options: dict):
        self.__options = options

    def name(self) -> str:
        return "post"

    def parser(self) -> ArgumentParser:
        parser = ArgumentParser()
        parser.add_argument(
            "--src",
            required=True,
            help="path to directory with Touca binary archives",
        )
        parser.add_argument("--api-key", help="API Key provided by the Touca server")
        parser.add_argument("--api-url", help="API URL provided by the Touca server")
        return parser

    def parse(self, args):
        parsed, _ = self.parser().parse_known_args(args)
        for key in ["src", "api_key", "api_url"]:
            if key not in vars(parsed).keys() or vars(parsed).get(key) is None:
                raise ValueError(f"missing key: {key}")
        self.__options = {**self.__options, **vars(parsed)}
        src_dir = self.__options.get("src")
        if not os.path.exists(src_dir):
            raise ValueError(f"directory {src_dir} does not exist")

    def run(self) -> bool:
        src_dir = os.path.abspath(os.path.expanduser(self.__options.get("src")))
        api_key = self.__options.get("api_key")
        api_url = self.__options.get("api_url")

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
