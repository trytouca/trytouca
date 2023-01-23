# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from json import loads
from pathlib import Path
from typing import Dict, List

from rich.progress import Progress
from touca._options import (
    apply_api_url,
    apply_config_profile,
    apply_core_options,
    apply_environment_variables,
    authenticate,
    find_home_path,
)
from touca._transport import Transport
from touca.cli.common import CliCommand
from touca.cli.results.common import build_results_tree

logger = logging.Logger("touca.cli.results.post")


def _post_binary_file(transport: Transport, binary_file: Path):
    content = binary_file.read_bytes()
    response = transport.request(
        method="POST",
        path=f"/client/submit",
        body=content,
        content_type="application/octet-stream",
    )
    if response.status != 200 and response.data:
        body = loads(response.data.decode("utf-8"))
        return body["errors"][0]


def _post_binary_files(transport: Transport, results_tree):
    errors: Dict[str, List[Path]] = {}
    for suite_name, batches in results_tree.items():
        for batch_name, binary_files in batches.items():
            with Progress() as progress:
                task_name = f"[magenta]{suite_name}/{batch_name}[/magenta]"
                task_batch = progress.add_task(task_name, total=len(binary_files))
                for binary_file in binary_files:
                    error = _post_binary_file(transport, binary_file)
                    logger.debug(f"processed {binary_file}")
                    progress.update(task_batch, advance=1)
                    if not error:
                        continue
                    if error not in errors:
                        errors[error] = []
                    errors[error].append(binary_file)
    return errors


def _post_print_errors(errors: Dict[str, List[str]]):
    for error, binary_files in errors.items():
        binary_files.sort()
        logger.error(f" {error}")
        for binary_file in binary_files:
            logger.error(f"  {binary_file}")


class PostCommand(CliCommand):
    name = "post"
    help = "Submit binary archives to a Touca server"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        home_dir = find_home_path()
        parser.add_argument(
            "src_dir",
            nargs="?",
            default=home_dir.joinpath("results"),
            help=f"Directory with binary files. defaults to {home_dir.joinpath('results')}",
        )
        cred = parser.add_argument_group(
            "Credentials",
            'Server API Key and URL. Not required when specified in the active configuration profile. Ignored when "--dry-run" is specified.',
        )
        cred.add_argument(
            "--api-key", dest="api_key", help="Touca API Key", required=False
        )
        cred.add_argument(
            "--api-url", dest="api_url", help="Touca API URL", required=False
        )
        misc = parser.add_argument_group("Other")
        misc.add_argument(
            "--dry-run",
            action="store_true",
            dest="dry_run",
            help="Check what your command would do when run without this option",
        )

    def run(self):
        transport = Transport()
        src_dir = Path(self.options.get("src_dir")).resolve()
        options = {
            k: self.options.get(k)
            for k in ["api_key", "api_url"]
            if self.options.get(k)
        }
        options["offline"] = False

        apply_config_profile(options)
        apply_environment_variables(options)
        apply_api_url(options)
        apply_core_options(options)
        authenticate(options, transport)

        results_tree = build_results_tree(src_dir)
        errors = _post_binary_files(transport, results_tree)
        if errors:
            _post_print_errors(errors)
            raise RuntimeError(f"Failed to post some binary files.")
