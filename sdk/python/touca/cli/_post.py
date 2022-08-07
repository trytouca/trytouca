# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
import sys
from argparse import ArgumentParser
from distutils.version import LooseVersion
from pathlib import Path

from touca._transport import Transport
from touca.cli._common import Operation

logger = logging.getLogger("touca.cli.post")


def _post(src_dir: Path, transport: Transport = None, dry_run=False):
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
    logger.debug(f"posting {src_dir}")
    for binary in binaries:
        logger.debug(f"posting {binary.relative_to(src_dir)}")
        if dry_run:
            continue
        content = binary.read_bytes()
        transport._send_request(
            method="POST",
            path=f"/client/submit",
            body=content,
            content_type="application/octet-stream",
        )
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
        group_credentials = parser.add_argument_group(
            "Credentials",
            'Server API Key and URL. Not required when specified in the active configuration profile. Ignored when "--dry-run" is specified.',
        )
        group_credentials.add_argument(
            "--api-key", dest="api-key", help="Touca API Key", required=False
        )
        group_credentials.add_argument(
            "--api-url", dest="api-url", help="Touca API URL", required=False
        )
        group_misc = parser.add_argument_group("Miscellaneous")
        group_misc.add_argument(
            "--dry-run",
            action="store_true",
            dest="dry-run",
            help="Check what your command would do when run without this option",
        )

    def run(self):
        from touca._options import _apply_config_file, update_options

        options = {
            k: self.__options.get(k)
            for k in ["api-key", "api-url", "dry-run"]
            if self.__options.get(k) is not None
        }
        options.update({"suite": "", "version": ""})

        _apply_config_file(options)
        if "team" in options and "api-url" not in options:
            options["api-url"] = "https://api.touca.io"

        try:
            update_options(options, options)
        except ValueError as err:
            print(err, file=sys.stderr)
            return False

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
        logger.info(f"preparing to submit {len(batchNames)} versions")

        # sort list of versions lexicographically
        batchNames.sort(key=LooseVersion)

        if options.get("dry-run"):
            logger.warning("dry-run mode is enabled")
            for batchName in batchNames:
                batchDir = src_dir.joinpath(batchName)
                _post(batchDir, dry_run=True)
            return True

        transport = Transport({k: options.get(k) for k in ["api-key", "api-url"]})
        try:
            transport.authenticate()
        except ValueError as err:
            print(err, file=sys.stderr)
            return False

        for batchName in batchNames:
            batchDir = src_dir.joinpath(batchName)
            if not _post(batchDir, transport):
                logger.error(f"failed to post {batchDir}")
                return False
        logger.info("all test results submitted successfully")

        return True
