# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import math
from pathlib import Path
from typing import Dict, List, Optional, Union

from colorama import Back, Fore, Style, init
from rich.tree import Tree

init()


class Printer:
    def print_warning(fmt: str, *args, **kwargs):
        print(f"{Fore.YELLOW}{fmt.format(*args, **kwargs)}{Fore.RESET}")

    def print_error(fmt: str, *args, **kwargs):
        import sys

        print(f"{Fore.RED}{fmt.format(*args, **kwargs)}{Fore.RESET}", file=sys.stderr)

    def print_app_header():
        print("\nTouca Test Framework")

    def print_app_footer():
        print("\n✨   Ran all test suites.\n")

    def __init__(self, options):
        self.options = options
        self.testcase_width = max(len(k) for k in options.get("testcases"))
        self.testcase_count = len(options.get("testcases"))

    def print_line(self, fmt: str, *args, **kwargs):
        msg = fmt.format(*args, **kwargs) if args or kwargs else fmt
        if self.options.get("colored-output"):
            print(msg)
            return

        import re

        line = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])").sub("", msg)
        print(line)

    def print_header(self):
        revision = "/".join([self.options.get(k) for k in ["suite", "version"]])
        self.print_line("\nSuite: {:s}\n", revision)

    def print_progress(self, timer, testcase, idx, status, errors=[]):
        states = {
            "pass": ("SENT", Back.GREEN),
            "skip": ("SKIP", Back.YELLOW),
            "fail": ("FAIL", Back.RED),
        }
        performance = (
            ""
            if status == "skip"
            else " {dim}({timer:d} ms){reset}".format(
                dim=Style.DIM,
                reset=Style.NORMAL,
                timer=timer.count(testcase),
            )
        )
        progress = " {number:>{width}d}{dim}.{reset}".format(
            dim=Style.DIM,
            reset=Style.NORMAL,
            number=idx + 1,
            count=self.testcase_count,
            width=int(math.log10(self.testcase_count)) + 1,
        )
        badge = "{bg_color} {text} {bg_reset}".format(
            bg_color=states.get(status)[1],
            bg_reset=Back.RESET,
            text=states.get(status)[0],
        )
        self.print_line(
            "{progress} {badge}  {testcase:<{testcase_width}s}{performance}",
            badge=badge,
            progress=progress,
            testcase=testcase,
            testcase_width=self.testcase_width + 3,
            performance=performance,
        )
        if errors:
            self.print_line("\n   {}Exception Raised:{}", Style.DIM, Style.NORMAL)
            self.print_line("\n".join(f"      - {error}\n" for error in errors))

    def print_footer(self, stats, timer, options):
        states = [
            ("pass", "passed", Fore.GREEN),
            ("skip", "skipped", Fore.YELLOW),
            ("fail", "failed", Fore.RED),
        ]
        messages = []
        for state in states:
            if not stats.count(state[0]):
                continue
            messages.append(f"{state[2]}{stats.count(state[0])} {state[1]}{Fore.RESET}")
        messages.append(f"{self.testcase_count} total")
        left_pad = int(math.log10(self.testcase_count)) + 11
        self.print_line("\n{:s} {:s}", "Tests:".ljust(left_pad), ", ".join(messages))
        self.print_line(
            "{:s} {:.2f} s", "Time:".ljust(left_pad), timer.count("__workflow__") / 1000
        )
        if any(map(options.get, ["save-as-binary", "save-as-json"])):
            results_dir = Path(
                *map(options.get, ["output-directory", "suite", "version"])
            )
            self.print_line("{:s} {}", "Results:".ljust(left_pad), results_dir)


def print_table(table_header, table_body):
    from rich import box
    from rich.console import Console
    from rich.table import Table

    console = Console()
    table = Table(show_header=True, header_style="cyan", box=box.SIMPLE)
    for k in table_header:
        table.add_column(k)
    for k in table_body:
        table.add_row(*k)
    console.print(table)


def _create_tree(
    body: Union[Dict, List, str],
    head_tree: Optional[Tree] = None,
    label: Union[str, None] = None,
) -> Tree:
    """This is a helper function for create trees by
    a body(include a dict/list/str) and label(str/None).

    if _create_tree called, then this func will be checking the
    body has a dict or list, then creates a child_tree and calls
    again _create_tree, this procces repeats until body is a str.
    """

    if head_tree is None:
        head_tree = Tree(label)

    if isinstance(body, list):
        for obj in body:
            if isinstance(obj, str):
                head_tree.add(obj)
            elif isinstance(obj, dict):
                _create_tree(body=obj, head_tree=head_tree)
            else:
                raise TypeError  # we are sure list only has dict or str
        return head_tree
    elif isinstance(body, dict):
        for k, v in body.items():
            child_tree = head_tree.add(k)
            if isinstance(v, str):
                child_tree.add(str)
            elif isinstance(v, list) or isinstance(v, dict):
                _create_tree(body=v, head_tree=child_tree)
            else:
                raise TypeError
        return child_tree
    elif isinstance(body, str):
        head_tree.add(body)

    return head_tree


def print_tree(body: Dict, label: str) -> None:
    from rich import print as rich_print

    tree = _create_tree(body=body, label=label)
    rich_print(tree)
