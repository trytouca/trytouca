# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from pathlib import Path

import pytest
from dataclasses import dataclass
from touca import __version__
from touca.cli.__main__ import main
from typing import List


@dataclass
class Home:
    current: Path
    plugins: Path
    profiles: Path
    results: Path
    settings: Path


@pytest.fixture
def home_path(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    cwd_path = tmp_path.joinpath("cwd")
    cwd_path.mkdir()
    monkeypatch.setattr(Path, "home", lambda: tmp_path)
    monkeypatch.setattr(Path, "cwd", lambda: cwd_path)
    home = Path.home().joinpath(".touca")
    return Home(
        cwd_path,
        home.joinpath("plugins"),
        home.joinpath("profiles"),
        home.joinpath("results"),
        home.joinpath("settings"),
    )


def test_cli_help_arg(capsys: pytest.CaptureFixture):
    assert main(["--help"]) == False
    captured = capsys.readouterr()
    assert "Work seamlessly with Touca from the command line." in captured.out
    assert "for more information." in captured.out
    assert not captured.err


def test_cli_version(capsys: pytest.CaptureFixture):
    """
    version command should print the Touca CLI version on stdout
    """
    assert main(["version"]) == False
    captured = capsys.readouterr()
    assert __version__ in captured.out
    assert not captured.err


@pytest.mark.usefixtures("home_path")
def test_cli_profile_list_pristine(capsys: pytest.CaptureFixture):
    assert main(["profile", "ls"]) == False
    captured = capsys.readouterr()
    assert "1   default (active)" in captured.out
    assert not captured.err


@pytest.mark.usefixtures("home_path")
def test_cli_profile_set_redundant(capsys: pytest.CaptureFixture):
    """
    setting profile that is already active should fast return without error
    """
    for i in range(2):
        assert main(["profile", "set", "hello"]) == False
        captured = capsys.readouterr()
        assert not captured.out
        assert not captured.err


@pytest.mark.usefixtures("home_path")
def test_cli_profile_copy_missing_profile(capsys: pytest.CaptureFixture):
    """
    Attempting to copy non-existent profile should fail
    """
    assert main(["profile", "cp", "unit_test", "new_unit_test"]) == True
    captured = capsys.readouterr()
    assert not captured.out
    assert 'profile "unit_test" does not exist' in captured.err


@pytest.mark.usefixtures("home_path")
def test_cli_profile_remove_default_profile(capsys: pytest.CaptureFixture):
    """
    Attempting to remove the default profile should fail
    """
    assert main(["profile", "rm", "default"]) == True
    captured = capsys.readouterr()
    assert not captured.out
    assert "refusing to remove default configuration file" in captured.err


@pytest.mark.usefixtures("home_path")
def test_cli_profile_remove_missing_profile(capsys: pytest.CaptureFixture):
    """
    Attempting to remove profile that does not exist should fail
    """
    assert main(["profile", "rm", "unit_test"]) == True
    captured = capsys.readouterr()
    assert not captured.out
    assert "profile does not exist" in captured.err


def test_cli_profile_set(capsys: pytest.CaptureFixture, home_path: Home):
    """
    Switching to missing profile should create the profile.
    We expect to see top-level `settings` file generated if it is missing.
    """
    assert not home_path.settings.exists()
    assert main(["profile", "set", "unit_test"]) == False
    captured = capsys.readouterr()
    assert not captured.out
    assert not captured.err
    assert home_path.settings.exists()
    assert "[settings]\nprofile = unit_test\n\n" == home_path.settings.read_text()
    assert home_path.profiles.joinpath("unit_test").exists()


def test_cli_profile_remove_non_default(capsys: pytest.CaptureFixture, home_path: Home):
    """
    Removing a non-default profile should switch to default profile.
    """
    assert not home_path.settings.exists()
    assert main(["profile", "set", "unit_test"]) == False
    assert main(["profile", "rm", "unit_test"]) == False
    captured = capsys.readouterr()
    assert not captured.out
    assert not captured.err
    assert not home_path.profiles.joinpath("unit_test").exists()
    assert "[settings]\nprofile = default\n\n" == home_path.settings.read_text()
    # we expect default profile to be missing since it was never directly used
    assert not home_path.profiles.joinpath("default").exists()


def test_cli_profile_copy_and_list(capsys: pytest.CaptureFixture, home_path: Home):
    """
    User copies existing profile to new profile.
    We expect the active profile to remain the same.
    """
    assert main(["profile", "set", "unit_test"]) == False
    assert main(["profile", "cp", "unit_test", "new_unit_test"]) == False
    assert home_path.profiles.joinpath("new_unit_test").exists()
    assert main(["profile", "ls"]) == False
    captured = capsys.readouterr()
    assert "1   new_unit_test" in captured.out
    assert "2   unit_test (active)" in captured.out
    assert not captured.err
    # When new profile is removed, we expect the active profile to remain the same
    assert main(["profile", "rm", "new_unit_test"]) == False
    assert not home_path.profiles.joinpath("new_unit_test").exists()
    assert "[settings]\nprofile = unit_test\n\n" == home_path.settings.read_text()


def test_cli_config_home(capsys: pytest.CaptureFixture, home_path: Home):
    assert main(["config", "home"]) == False
    captured = capsys.readouterr()
    assert captured.out == f"{home_path.profiles.parent}\n"
    assert not captured.err


@pytest.mark.usefixtures("home_path")
def test_cli_config_show_missing(capsys: pytest.CaptureFixture):
    assert main(["config", "show"]) == False
    captured = capsys.readouterr()
    assert not captured.out
    assert not captured.err


def _parse_rich_table(output: str):
    lines: List[str] = [x.strip().split(maxsplit=2) for x in output.splitlines()]
    assert 4 <= len(lines)
    assert lines[0] == []
    assert "───────────────────" in lines[2][0]
    assert lines[-1] == []
    for index in [-1, 2, 0]:
        del lines[index]
    return lines


@pytest.mark.usefixtures("home_path")
def test_cli_config_show_empty(capsys: pytest.CaptureFixture):
    assert main(["profile", "set", "test"]) == False
    assert main(["config", "show"]) == False
    captured = capsys.readouterr()
    assert _parse_rich_table(captured.out) == [["Option", "Value"]]
    assert not captured.err


@pytest.mark.usefixtures("home_path")
def test_cli_config_set_invalid(capsys: pytest.CaptureFixture):
    assert main(["config", "set", "api-key", "abcdefgh"]) == True
    captured = capsys.readouterr()
    assert 'Argument "api-key" has invalid format.' in captured.err
    assert not captured.out


@pytest.mark.usefixtures("home_path")
def test_cli_config_set_and_get(capsys: pytest.CaptureFixture):
    options = {"api-key": "abcdefgh", "team": "demo"}
    for key, value in options.items():
        assert main(["config", "set", f"{key}={value}"]) == False
        captured = capsys.readouterr()
        assert not captured.err
        assert not captured.out
    for key, value in options.items():
        assert main(["config", "get", key]) == False
        captured = capsys.readouterr()
        assert captured.out == f"{value}\n"
        assert not captured.err


@pytest.mark.usefixtures("home_path")
def test_cli_config_set_and_remove(capsys: pytest.CaptureFixture):
    options = {"api-key": "abcdefgh", "api-url": "api.example.com", "team": "demo"}
    for key, value in options.items():
        assert main(["config", "set", f"{key}={value}"]) == False
    assert main(["config", "rm", "api-url"]) == False
    assert main(["config", "show"]) == False
    captured = capsys.readouterr()
    assert _parse_rich_table(captured.out) == [
        ["Option", "Value"],
        ["1", "api-key", "abcdefgh"],
        ["2", "team", "demo"],
    ]
    assert not captured.err


@pytest.mark.usefixtures("home_path")
def test_cli_plugin_list_empty(capsys: pytest.CaptureFixture):
    assert main(["plugin", "ls"]) == False
    captured = capsys.readouterr()
    assert not captured.err
    assert not captured.out


def test_cli_plugin_new(capsys: pytest.CaptureFixture, home_path: Home):
    assert main(["plugin", "new", "sample"]) == False
    sample_file = home_path.current.joinpath("sample.py")
    assert sample_file.exists()
    captured = capsys.readouterr()
    assert not captured.err
    assert "Created plugin" in captured.out


def test_cli_plugin_add_and_list(capsys: pytest.CaptureFixture, home_path: Home):
    assert main(["plugin", "new", "sample"]) == False
    capsys.readouterr()
    assert main(["plugin", "add", "sample.py"]) == False
    captured = capsys.readouterr()
    assert not captured.err
    assert not captured.out
    assert home_path.plugins.joinpath("sample.py").exists()
    assert main(["plugin", "ls"]) == False
    captured = capsys.readouterr()
    assert not captured.err
    assert _parse_rich_table(captured.out) == [
        ["Name", "Description"],
        ["1", "sample", "Brief description of this plugin"],
    ]


def test_cli_plugin_add_and_remove(capsys: pytest.CaptureFixture, home_path: Home):
    assert main(["plugin", "new", "sample"]) == False
    capsys.readouterr()
    assert main(["plugin", "add", "sample.py"]) == False
    assert main(["plugin", "rm", "sample"]) == False
    captured = capsys.readouterr()
    assert not captured.err
    assert not captured.out
    assert not home_path.plugins.joinpath("sample.py").exists()


@pytest.mark.usefixtures("home_path")
def test_cli_plugin_add_and_help(capsys: pytest.CaptureFixture):
    assert main(["plugin", "new", "sample"]) == False
    assert main(["plugin", "add", "sample.py"]) == False
    capsys.readouterr()
    assert main(["help"]) == False
    captured = capsys.readouterr()
    assert not captured.err
    assert "Brief description of this plugin" in captured.out


@pytest.mark.usefixtures("home_path")
def test_cli_plugin_add_installed(capsys: pytest.CaptureFixture):
    assert main(["plugin", "new", "sample"]) == False
    assert main(["plugin", "add", "sample"]) == False
    capsys.readouterr()
    assert main(["plugin", "add", "sample"]) == True
    captured = capsys.readouterr()
    assert not captured.out
    assert 'plugin "sample" is already installed' in captured.err


@pytest.mark.usefixtures("home_path")
def test_cli_plugin_add_missing(capsys: pytest.CaptureFixture):
    assert main(["plugin", "add", "sample"]) == True
    captured = capsys.readouterr()
    assert not captured.out
    assert 'plugin "sample" is missing' in captured.err


@pytest.mark.usefixtures("home_path")
def test_cli_plugin_remove_missing(capsys: pytest.CaptureFixture):
    assert main(["plugin", "rm", "sample"]) == True
    captured = capsys.readouterr()
    assert not captured.out
    assert 'plugin "sample" is missing' in captured.err
