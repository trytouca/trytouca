# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser

from touca.cli.common import CliCommand


class DownloadCommand(CliCommand):
    name = "download"
    help = "Downloads sample output of getting started tutorial"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument("version", help="version", choices=["v1.0", "v1.1"])

    def run(self):
        from pathlib import Path
        from shutil import unpack_archive
        from tempfile import TemporaryDirectory
        from urllib.request import urlopen

        version = self.options.get("version")
        extract_dir = Path.cwd().joinpath("tutorial", version)
        if extract_dir.exists():
            raise RuntimeError("tutorial directory already exists")

        with urlopen(
            f"https://touca.io/docs/external/assets/tutorial/{version}.zip"
        ) as response:
            content = response.read()

        with TemporaryDirectory() as dirname:
            archive = Path(dirname).joinpath("tutorial.zip")
            archive.write_bytes(content)
            unpack_archive(archive, extract_dir, "zip")


class DemoCommand(CliCommand):
    name = "demo"
    help = "sample plugin for getting started tutorial"
    subcommands = [DownloadCommand]
