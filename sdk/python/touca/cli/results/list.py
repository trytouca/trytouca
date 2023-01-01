# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser

from rich import print
from rich.style import Style
from rich.tree import Tree
from touca._options import find_home_path
from touca.cli.common import CliCommand
from touca.cli.results.common import build_results_tree


class ListCommand(CliCommand):
    name = "ls"
    help = "List local touca archive files"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        home_dir = find_home_path()
        parser.add_argument(
            "--src-dir",
            dest="src_dir",
            default=home_dir.joinpath("results"),
            help=f"Path to test results directory. Defaults to {home_dir.joinpath('results')}.",
        )
        parser.add_argument(
            "--filter",
            default=None,
            help="Limit results to a given suite or version. Value should be in form of suite[/version].",
        )

    def run(self):
        filter = self.options.get("filter", None)
        src_dir = self.options.get("src_dir")
        results_tree = build_results_tree(src_dir, filter, empty_ok=True)
        tree = Tree("🗃")
        for suite, versions in results_tree.items():
            suite_tree = tree.add(suite, style=Style(color="magenta", bold=True))
            for version, files in versions.items():
                versions_tree = suite_tree.add(
                    version, style=Style(color="blue", bold=False)
                )
                versions_tree.add(f"{len(files)} binary files", style="white")
        print(tree)
