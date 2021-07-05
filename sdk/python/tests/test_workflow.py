#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import pytest
from touca._workflow import run, _run, Workflow, _ToucaError, _ToucaErrorCode

slugs = ["--team", "acme", "--suite", "students", "--revision", "1.0"]
extra = ["--save-as-binary", "false", "--offline", "true"]


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


def test_one_off_case(single_workflow, capsys: pytest.CaptureFixture):
    args = []
    args.extend(slugs)
    args.extend(extra)
    args.extend(["--testcase", "alice", "--testcase", "bob"])
    _run(args)
    captured = capsys.readouterr()
    assert captured.err == ""
    checks = {"alice": ["(  1 of 2  )", "pass"], "bob": ["(  2 of 2  )", "pass"]}
    for key, values in checks.items():
        line = next(x for x in captured.out.splitlines() if key in x)
        for value in values:
            assert value in line
