# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser

from touca.cli._common import Operation


class Solve(Operation):
    name = "solve"
    help = "Solve every problem (April 1st, 2022)"

    def __init__(self, options: dict):
        pass

    @classmethod
    def parser(self, parser: ArgumentParser):
        parser.add_argument("args", nargs="+", help="any problem")

    def run(self):
        print("Solved!")
        return True
