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

def utils_post(srcDir, apiKey, apiUrl, utilsApp):
    """
    """
    srcDir += '-merged'
    if not os.path.exists(srcDir):
        logger.error(f'expected directory {srcDir} to exist')
        return False
    logger.info(f'posting result directory {srcDir}')
    runCmd = [utilsApp, 'post', f'--src={srcDir}', f'--api-key={apiKey}', f'--api-url={apiUrl}']
    logger.info("running %s", ' '.join(runCmd))
    dstDirName = os.path.basename(srcDir)
    file_out = os.path.join('D:\\Meerkat\\Lab\\Logs', 'zipit', dstDirName) + '-post.log'
    exit_status = run_cmd(runCmd, file_out=file_out, file_err=file_out)
    if 0 != exit_status:
        logger.warning(f'failed to post {srcDir}')
        if exit_status is not None:
            logger.warning(f'program Weasel Utils returned code {exit_status}')
        return False
    logger.info(f'posted {srcDir}')
    return True

class Post(Operation):

    def __init__(self, options: dict):
        self.__options = options

    def name(self) -> str:
        return 'post'

    def parser(self) -> ArgumentParser:
        parser = ArgumentParser()
        parser.add_argument('--src', help='src help')
        parser.add_argument('--api-key', help='api key help')
        parser.add_argument('--api-url', help='api url help')
        return parser

    def parse(self, args):
        parsed, _ = self.parser().parse_known_args(args)
        for key in ['src', 'api_key', 'api_url']:
            if key not in vars(parsed).keys() or vars(parsed).get(key) is None:
                raise ArgumentTypeError(f'missing key: {key}')
        self.__options = { **self.__options, **vars(parsed) }

    def run(self) -> bool:
        srcDir = self.__options.get('src')
        apiKey = self.__options.get('api_key')
        apiUrl = self.__options.get('api_url')
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
            logger.info(f'found no valid result directory to post')
            return True

        # sort list of versions lexicographically
        batchNames.sort(key=LooseVersion)

        logger.info(f'posting batches one by one')
        for batchName in batchNames:
            batchDir = os.path.join(srcDir, batchName)
            logger.info(f'posting {batchDir}')
            if not utils_post(batchDir, apiKey, apiUrl, utilsApp):
                logger.error(f'failed to post {batchDir}')
                return False
            time.sleep(60)
        logger.info('posted all result directories')
        return True
