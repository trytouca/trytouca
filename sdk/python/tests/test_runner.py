# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from pathlib import Path
from tempfile import TemporaryDirectory

import pytest
from _pytest.capture import CaptureResult
from touca._options import ToucaError
from touca._runner import run, run_workflows


@pytest.fixture
def home_path(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    cwd_path = tmp_path.joinpath("cwd")
    cwd_path.mkdir()
    monkeypatch.setattr(Path, "home", lambda: tmp_path)
    monkeypatch.setattr(Path, "cwd", lambda: cwd_path)


def check_stats(checks: dict, captured: CaptureResult):
    for key, values in checks.items():
        import re

        line = next(x for x in captured.out.splitlines() if key in x)
        # remove ANSI escape sequences
        text = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])").sub("", line)
        for value in values:
            assert value in text


@pytest.mark.usefixtures("home_path")
def test_empty_workflow():
    with pytest.raises(SystemExit, match="No workflow is registered."):
        run()


@pytest.mark.usefixtures("home_path")
def test_no_case_missing_remote():
    with pytest.raises(ToucaError) as err:
        run_workflows(
            {
                "team": "acme",
                "suite": "students",
                "version": "1.0",
                "workflows": [{"callback": lambda x: None, "suite": "sample"}],
            },
        )
    assert str(err.value) == 'Configuration option "testcases" is missing.'


@pytest.mark.usefixtures("home_path")
def test_run_twice(capsys: pytest.CaptureFixture):
    args = {
        "team": "acme",
        "suite": "students",
        "version": "1.0",
        "save-as-binary": True,
        "save-as-json": True,
        "offline": True,
        "testcases": ["alice", "bob"],
        "workflows": [{"callback": lambda x: None, "suite": "sample"}],
    }
    with TemporaryDirectory(prefix="touca-python-test") as tempdir:
        args.update({"output-directory": tempdir})
        run_workflows(args)
        captured = capsys.readouterr()
        checks = {"alice": ["1.", "SENT"], "bob": ["2.", "SENT"]}
        check_stats(checks, captured)
        assert captured.err == ""
        run_workflows(args)  # rerun test
        captured = capsys.readouterr()
        checks = {"alice": ["1.", "SKIP"], "bob": ["2.", "SKIP"]}
        assert captured.err == ""
