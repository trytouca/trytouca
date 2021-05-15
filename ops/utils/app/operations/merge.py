#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

import os
from collections import ChainMap
from argparse import ArgumentParser, ArgumentTypeError
import logging

from operation import Operation
from common import run_cmd

logger = logging.getLogger(__name__)

def utils_merge(srcDir, dstDir, utilsApp):
    """
    """
    if not os.path.exists(srcDir):
        logger.error(f'expected directory {srcDir} to exist')
        return False
    logger.info(f'merging result directory {srcDir} into {dstDir}')
    runCmd = [utilsApp, 'merge', f'--src={srcDir}', f'--out={dstDir}']
    dstDirName = os.path.basename(srcDir)
    file_out = os.path.join('D:\\Meerkat\\Lab\\Logs', 'zipit', dstDirName) + '-merge.log'
    exit_status = run_cmd(runCmd, file_out=file_out, file_err=file_out)
    if 0 != exit_status:
        logger.warning(f'failed to merge {srcDir}')
        if exit_status is not None:
            logger.warning(f'program Touca Utils returned code {exit_status}')
        return False
    logger.info(f'merged {srcDir}')
    return True

class Merge(Operation):

    def __init__(self, options: dict):
        self.__options = options

    def name(self) -> str:
        return 'merge'

    def parser(self) -> ArgumentParser:
        parser = ArgumentParser()
        parser.add_argument('--src', help='src help')
        parser.add_argument('--out', help='out help')
        return parser

    def parse(self, args):
        parsed, _ = self.parser().parse_known_args(args)
        for key in ['src', 'out']:
            if key not in vars(parsed).keys() or vars(parsed).get(key) is None:
                raise ArgumentTypeError(f'missing key: {key}')
        self.__options = { **self.__options, **vars(parsed) }

    def run(self) -> bool:
        inDir = self.__options.get('src')
        outDir = self.__options.get('out')
        utilsApp = 'fullpath/to/touca_cli'

        if not os.path.exists(inDir):
            logger.error(f'directory {inDir} does not exist')
            return False
        if not os.path.exists(outDir):
            os.makedirs(outDir)
        for fselement in os.listdir(inDir):
            srcDir = os.path.join(inDir, fselement)
            if not os.path.isdir(srcDir):
                continue
            if srcDir.endswith('-merged'):
                continue
            dstDirName = os.path.basename(srcDir) + '-merged'
            dstDir = os.path.join(outDir, dstDirName)
            if os.path.exists(dstDir):
                continue
            logger.info(f'merging {srcDir}')
            if not utils_merge(srcDir, dstDir, utilsApp):
                logger.error(f'failed to merge {srcDir}')
                return False
        logger.info('merged all result directories')
        return True
