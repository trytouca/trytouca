# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import math
from pathlib import Path
from typing import Dict

from rich.console import Console
from rich.theme import Theme

console = Console(theme=Theme(inherit=False))


class Printer:
    @staticmethod
    def print_warning(fmt: str, *args, **kwargs):
        console.print(f"[yellow]{fmt.format(*args, **kwargs)}[/]")

    @staticmethod
    def print_app_header():
        console.print("\nTouca Test Runner")

    @staticmethod
    def print_app_footer():
        console.print("\n:sparkles:   Ran all test suites.\n")

    def __init__(self, *, no_color: bool, testcase_width: int, testcase_count: int):
        console.no_color = no_color
        self.testcase_width = testcase_width
        self.testcase_count = testcase_count

    def print_line(self, fmt: str, *args, **kwargs):
        console.print(fmt.format(*args, **kwargs) if args or kwargs else fmt)

    def print_header(self, suite: str, version: str):
        self.print_line("\nSuite: {:s}/{:s}\n", suite, version)

    def print_progress(self, timer, testcase, idx, status, errors=[]):
        states = {
            "sent": "[green] SENT [/]",
            "pass": "[green] PASS [/]",
            "skip": "[yellow] SKIP [/]",
            "diff": "[yellow] DIFF [/]",
            "fail": "[red] FAIL [/]",
        }
        performance = (
            ""
            if status == "skip"
            else " [dim]({timer:d} ms)[/]".format(
                timer=timer.count(testcase),
            )
        )
        progress = " {number:>{width}d}[dim].[/]".format(
            number=idx + 1,
            width=int(math.log10(self.testcase_count)) + 1,
        )
        self.print_line(
            "{progress} {badge}  {testcase:<{testcase_width}s}{performance}",
            badge=states.get(status),
            progress=progress,
            testcase=testcase,
            testcase_width=self.testcase_width + 3,
            performance=performance,
        )
        if errors:
            self.print_line("\n   [dim]Exception Raised:[/]")
            self.print_line("\n".join(f"      - {error}\n" for error in errors))

    def print_footer(self, stats, timer, options) -> None:
        states: Dict[str, str] = {
            "sent": "[green]{} submitted[/]",
            "pass": "[green]{} perfect[/]",
            "skip": "[yellow]{} skipped[/]",
            "diff": "[yellow]{} different[/]",
            "fail": "[red]{} failed[/]",
        }
        messages = [
            v.format(stats.count(k)) for k, v in states.items() if stats.count(k)
        ]
        messages.append(f"{self.testcase_count} total")
        items = {
            "Tests": ", ".join(messages),
            "Time": "{:.2f} s".format(timer.count("__workflow__") / 1000),
        }
        if options.get("web_url"):
            link = "{web_url}/~/{team}/{suite}/{version}".format_map(options)
            items["Link"] = f"[link={link}]{link}[/link]"
        if any(map(options.get, ["save_binary", "save_json"])):
            value = Path(*map(options.get, ["output_directory", "suite", "version"]))
            items["Results"] = str(value)

        pad = int(math.log10(self.testcase_count)) + 11
        self.print_line("")
        for k, v in items.items():
            self.print_line("{key:<{pad}s} {value:s}", key=f"{k}:", pad=pad, value=v)


def print_table(table_header, table_body):
    from rich import box
    from rich.table import Table

    table = Table(show_header=True, header_style="cyan", box=box.SIMPLE)
    for k in table_header:
        table.add_column(k)
    for k in table_body:
        table.add_row(*k)
    console.print(table)
