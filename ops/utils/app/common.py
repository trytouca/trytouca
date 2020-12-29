#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

import logging
import os
import subprocess

logger = logging.getLogger(__name__)

def run_cmd(cmd, file_out, file_err):
    """
    """
    ensure_mkdir = lambda a : os.makedirs(os.path.abspath(os.path.join(a, os.pardir)), exist_ok=True)
    ensure_mkdir(file_out)
    ensure_mkdir(file_err)
    logger.debug('running cmd: << {} >>'.format(' '.join(cmd)))
    with open(file_out, 'w') as fout, open(file_err, 'w') as ferr:
        proc = subprocess.Popen(cmd,
            universal_newlines=True,
            stdout=fout,
            stderr=ferr)
        code = proc.wait()
    return code
