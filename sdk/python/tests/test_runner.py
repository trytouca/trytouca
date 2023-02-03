# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import json
from pathlib import Path
from tempfile import TemporaryDirectory

import pytest
from _pytest.capture import CaptureResult
from touca._options import ToucaError, update_runner_options
from touca._runner import run, run_workflows
from touca._transport import Transport


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


@pytest.fixture
def sample_workflow():
    return {
        "team": "acme",
        "suite": "students",
        "version": "1.0",
        "workflows": [{"callback": lambda x: None, "testcases": ["a"]}],
    }


@pytest.mark.usefixtures("home_path")
def test_configure_by_file_empty(sample_workflow):
    with TemporaryDirectory() as tmpdir_name:
        file = Path(tmpdir_name).joinpath("some_file")
        file.write_text(json.dumps({"touca": {}}))
        sample_workflow["config_file"] = file
        run_workflows(sample_workflow)


@pytest.mark.usefixtures("home_path")
def test_configure_by_file_missing(sample_workflow):
    with pytest.raises(ToucaError, match="file does not exist"):
        sample_workflow["config_file"] = "missing_file"
        run_workflows(sample_workflow)


@pytest.mark.usefixtures("home_path")
def test_configure_by_file_plaintext(sample_workflow):
    with TemporaryDirectory() as tmpdir_name:
        file = Path(tmpdir_name).joinpath("some_file")
        file.write_text("touca")
        sample_workflow["config_file"] = file
        with pytest.raises(ToucaError, match="file has an unexpected format"):
            run_workflows(sample_workflow)


@pytest.mark.usefixtures("home_path")
def test_configure_by_file_invalid(sample_workflow):
    with TemporaryDirectory() as tmpdir_name:
        file = Path(tmpdir_name).joinpath("some_file")
        file.write_text(json.dumps({"field": {}}))
        sample_workflow["config_file"] = file
        with pytest.raises(ToucaError, match="file has an unexpected format"):
            run_workflows(sample_workflow)


@pytest.mark.usefixtures("home_path")
def test_configure_by_file_full(monkeypatch, sample_workflow):
    monkeypatch.setenv("TOUCA_API_KEY", "sample_touca_key")
    monkeypatch.setenv("TOUCA_TEST_VERSION", "v1.0")
    with TemporaryDirectory() as tmpdir_name:
        file = Path(tmpdir_name).joinpath("some_file")
        file.write_text(
            json.dumps(
                {
                    "touca": {
                        "api-key": "to be overwritten",
                        "api-url": "https://api.touca.io/v1/@/acme/students",
                        "offline": True,
                    }
                }
            )
        )
        sample_workflow["config_file"] = file
        update_runner_options(sample_workflow, transport=Transport())
        for key, value in dict(
            {
                "api_url": "https://api.touca.io/v1",
                "api_key": "sample_touca_key",
                "offline": True,
                "team": "acme",
                "concurrency": True,
                "workflows": [
                    {
                        "callback": sample_workflow["workflows"][0]["callback"],
                        "suite": "students",
                        "version": "v1.0",
                        "testcases": ["a"],
                    }
                ],
            }
        ).items():
            assert sample_workflow[key] == value


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
