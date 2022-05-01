# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import argparse
import os
import sys

from loguru import logger
from touca import __version__
from touca._options import config_file_home
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
    operations = [Config, Execute, Merge, Post, Profile, Run, Solve, Unzip, Update, Zip]
    parser = argparse.ArgumentParser(
        add_help=False,
        description="Work seamlessly with Touca from the command line.",
        epilog="See https://touca.io/docs for more information.",
    )
    parser.add_argument(
        "-v", "--version", action="version", version=f"%(prog)s v{__version__}"
    )
    parser.add_argument(
        "command",
        nargs="?",
        choices=[x.name for x in operations],
        help="one of " + ", ".join([x.name for x in operations]),
        metavar="command",
    )
    parsed, remaining = parser.parse_known_args(sys.argv[1:] if args is None else args)
    options = vars(parsed)

    command = next((x for x in operations if x.name == options.get("command")), None)
    if not command and any(arg in remaining for arg in ["-h", "--help"]):
        parser.print_help()
        return True
    operation = command(options) if command else Execute(options)

    try:
        operation.parse(remaining)
    except Exception as err:
        Printer.print_error(str(err))
        operation.parser().print_help()
        return False

    if "touca-utils" in options.keys():
        if not os.path.exists(options.get("touca-utils")):
            logger.error(f"touca utils application does not exist")
            return False

    config_dir = config_file_home()
    os.makedirs(config_dir, exist_ok=True)

    # configure logger

    logger.remove()
    logger.add(
        sys.stdout,
        level="DEBUG",
        colorize=True,
        format="<green>{time:HH:mm:ss!UTC}</green> | <cyan>{level: <7}</cyan> | <lvl>{message}</lvl>",
    )
    logger.add(
        os.path.join(config_dir, "logs", "runner_{time:YYMMDD!UTC}.log"),
        level="DEBUG",
        rotation="1 day",
        compression="zip",
    )

    if not operation.run():
        logger.error(f"failed to perform operation {operation.name}")
        return False

    _warn_outdated_version()
    return True


if __name__ == "__main__":
    sys.exit(main())
