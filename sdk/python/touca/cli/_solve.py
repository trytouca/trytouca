# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser

from touca.cli._operation import Operation


class Solve(Operation):
    name = "solve"

    def __init__(self, options: dict):
        pass

    def parser(self):
        return ArgumentParser()

    def parse(self, args):
        parsed, _ = self.parser().parse_known_args(args)
        parsed = vars(parsed)

    def run(self) -> bool:
        print("Solved!")
        return True
