# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from pathlib import Path

import pytest
from touca import __version__
from touca.cli.__main__ import main


def test_cli_basic(capsys: pytest.CaptureFixture):
    main(["--help"])
    captured = capsys.readouterr()
    assert "Work seamlessly with Touca from the command line." in captured.out


def test_cli_version(capsys: pytest.CaptureFixture):
    assert main(["version"]) == False
    captured = capsys.readouterr()
    assert __version__ in captured.out
    assert not captured.err


def test_cli_profile_list(capsys: pytest.CaptureFixture):
    assert main(["profile", "ls"]) == False
    captured = capsys.readouterr()
    assert "default" in captured.out
    assert not captured.err


def test_cli_profile_set(capsys: pytest.CaptureFixture):
    assert main(["profile", "set", "unit_test"]) == False
    captured = capsys.readouterr()
    assert not captured.out
    assert not captured.err
    home_dir = Path.home().joinpath(".touca")
    settings_path = home_dir.joinpath("settings")
    assert settings_path.exists()
    assert "[settings]\nprofile = unit_test\n\n" == settings_path.read_text()

    assert main(["profile", "cp", "unit_test", "new_unit_test"]) == False
    assert main(["profile", "rm", "new_unit_test"]) == False
    assert main(["profile", "rm", "unit_test"]) == False
    assert "[settings]\nprofile = default\n\n" == settings_path.read_text()
    assert main(["profile", "rm", "default"]) == True
    captured = capsys.readouterr()
    assert not captured.out
    assert captured.err == "refusing to remove default configuration file\n"
