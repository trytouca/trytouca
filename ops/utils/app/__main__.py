#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

#!/usr/bin/env python

import argparse
import importlib
import configparser
import logging
import os

import sys
from logging import handlers

from common import run_cmd

logger = logging.getLogger(__name__)
config = configparser.ConfigParser()
options = {}

def main():
    """
    """

    parser = argparse.ArgumentParser()
    parser.add_argument('mode', nargs='?', help='mode help')

    appargs, modeargs = parser.parse_known_args()
    options = vars(appargs)
    if 'mode' not in options.keys() or options.get('mode') is None:
        logger.fatal('expected operation mode')
        parser.print_help()
        return False

    operation_name = options.get('mode')
    module_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'operations', operation_name + '.py')
    if not os.path.exists(module_path):
        logger.fatal(f'invalid operation mode: {operation_name}')
        return False
    module_name = f'operations.{operation_name}'
    operation_module = getattr(importlib.import_module(module_name), operation_name.capitalize(), None)
    if not operation_module:
        logger.fatal(f'unrecognized operational mode: {operation_name}')
        return False
    operation = operation_module(options)

    try:
        operation.parse(modeargs)
    except:
        logger.warning('failed to parse command line arguments')
        operation.parser().print_help()
        return False

    if 'touca-utils' in options.keys():
        if not os.path.exists(options.get('touca-utils')):
            logger.fatal(f'touca utils application does not exist')
            return False

    logHandlers = []
    logHandlers.append(logging.StreamHandler(sys.stdout))
    if 'log-directory' in options.keys():
        if not os.path.exists(options.get('log-directory')):
            os.makedirs(options.get('log-directory'))
        logFile = os.path.join(options.get('log-directory'), "zipit.log")
        logHandlers.append(logging.handlers.TimedRotatingFileHandler(logFile, when='h', interval=1))
    logging.basicConfig(
        format='%(asctime)s %(levelname)s [%(name)s.%(funcName)s:%(lineno)d] %(message)s',
        datefmt='%m/%d/%Y %H:%M:%S',
        level=logging.INFO,
        handlers=logHandlers
    )

    if not operation.run():
        logger.warning(f'failed to perform operation {operation_name}')
        return False

    return True

if __name__ == '__main__':
    main()
