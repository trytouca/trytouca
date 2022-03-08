# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import argparse
import os
import sys

from loguru import logger
from touca import __version__
from touca._options import find_config_dir
from touca._printer import Printer
from touca.cli._execute import Execute
from touca.cli._merge import Merge
from touca.cli._post import Post
from touca.cli._run import Run
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
    operations = {
        "merge": lambda opt: Merge(opt),
        "post": lambda opt: Post(opt),
        "run": lambda opt: Run(opt),
        "test": lambda opt: Execute(opt),
        "unzip": lambda opt: Unzip(opt),
        "update": lambda opt: Update(opt),
        "zip": lambda opt: Zip(opt),
    }
    parser = argparse.ArgumentParser(
        description="Work seamlessly with Touca from the command line.",
        add_help=True,
        formatter_class=argparse.RawTextHelpFormatter,
        epilog="See https://touca.io/docs for more information.",
    )
    parser.add_argument(
        "-v", "--version", action="version", version=f"%(prog)s v{__version__}"
    )
    parser.add_argument(
        "command",
        nargs="?",
        choices=operations.keys(),
        help="one of " + ", ".join([f'"{k}"' for k in operations.keys()]),
        metavar="command",
        default="test",
    )
    parsed, remaining = parser.parse_known_args(sys.argv[1:] if args is None else args)
    options = vars(parsed)

    operation_name = options.get("command")
    if operation_name not in operations:
        logger.error(f"invalid command: {operation_name}")
        return False
    operation = operations.get(operation_name)(options)

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

    config_dir = find_config_dir(mkdir=True)

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
        logger.error(f"failed to perform operation {operation_name}")
        return False

    _warn_outdated_version()
    return True


if __name__ == "__main__":
    sys.exit(main())
