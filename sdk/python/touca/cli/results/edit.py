# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path

from flatbuffers import Builder
from touca._client import serialize_messages
from touca._options import find_home_path
from touca.cli.common import CliCommand
from touca.cli.results.common import build_results_tree
from touca_fbs import Messages, MessageT

logger = logging.Logger("touca.cli.results.edit")


def _edit_binary_file(binary_file: Path, dst_file: Path, options: dict):
    messages = Messages.GetRootAs(binary_file.read_bytes(), 0)
    items = []
    for index in range(messages.MessagesLength()):
        message = MessageT.InitFromObj(messages.Messages(index).BufNestedRoot())
        if "team" in options:
            message.metadata.teamslug = options.get("team")
        if "suite" in options:
            message.metadata.testsuite = options.get("suite")
        builder = Builder()
        fbs_message = message.Pack(builder)
        builder.Finish(fbs_message)
        items.append(builder.Output())
    content = serialize_messages(items)
    dst_file.parent.mkdir(parents=True, exist_ok=True)
    dst_file.write_bytes(content)


class EditCommand(CliCommand):
    name = "edit"
    help = "Edit metadata of touca archive files"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        home_dir = find_home_path()
        parser.add_argument(
            "src_dir",
            nargs="?",
            default=home_dir.joinpath("results"),
            help=f"Directory with with binary files. Defaults to {home_dir.joinpath('results')}.",
        )
        parser.add_argument(
            "out_dir",
            nargs="?",
            default=home_dir.joinpath("modified"),
            help=f"Directory with modified files. Defaults to {home_dir.joinpath('modified')}.",
        )
        parser.add_argument(
            "--filter",
            default=None,
            help="Limit results to a given suite or version. Value should be in form of suite[/version].",
        )
        parser.add_argument("--team", help="new value for the team slug")
        parser.add_argument("--suite", help="new value for the suite slug")
        parser.add_argument("--version", help="new value for the version slug")

    def run(self):
        from rich.progress import Progress

        src_dir = Path(self.options.get("src_dir")).resolve()
        out_dir = Path(self.options.get("out_dir")).resolve()
        filter = self.options.get("filter", None)
        options = {
            k: self.options.get(k)
            for k in ["team", "suite", "version"]
            if self.options.get(k)
        }
        if not options:
            logger.error("nothing to do")
            return False
        results_tree = build_results_tree(src_dir, filter)
        for suite, versions in results_tree.items():
            for version, binary_files in versions.items():
                with Progress() as progress:
                    task_batch = progress.add_task(
                        f"[magenta]{suite}/{version}[/magenta]",
                        total=len(binary_files),
                    )
                    for binary_file in binary_files:
                        dst_file = out_dir.joinpath(
                            options.get("suite", suite),
                            options.get("version", version),
                            binary_file.parent.name,
                            binary_file.name,
                        )
                        if not dst_file.exists():
                            _edit_binary_file(binary_file, dst_file, options)
                        progress.update(task_batch, advance=1)
