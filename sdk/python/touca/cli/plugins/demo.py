# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

from touca.cli.common import CliCommand


class DownloadCommand(CliCommand):
    name = "download"
    help = "Downloads sample output of getting started tutorial"

    def run(self):
        from urllib.request import urlopen
        from pathlib import Path
        from tempfile import TemporaryDirectory
        from shutil import unpack_archive

        extract_dir = Path.cwd().joinpath("tutorial")
        if extract_dir.exists():
            raise RuntimeError("tutorial directory already exists")

        with urlopen("https://touca.io/docs/external/assets/tutorial.zip") as response:
            content = response.read()

        with TemporaryDirectory() as dirname:
            archive = Path(dirname).joinpath("tutorial.zip")
            archive.write_bytes(content)
            unpack_archive(archive, extract_dir, "zip")


class DemoCommand(CliCommand):
    name = "demo"
    help = "sample plugin for getting started tutorial"
    subcommands = [DownloadCommand]
