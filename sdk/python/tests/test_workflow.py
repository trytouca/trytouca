# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import os
import pytest
from _pytest.capture import CaptureResult
from tempfile import TemporaryDirectory
from touca._workflow import (
    run,
    Workflow,
    _run,
    _update_testcase_list,
    _ToucaError,
    _ToucaErrorCode,
)

slugs = ["--team", "acme", "--suite", "students", "--revision", "1.0"]
extra = ["--save-as-binary", "true", "--save-as-json", "true", "--offline", "true"]


def check_stats(checks: dict, captured: CaptureResult):
    for key, values in checks.items():
        import re

        line = next(x for x in captured.out.splitlines() if key in x)
        # remove ANSI escape sequences
        text = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])").sub("", line)
        for value in values:
            assert value in text


@pytest.fixture
def single_workflow():
    Workflow._workflows = []
    Workflow._workflows.append(lambda x: None)


def test_empty_workflow():
    with pytest.raises(SystemExit, match="No workflow is registered."):
        run()


def test_no_case_missing_remote(single_workflow):
    with pytest.raises(_ToucaError) as err:
        _run(["--team", "acme", "--suite", "students", "--revision", "1.0"])
    assert err.value._code == _ToucaErrorCode.NoCaseMissingRemote


def test_run_twice(single_workflow, capsys: pytest.CaptureFixture):
    args = []
    args.extend(slugs)
    args.extend(extra)
    args.extend(["--testcase", "alice", "--testcase", "bob"])
    with TemporaryDirectory(prefix="touca-python-test") as tempdir:
        args.extend(["--output-directory", tempdir])
        _run(args)
        captured = capsys.readouterr()
        checks = {"alice": ["1.", "PASS"], "bob": ["2.", "PASS"]}
        check_stats(checks, captured)
        assert captured.err == ""
        _run(args)  # rerun test
        captured = capsys.readouterr()
        checks = {"alice": ["1.", "SKIP"], "bob": ["2.", "SKIP"]}
        assert captured.err == ""


def test_testcase_list():
    with TemporaryDirectory(prefix="touca-python-test") as tempdir:
        tempfile = os.path.join(tempdir, "list.txt")
        with open(tempfile, "wt") as file:
            file.write("alice\nbob\ncharlie\n\n#david\n")
        options = {"testcase_file": tempfile, "testcases": []}
        _update_testcase_list(options)
        testcases = options.get("testcases")
        assert testcases == ["alice", "bob", "charlie"]
