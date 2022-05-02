# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import math
from colorama import Style, Fore, Back, init

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
            "pass": ("PASS", Back.GREEN),
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

    def print_footer(self, stats, timer):
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
        self.print_line(
            "\n{:s} {:s}",
            "Tests:".ljust(int(math.log10(self.testcase_count)) + 11),
            ", ".join(messages),
        )
        self.print_line(
            "{:s} {:.2f} s",
            "Time:".ljust(int(math.log10(self.testcase_count)) + 11),
            timer.count("__workflow__") / 1000,
        )
