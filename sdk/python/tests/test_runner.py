# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import os
import pytest
from _pytest.capture import CaptureResult
from tempfile import TemporaryDirectory
from touca._runner import (
    run,
    run_workflows,
    _update_testcase_list,
    _ToucaError,
    _ToucaErrorCode,
    _Workflow,
)


def check_stats(checks: dict, captured: CaptureResult):
    for key, values in checks.items():
        import re

        line = next(x for x in captured.out.splitlines() if key in x)
        # remove ANSI escape sequences
        text = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])").sub("", line)
        for value in values:
            assert value in text


def test_empty_workflow():
    with pytest.raises(_ToucaError, match="No workflow is registered."):
        run()


def test_no_case_missing_remote():
    with pytest.raises(_ToucaError) as err:
        run_workflows(
            {"team": "acme", "suite": "students", "version": "1.0"},
            [_Workflow(lambda x: None, name="sample")],
        )
    assert err.value._code == _ToucaErrorCode.NoCaseMissingRemote


def test_run_twice(capsys: pytest.CaptureFixture):
    args = {
        "team": "acme",
        "suite": "students",
        "version": "1.0",
        "save-as-binary": True,
        "save-as-json": True,
        "offline": True,
        "testcases": ["alice", "bob"],
    }
    with TemporaryDirectory(prefix="touca-python-test") as tempdir:
        args.update({"output-directory": tempdir})
        run_workflows(args, [_Workflow(lambda x: None, name="sample")])
        captured = capsys.readouterr()
        checks = {"alice": ["1.", "SENT"], "bob": ["2.", "SENT"]}
        check_stats(checks, captured)
        assert captured.err == ""
        run_workflows(args, [_Workflow(lambda x: None, name="sample")])  # rerun test
        captured = capsys.readouterr()
        checks = {"alice": ["1.", "SKIP"], "bob": ["2.", "SKIP"]}
        assert captured.err == ""


def test_testcase_list():
    with TemporaryDirectory(prefix="touca-python-test") as tempdir:
        tempfile = os.path.join(tempdir, "list.txt")
        with open(tempfile, "wt") as file:
            file.write("alice\nbob\ncharlie\n\n#david\n")
        options = {"testcase-file": tempfile, "testcases": []}
        _update_testcase_list(options)
        testcases = options.get("testcases")
        assert testcases == ["alice", "bob", "charlie"]
