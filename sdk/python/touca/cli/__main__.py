# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser
import sys

from loguru import logger
from touca import __version__
from touca._options import find_home_path
from touca._printer import Printer
from touca.cli._config import Config
from touca.cli._execute import Execute
from touca.cli._merge import Merge
from touca.cli._profile import Profile
from touca.cli._post import Post
from touca.cli._run import Run
from touca.cli._solve import Solve
from touca.cli._unzip import Unzip
from touca.cli._update import Update
from touca.cli._zip import Zip


def _find_latest_pypi_version():
    from json import loads
    from urllib.request import urlopen

    with urlopen("https://pypi.org/pypi/touca/json") as response:
        data = loads(response.read())
        return data["info"]["version"]


def _warn_outdated_version():
    from packaging import version

    latest_version = _find_latest_pypi_version()
    if version.parse(latest_version) <= version.parse(__version__):
        return
    fmt = (
        "You are using touca version {}; however, version {} is available."
        + "\nConsider upgrading by running 'pip install --upgrade touca'."
    )
    Printer.print_warning(fmt, __version__, latest_version)


def main(args=None):
    operations = [Config, Merge, Post, Profile, Run, Solve, Execute, Unzip, Update, Zip]
    parser = ArgumentParser(
        prog="touca",
        add_help=False,
        description="Work seamlessly with Touca from the command line.",
        epilog="See https://touca.io/docs for more information.",
    )
    parser.add_argument(
        "-v", "--version", action="version", version=f"%(prog)s v{__version__}"
    )
    parsers = parser.add_subparsers(dest="command")
    for operation in operations:
        subparser = parsers.add_parser(
            name=operation.name,
            prog=f"touca {operation.name}",
            description=operation.help,
            help=operation.help,
            add_help=True,
        )
        operation.parser(subparser)
    parsed, remaining = parser.parse_known_args(sys.argv[1:] if args is None else args)
    options = vars(parsed)

    command = next((x for x in operations if x.name == options.get("command")), None)
    if not command and any(arg in remaining for arg in ["-h", "--help"]):
        parser.print_help()
        return False
    operation = command(options) if command else Execute(options)

    home_dir = find_home_path()
    home_dir.mkdir(parents=True, exist_ok=True)

    logger.remove()
    logger.add(
        sys.stdout,
        level="DEBUG",
        colorize=True,
        format="<green>{time:HH:mm:ss!UTC}</green> | <cyan>{level: <7}</cyan> | <lvl>{message}</lvl>",
    )
    logger.add(
        home_dir.joinpath("logs", "runner_{time:YYMMDD!UTC}.log"),
        level="DEBUG",
        rotation="1 day",
        compression="zip",
    )

    if not operation.run():
        return True

    _warn_outdated_version()
    return False


if __name__ == "__main__":
    sys.exit(main())
