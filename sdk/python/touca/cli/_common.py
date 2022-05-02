# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from abc import ABC, abstractmethod


class Operation(ABC):
    @abstractmethod
    def run(self) -> bool:
        pass


def invalid_subcommand(cls):
    from argparse import ArgumentParser
    from sys import stderr

    parser = ArgumentParser(prog=f"touca {cls.name}", description=cls.help)
    cls.parser(parser)
    parser.print_help(file=stderr)
    return False


def run_cmd(cmd, file_out, file_err):
    import os
    from subprocess import Popen

    ensure_mkdir = lambda a: os.makedirs(
        os.path.abspath(os.path.join(a, os.pardir)), exist_ok=True
    )
    ensure_mkdir(file_out)
    ensure_mkdir(file_err)
    with open(file_out, "w") as out, open(file_err, "w") as err:
        proc = Popen(cmd, universal_newlines=True, stdout=out, stderr=err)
        code = proc.wait()
    return code
