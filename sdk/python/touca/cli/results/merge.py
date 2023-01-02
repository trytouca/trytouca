# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser
from pathlib import Path
from typing import List

from touca._client import serialize_messages
from touca._options import find_home_path
from touca.cli.common import CliCommand
from touca.cli.results.common import build_results_tree
from touca_fbs import MessageBuffer, Messages


def _merge_binary_files(binary_files: List[Path], dst_dir: Path):
    def _read_binary_file(path: Path) -> List[MessageBuffer]:
        messages = Messages.GetRootAs(path.read_bytes(), 0)
        return [messages.Messages(index) for index in range(messages.MessagesLength())]

    src_buffers = [
        item for chunk in map(_read_binary_file, binary_files) for item in chunk
    ]

    max_file_size = 10 * 1024 * 1024
    chunks: List[List[MessageBuffer]] = []
    index_i = 0
    index_j = 0
    while index_i < len(src_buffers):
        chunk_size = 0
        while index_i < len(src_buffers):
            message_size = src_buffers[index_i].BufLength()
            index_i = index_i + 1
            if max_file_size < chunk_size + message_size:
                break
            chunk_size += message_size
        chunks.append(src_buffers[index_j:index_i])
        index_j = index_i

    for index, chunk in enumerate(chunks):
        # possibly faster alternative that requires dependency on numpy:
        # items = [msg.BufAsNumpy().tobytes() for msg in chunk]
        items = [bytearray(msg.Buf(i) for i in range(msg.BufLength())) for msg in chunk]
        content = serialize_messages(items)
        file_name = f"touca.bin" if len(chunks) == 1 else f"touca.part{index + 1}.bin"
        dst_dir.mkdir(parents=True, exist_ok=True)
        dst_dir.joinpath(file_name).write_bytes(content)


class MergeCommand(CliCommand):
    name = "merge"
    help = "Merge local touca archive files"

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
            default=home_dir.joinpath("merged"),
            help=f"Directory with merged files. Defaults to {home_dir.joinpath('merged')}.",
        )

    def run(self):
        from rich.progress import Progress

        src_dir = Path(self.options.get("src_dir")).resolve()
        out_dir = Path(self.options.get("out_dir")).resolve()
        results_tree = build_results_tree(src_dir)
        for suite, versions in results_tree.items():
            with Progress() as progress:
                task_suite = progress.add_task(
                    f"[magenta]{suite}[/magenta]",
                    total=sum(len(files) for files in versions.values()),
                )
                for version, binary_files in versions.items():
                    dst_dir = out_dir.joinpath(suite, version, "merged")
                    if not dst_dir.exists():
                        _merge_binary_files(binary_files, dst_dir)
                    progress.update(task_suite, advance=len(binary_files))
