#!/usr/bin/env python
# -*- coding: utf-8 -*-

from argparse import ArgumentParser, ArgumentTypeError
from collections import ChainMap
from distutils.version import LooseVersion
import logging
import os
import time

from operation import Operation
from common import run_cmd

logger = logging.getLogger(__name__)

def utils_update(srcDir, outDir, teamslug, testsuite, utilsApp):
    """
    """
    srcDir += '-merged'
    if not os.path.exists(srcDir):
        logger.error(f'expected directory {srcDir} to exist')
        return False
    logger.info(f'updating result directory {srcDir}')
    runCmd = [utilsApp, 'update', f'--src={srcDir}', f'--out={outDir}', f'--teamslug={teamslug}', f'--testsuite={testsuite}']
    logger.info("running %s", ' '.join(runCmd))
    dstDirName = os.path.basename(srcDir)
    file_out = os.path.join('D:\\Meerkat\\Lab\\Logs', 'zipit', dstDirName) + '-update.log'
    exit_status = run_cmd(runCmd, file_out=file_out, file_err=file_out)
    if 0 != exit_status:
        logger.warning(f'failed to update {srcDir}')
        if exit_status is not None:
            logger.warning(f'program Weasel Utils returned code {exit_status}')
        return False
    logger.info(f'updateed {srcDir}')
    return True

class Update(Operation):

    def __init__(self, options: dict):
        self.__options = options

    def name(self) -> str:
        return 'update'

    def parser(self) -> ArgumentParser:
        parser = ArgumentParser()
        parser.add_argument('--src', help='src help')
        parser.add_argument('--out', help='out help')
        parser.add_argument('--teamslug', help='teamslug help')
        parser.add_argument('--testsuite', help='testsuite help')
        return parser

    def parse(self, args):
        parsed, _ = self.parser().parse_known_args(args)
        for key in ['src', 'out', 'teamslug', 'testsuite']:
            if key not in vars(parsed).keys() or vars(parsed).get(key) is None:
                raise ArgumentTypeError(f'missing key: {key}')
        self.__options = { **self.__options, **vars(parsed) }

    def run(self) -> bool:
        srcDir = self.__options.get('src')
        outDir = self.__options.get('out')
        teamslug = self.__options.get('teamslug')
        testsuite = self.__options.get('testsuite')
        utilsApp = "fullpath/to/weasel_cli"

        if not os.path.exists(srcDir):
            logger.error(f'directory {srcDir} does not exist')
            return False
        batchNames = []
        for batchName in os.listdir(srcDir):
            batchDir = os.path.join(srcDir, batchName)
            if not os.path.isdir(batchDir):
                continue
            if not batchDir.endswith('-merged'):
                continue
            batchNames.append(batchName[:-7])

        if not batchNames:
            logger.info(f'found no valid result directory to update')
            return True

        # sort list of versions lexicographically
        batchNames.sort(key=LooseVersion)

        logger.info(f'updateing batches one by one')
        for batchName in batchNames:
            batchDir = os.path.join(srcDir, batchName)
            logger.info(f'updateing {batchDir}')
            if not utils_update(batchDir, os.path.join(outDir, batchName), teamslug, testsuite, utilsApp):
                logger.error(f'failed to update {batchDir}')
                return False
        logger.info('updateed all result directories')
        return True
