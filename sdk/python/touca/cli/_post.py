# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from dataclasses import dataclass
import json
import logging
from argparse import ArgumentParser
from distutils.version import LooseVersion
from pathlib import Path
from typing import Dict, List

from rich.progress import Progress, TaskID
from touca._transport import Transport
from touca.cli._common import Operation
from touca._options import find_home_path

logger = logging.getLogger("touca.cli.post")


class ResultsTree:
    suites = {}

    def __init__(self, src: Path):
        if not src.exists():
            return
        if src.is_file():
            self._process(src)
            return
        for binary_file in src.rglob("*.bin"):
            self._process(binary_file)

    def process(self, operation):
        errors = {}
        with Progress() as progress:
            for suite_name, batches in self.suites.items():
                for batch_name, binary_files in batches.items():
                    task_name = f"[magenta]{suite_name}/{batch_name}[/magenta]"
                    task_batch = progress.add_task(task_name, total=len(binary_files))
                    for binary_file in binary_files:
                        error = operation(binary_file)
                        logger.debug(f"processed {binary_file}")
                        progress.update(task_batch, advance=1)
                        if not error:
                            continue
                        if error not in errors:
                            errors[error] = []
                        errors[error].append(binary_file)
        return errors

    def _process(self, binary_file: Path):
        batch_dir = binary_file.parent
        suite_dir = batch_dir.parent
        batch_name = batch_dir.name
        suite_name = suite_dir.name
        if suite_name not in self.suites:
            self.suites[suite_name] = {}
        if batch_name not in self.suites[suite_name]:
            self.suites[suite_name][batch_name] = []
        self.suites[suite_name][batch_name].append(binary_file)

    def is_empty(self):
        return len(self) == 0

    def __len__(self):
        return sum(sum(len(x) for x in bs.values()) for bs in self.suites.values())


class Post(Operation):
    name = "post"
    help = "Submit binary archives to a Touca server"

    def __init__(self, options: dict):
        self.__options = options
        self._transport: Transport = None

    @classmethod
    def parser(self, parser: ArgumentParser):
        results_dir = find_home_path().joinpath("results")
        parser.add_argument(
            "src",
            help=f"path to directory with binary files. defaults to {results_dir}",
            nargs="?",
            default=results_dir,
        )
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
        logging.disable(logging.INFO)
        self._update_options()

        if not self._setup_transport():
            return False

        src = Path(self.__options.get("src")).expanduser().resolve()
        results_tree = ResultsTree(src)
        if results_tree.is_empty():
            logger.error(f"Did not find any binary file in {src}")
            return False

        errors = results_tree.process(self._post)
        self._print_errors(errors)
        return not errors

    def _update_options(self):
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
            logger.error(err)
            return False
        self.__options.update(options)

    def _setup_transport(self):
        if self.__options.get("dry-run"):
            logger.warning("Running in dry-run mode")
            return True
        try:
            self._transport = Transport(
                {k: self.__options.get(k) for k in ["api-key", "api-url"]}
            )
            self._transport.authenticate()
        except ValueError as err:
            logger.error(err)
            return False
        return True

    def _post(self, binary_file: Path):
        if not self._transport:
            return None
        content = binary_file.read_bytes()
        response = self._transport._send_request(
            method="POST",
            path=f"/client/submit",
            body=content,
            content_type="application/octet-stream",
        )
        if response.status != 200 and response.data:
            body = json.loads(response.data.decode("utf-8"))
            return body["errors"][0]

    def _print_errors(self, errors: Dict[str, List[str]]):
        if not errors:
            return
        logger.error(f"Failed to post some binary files")
        for error, binary_files in errors.items():
            binary_files.sort()
            logger.error(f" {error}")
            for binary_file in binary_files:
                logger.error(f"  {binary_file}")
