# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import os


def run_cmd(cmd, file_out, file_err):
    from subprocess import Popen

    ensure_mkdir = lambda a: os.makedirs(
        os.path.abspath(os.path.join(a, os.pardir)), exist_ok=True
    )
    ensure_mkdir(file_out)
    ensure_mkdir(file_err)
    with open(file_out, "w") as fout, open(file_err, "w") as ferr:
        proc = Popen(cmd, universal_newlines=True, stdout=fout, stderr=ferr)
        code = proc.wait()
    return code
