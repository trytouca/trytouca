#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import argparse
import configparser
import os
import sys

from loguru import logger
from touca.cli._merge import Merge
from touca.cli._post import Post
from touca.cli._run import Run
from touca.cli._unzip import Unzip
from touca.cli._update import Update
from touca.cli._zip import Zip

config = configparser.ConfigParser()
options = {}


@logger.catch
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", nargs="?", help="mode help")

    appargs, modeargs = parser.parse_known_args()
    options = vars(appargs)
    if "mode" not in options.keys() or options.get("mode") is None:
        parser.print_help()
        return False

    operation_name = options.get("mode")
    operations = {
        "merge": lambda opt: Merge(opt),
        "post": lambda opt: Post(opt),
        "run": lambda opt: Run(opt),
        "unzip": lambda opt: Unzip(opt),
        "update": lambda opt: Update(opt),
        "zip": lambda opt: Zip(opt),
    }
    if operation_name not in operations:
        logger.error(f"invalid operation mode: {operation_name}")
        return False
    operation = operations.get(operation_name)(options)

    try:
        operation.parse(modeargs)
    except:
        operation.parser().print_help()
        return False

    if "touca-utils" in options.keys():
        if not os.path.exists(options.get("touca-utils")):
            logger.error(f"touca utils application does not exist")
            return False

    # configure logger

    logger.remove()
    logger.add(
        sys.stdout,
        level="DEBUG",
        colorize=True,
        format="<green>{time:HH:mm:ss!UTC}</green> | <cyan>{level: <7}</cyan> | <lvl>{message}</lvl>",
    )
    logger.add(
        "logs/runner_{time:YYMMDD!UTC}.log",
        level="DEBUG",
        rotation="1 day",
        compression="zip",
    )

    if not operation.run():
        logger.error(f"failed to perform operation {operation_name}")
        return False

    return True


if __name__ == "__main__":
    main()
