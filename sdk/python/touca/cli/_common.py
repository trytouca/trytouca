# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import os
import subprocess


def run_cmd(cmd, file_out, file_err):
    ensure_mkdir = lambda a: os.makedirs(
        os.path.abspath(os.path.join(a, os.pardir)), exist_ok=True
    )
    ensure_mkdir(file_out)
    ensure_mkdir(file_err)
    with open(file_out, "w") as fout, open(file_err, "w") as ferr:
        proc = subprocess.Popen(cmd, universal_newlines=True, stdout=fout, stderr=ferr)
        code = proc.wait()
    return code
